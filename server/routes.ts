import type { AnalyticsBooking } from "./analytics/types";
import {
  countBookings,
  countUniqueGuests,
  filterBookingsByPeriod,
} from "./analytics/bookings";
import {
  calculateAverageDailyRate,
  calculateTotalRevenue,
} from "./analytics/revenue";
import {
  calculateOccupancyRate,
  calculateRevPAR,
  calculateTotalRoomNights,
} from "./analytics/occupancy";
import type { Express } from "express";
import { createServer, type Server } from "http";
import {
  storage,
  type Department,
  type InsertDepartmentSale,
} from "./storage";
import { insertBookingSchema } from "@shared/schema";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

// Set timezone to Lagos
process.env.TZ = "Africa/Lagos";
function normalizeSalesDepartment(
  value: unknown
): Department | null {
  if (typeof value !== "string") {
    return null;
  }

  const department = value.trim().toLowerCase();

  if (
    department === "restaurant" ||
    department === "kitchen"
  ) {
    return "kitchen";
  }

  if (department === "bar") {
    return "bar";
  }

  return null;
}
type RoomAnalyticsDefinition = {
  roomType: string;
  roomIds: string[];
  roomCount: number;
  defaultNightlyRate: number;
};

type RoomStatsResult = {
  roomType: string;
  roomCount: number;
  nightlyRate: number;

  monthlyBookings: number;
  yearlyBookings: number;

  monthlyRevenue: number;
  yearlyRevenue: number;

  monthlyRoomNights: number;
  yearlyRoomNights: number;

  monthlyOccupancyRate: number;
  yearlyOccupancyRate: number;
};

const ROOM_ANALYTICS_DEFINITIONS: RoomAnalyticsDefinition[] = [
  {
    roomType: "King Suite",
    roomIds: ["206"],
    roomCount: 1,
    defaultNightlyRate: 50000,
  },
  {
    roomType: "Queen Suite",
    roomIds: ["204"],
    roomCount: 1,
    defaultNightlyRate: 40000,
  },
  {
    roomType: "Deluxe Room",
    roomIds: [
      "101",
      "102",
      "201",
      "202",
      "203",
      "205",
    ],
    roomCount: 6,
    defaultNightlyRate: 30000,
  },
  {
    roomType: "Standard Room",
    roomIds: ["103"],
    roomCount: 1,
    defaultNightlyRate: 23000,
  },
];

function startOfLocalDay(value: Date): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addLocalDays(
  value: Date,
  numberOfDays: number
): Date {
  const date = new Date(value);
  date.setDate(date.getDate() + numberOfDays);
  return date;
}

function countPeriodDays(
  periodStart: Date,
  periodEnd: Date
): number {
  const start = startOfLocalDay(periodStart);
  const endExclusive = addLocalDays(
    startOfLocalDay(periodEnd),
    1
  );

  const difference =
    endExclusive.getTime() - start.getTime();

  return Math.max(
    1,
    Math.round(
      difference / (1000 * 60 * 60 * 24)
    )
  );
}

function calculateBookingNightsWithinPeriod(
  booking: AnalyticsBooking,
  periodStart: Date,
  periodEnd: Date
): number {
  const bookingStart = startOfLocalDay(
    booking.checkIn
  );

  const bookingEnd = startOfLocalDay(
    booking.checkOut
  );

  const rangeStart = startOfLocalDay(
    periodStart
  );

  const rangeEndExclusive = addLocalDays(
    startOfLocalDay(periodEnd),
    1
  );

  const overlapStart = new Date(
    Math.max(
      bookingStart.getTime(),
      rangeStart.getTime()
    )
  );

  const overlapEnd = new Date(
    Math.min(
      bookingEnd.getTime(),
      rangeEndExclusive.getTime()
    )
  );

  if (overlapEnd <= overlapStart) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(
      (overlapEnd.getTime() -
        overlapStart.getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
}

function getRoomDefinition(
  roomId: string
): RoomAnalyticsDefinition | undefined {
  const normalizedRoomId = String(
    roomId
  ).trim();

  return ROOM_ANALYTICS_DEFINITIONS.find(
    (definition) =>
      definition.roomIds.includes(
        normalizedRoomId
      )
  );
}

function buildRoomStats(
  allBookings: AnalyticsBooking[],
  selectedPeriodBookings: AnalyticsBooking[],
  selectedPeriodStart: Date,
  selectedPeriodEnd: Date
): RoomStatsResult[] {
  const selectedYear =
    selectedPeriodStart.getFullYear();

  const yearStart = new Date(
    selectedYear,
    0,
    1
  );

  const yearEnd = new Date(
    selectedYear,
    11,
    31
  );

  yearStart.setHours(0, 0, 0, 0);
  yearEnd.setHours(23, 59, 59, 999);

  const yearlyBookings =
    filterBookingsByPeriod(
      allBookings,
      yearStart,
      yearEnd
    );

  const selectedPeriodDays =
    countPeriodDays(
      selectedPeriodStart,
      selectedPeriodEnd
    );

  const yearDays = countPeriodDays(
    yearStart,
    yearEnd
  );

  return ROOM_ANALYTICS_DEFINITIONS.map(
    (definition) => {
      const monthlyRoomBookings =
        selectedPeriodBookings.filter(
          (booking) =>
            definition.roomIds.includes(
              String(booking.roomId)
            )
        );

      const yearlyRoomBookings =
        yearlyBookings.filter((booking) =>
          definition.roomIds.includes(
            String(booking.roomId)
          )
        );

      const monthlyRoomNights =
        monthlyRoomBookings.reduce(
          (total, booking) =>
            total +
            calculateBookingNightsWithinPeriod(
              booking,
              selectedPeriodStart,
              selectedPeriodEnd
            ),
          0
        );

      const yearlyRoomNights =
        yearlyRoomBookings.reduce(
          (total, booking) =>
            total +
            calculateBookingNightsWithinPeriod(
              booking,
              yearStart,
              yearEnd
            ),
          0
        );

      const monthlyRevenue =
        monthlyRoomBookings.reduce(
          (total, booking) => {
            const nights =
              calculateBookingNightsWithinPeriod(
                booking,
                selectedPeriodStart,
                selectedPeriodEnd
              );

            return (
              total +
              nights * booking.nightlyRate
            );
          },
          0
        );

      const yearlyRevenue =
        yearlyRoomBookings.reduce(
          (total, booking) => {
            const nights =
              calculateBookingNightsWithinPeriod(
                booking,
                yearStart,
                yearEnd
              );

            return (
              total +
              nights * booking.nightlyRate
            );
          },
          0
        );

      const monthlyAvailableRoomNights =
        definition.roomCount *
        selectedPeriodDays;

      const yearlyAvailableRoomNights =
        definition.roomCount * yearDays;

      const monthlyOccupancyRate =
        monthlyAvailableRoomNights > 0
          ? Math.min(
              100,
              (monthlyRoomNights /
                monthlyAvailableRoomNights) *
                100
            )
          : 0;

      const yearlyOccupancyRate =
        yearlyAvailableRoomNights > 0
          ? Math.min(
              100,
              (yearlyRoomNights /
                yearlyAvailableRoomNights) *
                100
            )
          : 0;

      const averageRecordedRate =
        monthlyRoomBookings.length > 0
          ? monthlyRoomBookings.reduce(
              (total, booking) =>
                total +
                booking.nightlyRate,
              0
            ) /
            monthlyRoomBookings.length
          : definition.defaultNightlyRate;

      return {
        roomType: definition.roomType,
        roomCount: definition.roomCount,
        nightlyRate: averageRecordedRate,

        monthlyBookings:
          monthlyRoomBookings.length,

        yearlyBookings:
          yearlyRoomBookings.length,

        monthlyRevenue,
        yearlyRevenue,

        monthlyRoomNights,
        yearlyRoomNights,

        monthlyOccupancyRate,
        yearlyOccupancyRate,
      };
    }
  );
}

function getRoomStatsLeader(
  roomStats: RoomStatsResult[],
  field:
    | "monthlyBookings"
    | "yearlyBookings"
    | "monthlyRevenue"
    | "yearlyRevenue"
    | "monthlyOccupancyRate"
): RoomStatsResult | null {
  if (roomStats.length === 0) {
    return null;
  }

  return roomStats.reduce(
    (leader, room) =>
      room[field] > leader[field]
        ? room
        : leader
  );
}

function getLeastBookedRoom(
  roomStats: RoomStatsResult[]
): RoomStatsResult | null {
  if (roomStats.length === 0) {
    return null;
  }

  return roomStats.reduce(
    (lowest, room) =>
      room.monthlyBookings <
      lowest.monthlyBookings
        ? room
        : lowest
  );
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/rooms", async (_req, res) => {
    const rooms = await storage.getRooms();
    res.json(rooms);
  });

  app.get("/api/bookings", async (_req, res) => {
  const bookings = await storage.getBookings();
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const active = bookings.filter(b => new Date(b.checkOut) >= now);
  res.json(active);
});

app.get("/api/bookings/stats", async (_req, res) => {
  const all = await storage.getAllBookings();
  res.json(all);
  console.log("Stats bookings:", all.length);
console.log(all);
});

app.get("/api/analytics", async (req, res) => {
  try {
    const now = new Date();

    const defaultStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const defaultEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    );

    const periodStart = req.query.start
      ? new Date(String(req.query.start))
      : defaultStart;

    const periodEnd = req.query.end
      ? new Date(String(req.query.end))
      : defaultEnd;

    periodStart.setHours(0, 0, 0, 0);
    periodEnd.setHours(23, 59, 59, 999);

    if (
      Number.isNaN(periodStart.getTime()) ||
      Number.isNaN(periodEnd.getTime())
    ) {
      return res.status(400).json({
        error: "Invalid date. Use YYYY-MM-DD.",
      });
    }

    if (periodStart > periodEnd) {
      return res.status(400).json({
        error: "The start date cannot be after the end date.",
      });
    }

    const [storedBookings, departmentSales] =
      await Promise.all([
        storage.getAllBookings(),
        storage.getAllDepartmentSales(),
      ]);

    const analyticsBookings: AnalyticsBooking[] =
      storedBookings
        .map((booking) => ({
          id: String(booking.id),
          roomId: String(booking.roomId),
          guestName: booking.guestName ?? "NO NAME",
          checkIn: new Date(booking.checkIn),
          checkOut: new Date(booking.checkOut),
          nightlyRate: Number(booking.nightlyRate),
        }))
        .filter(
          (booking) =>
            !Number.isNaN(booking.checkIn.getTime()) &&
            !Number.isNaN(booking.checkOut.getTime()) &&
            Number.isFinite(booking.nightlyRate) &&
            booking.nightlyRate >= 0
        );

    const bookingsInPeriod = filterBookingsByPeriod(
      analyticsBookings,
      periodStart,
      periodEnd
    );

    const salesInPeriod = departmentSales.filter((sale) => {
      const saleDate = new Date(
        `${sale.saleDate}T00:00:00`
      );

      if (Number.isNaN(saleDate.getTime())) {
        return false;
      }

      return (
        saleDate >= periodStart &&
        saleDate <= periodEnd
      );
    });

    // Accommodation revenue only
    const lodgingRevenue =
      calculateTotalRevenue(bookingsInPeriod);

    // Restaurant revenue is stored as "kitchen"
    const kitchenRevenue = salesInPeriod
      .filter((sale) => sale.department === "kitchen")
      .reduce((total, sale) => {
        const amount = Number(sale.total);

        return (
          total +
          (Number.isFinite(amount) && amount >= 0
            ? amount
            : 0)
        );
      }, 0);
      const kitchenSalesInPeriod = salesInPeriod.filter(
  (sale) => sale.department === "kitchen"
);
const kitchenTotalSales = kitchenSalesInPeriod.length;

const kitchenTotalItemsSold =
  kitchenSalesInPeriod.reduce((total, sale) => {
    const quantity = Number(sale.quantity);

    return (
      total +
      (Number.isFinite(quantity) && quantity >= 0
        ? quantity
        : 0)
    );
  }, 0);

const kitchenAverageSaleValue =
  kitchenTotalSales > 0
    ? kitchenRevenue / kitchenTotalSales
    : 0;

const kitchenAnalytics = {
  totalRevenue: kitchenRevenue,
  totalSales: kitchenTotalSales,
  totalItemsSold: kitchenTotalItemsSold,
  averageSaleValue: kitchenAverageSaleValue,
};
    const barRevenue = salesInPeriod
      .filter((sale) => sale.department === "bar")
      .reduce((total, sale) => {
        const amount = Number(sale.total);

        return (
          total +
          (Number.isFinite(amount) && amount >= 0
            ? amount
            : 0)
        );
      }, 0);

    // Spa data has not been connected yet.
    const spaRevenue = 0;

    const totalRevenue =
      lodgingRevenue +
      kitchenRevenue +
      barRevenue +
      spaRevenue;

    const totalRoomNights =
      calculateTotalRoomNights(bookingsInPeriod);

    const occupancyRate = calculateOccupancyRate(
      bookingsInPeriod,
      periodStart,
      periodEnd
    );

    // ADR and RevPAR must use lodging revenue,
    // not restaurant or bar revenue.
    const averageDailyRate =
      calculateAverageDailyRate(bookingsInPeriod);

    const revPAR = calculateRevPAR(
      lodgingRevenue,
      periodStart,
      periodEnd
    );
    const roomStats = buildRoomStats(
  analyticsBookings,
  bookingsInPeriod,
  periodStart,
  periodEnd
);

const mostBookedRoom = getRoomStatsLeader(
  roomStats,
  "monthlyBookings"
);

const highestRevenueRoom = getRoomStatsLeader(
  roomStats,
  "monthlyRevenue"
);

const highestOccupancyRoom = getRoomStatsLeader(
  roomStats,
  "monthlyOccupancyRate"
);

const leastBookedRoom =
  getLeastBookedRoom(roomStats);

    return res.json({
      period: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
      },

      totalRevenue,
      lodgingRevenue,
      kitchenRevenue,
      barRevenue,
      spaRevenue,

      totalBookings: countBookings(bookingsInPeriod),
      uniqueGuests: countUniqueGuests(bookingsInPeriod),
      totalRoomNights,
      occupancyRate,
      averageDailyRate,
      revPAR,

      revenueSources: {
        lodging: lodgingRevenue,
        kitchen: kitchenRevenue,
        bar: barRevenue,
        spa: spaRevenue,
        total: totalRevenue,
      },
      roomStats,
      kitchenAnalytics,

roomStatsSummary: {
  mostBookedRoom: mostBookedRoom
    ? {
        roomType: mostBookedRoom.roomType,
        monthlyBookings:
          mostBookedRoom.monthlyBookings,
        yearlyBookings:
          mostBookedRoom.yearlyBookings,
      }
    : null,

  highestRevenueRoom: highestRevenueRoom
    ? {
        roomType:
          highestRevenueRoom.roomType,
        monthlyRevenue:
          highestRevenueRoom.monthlyRevenue,
        yearlyRevenue:
          highestRevenueRoom.yearlyRevenue,
      }
    : null,

  highestOccupancyRoom: highestOccupancyRoom
    ? {
        roomType:
          highestOccupancyRoom.roomType,
        monthlyOccupancyRate:
          highestOccupancyRoom.monthlyOccupancyRate,
        yearlyOccupancyRate:
          highestOccupancyRoom.yearlyOccupancyRate,
      }
    : null,

  leastBookedRoom: leastBookedRoom
    ? {
        roomType: leastBookedRoom.roomType,
        monthlyBookings:
          leastBookedRoom.monthlyBookings,
        yearlyBookings:
          leastBookedRoom.yearlyBookings,
      }
    : null,
},
    });
  } catch (error) {
    console.error("[Analytics] Error:", error);

    return res.status(500).json({
      error: "Unable to calculate analytics.",
    });
  }
});

app.get("/api/department-sales/:department", async (req, res) => {
  const department = normalizeSalesDepartment(
    req.params.department
  );

  if (!department) {
    return res.status(400).json({
      error:
        'Department must be "restaurant", "kitchen", or "bar".',
    });
  }

  try {
    const sales = await storage.getDepartmentSales(department);
    return res.json(sales);
  } catch (error: any) {
    console.error("[Department Sales] Fetch error:", error);

    return res.status(500).json({
      error:
        error?.message ??
        "Unable to load department sales.",
    });
  }
});

app.post("/api/department-sales", async (req, res) => {
  const {
    department: rawDepartment,
    saleDate,
    description,
    quantity,
    roomReference,
    unitAmount,
    total,
    paymentMethod,
    staffName,
  } = req.body ?? {};

  const department = normalizeSalesDepartment(rawDepartment);

  if (!department) {
    return res.status(400).json({
      error:
        'Department must be "restaurant", "kitchen", or "bar".',
    });
  }

  if (
    typeof saleDate !== "string" ||
    !saleDate.trim()
  ) {
    return res.status(400).json({
      error: "Sale date is required.",
    });
  }

  if (
    typeof description !== "string" ||
    !description.trim()
  ) {
    return res.status(400).json({
      error: "Description is required.",
    });
  }

  const parsedQuantity = Number(quantity ?? 0);
  const parsedUnitAmount = Number(unitAmount ?? 0);
  const parsedTotal = Number(total ?? 0);

  if (
    !Number.isFinite(parsedQuantity) ||
    !Number.isFinite(parsedUnitAmount) ||
    !Number.isFinite(parsedTotal)
  ) {
    return res.status(400).json({
      error:
        "Quantity, unit amount, and total must be valid numbers.",
    });
  }

  if (
    parsedQuantity < 0 ||
    parsedUnitAmount < 0 ||
    parsedTotal < 0
  ) {
    return res.status(400).json({
      error:
        "Quantity, unit amount, and total cannot be negative.",
    });
  }

  const sale: InsertDepartmentSale = {
    department,
    saleDate: saleDate.trim(),
    description: description.trim(),
    quantity: parsedQuantity,
    roomReference:
      typeof roomReference === "string" &&
      roomReference.trim()
        ? roomReference.trim()
        : null,
    unitAmount: parsedUnitAmount,
    total: parsedTotal,
    paymentMethod:
      typeof paymentMethod === "string" &&
      paymentMethod.trim()
        ? paymentMethod.trim()
        : null,
    staffName:
      typeof staffName === "string" &&
      staffName.trim()
        ? staffName.trim()
        : null,
  };

  try {
    const created =
      await storage.createDepartmentSale(sale);

    return res.status(201).json(created);
  } catch (error: any) {
    console.error("[Department Sales] Create error:", error);

    return res.status(500).json({
      error:
        error?.message ??
        "Unable to save department sale.",
    });
  }
});

app.delete("/api/department-sales/:id", async (req, res) => {
  const { id } = req.params;

  if (!id?.trim()) {
    return res.status(400).json({
      error: "Sale ID is required.",
    });
  }

  try {
    const deleted =
      await storage.deleteDepartmentSale(id);

    if (!deleted) {
      return res.status(404).json({
        error: "Sale not found.",
      });
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error("[Department Sales] Delete error:", error);

    return res.status(500).json({
      error:
        error?.message ??
        "Unable to delete department sale.",
    });
  }
});

app.post("/api/department-sales/import", async (req, res) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({
      error: "Expected an array of sales.",
    });
  }

  if (req.body.length == 0) {
    return res.status(400).json({
      error: "No sales were provided.",
    });
  }

  if (req.body.length > 5000) {
    return res.status(413).json({
      error:
        "Too many sales. Import a maximum of 5,000 rows at a time.",
    });
  }

  try {
    const existingSales =
      await storage.getAllDepartmentSales();

    const makeSaleKey = (sale: {
      department: Department;
      saleDate: string;
      description: string;
      roomReference?: string | null;
      quantity?: number | null;
      unitAmount?: number | null;
      total?: number | null;
    }) =>
      [
        sale.department,
        sale.saleDate.trim(),
        sale.description.trim().toLowerCase(),
        sale.roomReference?.trim().toLowerCase() ?? "",
        Number(sale.quantity ?? 0),
        Number(sale.unitAmount ?? 0),
        Number(sale.total ?? 0),
      ].join("|");

    const existingKeys = new Set(
      existingSales.map(makeSaleKey)
    );

    const importedSales = [];
    const skippedRows: Array<{
      index: number;
      rowNumber?: number;
      reason: string;
    }> = [];

    for (
      let index = 0;
      index < req.body.length;
      index += 1
    ) {
      const incoming = req.body[index] ?? {};

      const department = normalizeSalesDepartment(
        incoming.department
      );

      const saleDate = String(
        incoming.saleDate ?? ""
      ).trim();

      const description = String(
        incoming.description ?? ""
      ).trim();

      const parsedQuantity = Number(
        incoming.quantity ?? 0
      );

      const parsedUnitAmount = Number(
        incoming.unitAmount ?? 0
      );

      const parsedTotal = Number(
        incoming.total ?? 0
      );

      if (!department) {
        skippedRows.push({
          index,
          rowNumber: incoming.rowNumber,
          reason: "Invalid department.",
        });
        continue;
      }

      if (!saleDate || !description) {
        skippedRows.push({
          index,
          rowNumber: incoming.rowNumber,
          reason:
            "Sale date and description are required.",
        });
        continue;
      }

      if (
        !Number.isFinite(parsedQuantity) ||
        !Number.isFinite(parsedUnitAmount) ||
        !Number.isFinite(parsedTotal)
      ) {
        skippedRows.push({
          index,
          rowNumber: incoming.rowNumber,
          reason: "Invalid numeric value.",
        });
        continue;
      }

      if (
        parsedQuantity < 0 ||
        parsedUnitAmount < 0 ||
        parsedTotal < 0
      ) {
        skippedRows.push({
          index,
          rowNumber: incoming.rowNumber,
          reason: "Numeric values cannot be negative.",
        });
        continue;
      }

      const sale: InsertDepartmentSale = {
        department,
        saleDate,
        description,
        quantity: parsedQuantity,
        roomReference:
          typeof incoming.roomReference === "string" &&
          incoming.roomReference.trim()
            ? incoming.roomReference.trim()
            : null,
        unitAmount: parsedUnitAmount,
        total: parsedTotal,
        paymentMethod:
          typeof incoming.paymentMethod === "string" &&
          incoming.paymentMethod.trim()
            ? incoming.paymentMethod.trim()
            : null,
        staffName:
          typeof incoming.staffName === "string" &&
          incoming.staffName.trim()
            ? incoming.staffName.trim()
            : null,
      };

      const saleKey = makeSaleKey(sale);

      if (existingKeys.has(saleKey)) {
        skippedRows.push({
          index,
          rowNumber: incoming.rowNumber,
          reason: "Duplicate sale.",
        });
        continue;
      }

      const created =
        await storage.createDepartmentSale(sale);

      importedSales.push(created);
      existingKeys.add(saleKey);
    }

    return res.status(201).json({
      success: true,
      imported: importedSales.length,
      skipped: skippedRows.length,
      skippedRows,
    });
  } catch (error: any) {
    console.error("[Department Sales] Import error:", error);

    return res.status(500).json({
      error:
        error?.message ??
        "Unable to import department sales.",
    });
  }
});
// ─────────────────────────────────────────────────────────────────────────────


// ── Historical Excel booking import ─────────────────────────────────────────
app.post("/api/bookings/import", async (req, res) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({
      error: "Expected an array of bookings.",
    });
  }

  if (req.body.length === 0) {
    return res.status(400).json({
      error: "No bookings were provided.",
    });
  }

  if (req.body.length > 5000) {
    return res.status(413).json({
      error: "Too many bookings. Import a maximum of 5,000 rows at a time.",
    });
  }

  try {
    const existingBookings = await storage.getAllBookings();

    const existingKeys = new Set(
      existingBookings.map((booking) =>
        [
          String(booking.roomId),
          new Date(booking.checkIn).toISOString().slice(0, 10),
          new Date(booking.checkOut).toISOString().slice(0, 10),
          Number(booking.nightlyRate),
        ].join("|")
      )
    );

    const createdBookings = [];
    const skippedRows: Array<{
      index: number;
      rowNumber?: number;
      reason: string;
    }> = [];

    for (let index = 0; index < req.body.length; index += 1) {
      const incoming = req.body[index];

      const parsed = insertBookingSchema.safeParse({
        roomId: incoming?.roomId,
        guestName: incoming?.guestName || "NO NAME",
        checkIn: incoming?.checkIn,
        checkOut: incoming?.checkOut,
        nightlyRate: Number(incoming?.nightlyRate),
        checkinTime: incoming?.checkinTime,
        checkoutTime: incoming?.checkoutTime || "12:00 PM",
      });

      if (!parsed.success) {
        skippedRows.push({
          index,
          rowNumber: incoming?.rowNumber,
          reason: "Invalid booking data.",
        });
        continue;
      }

      const bookingKey = [
        String(parsed.data.roomId),
        new Date(parsed.data.checkIn).toISOString().slice(0, 10),
        new Date(parsed.data.checkOut).toISOString().slice(0, 10),
        Number(parsed.data.nightlyRate),
      ].join("|");

      if (existingKeys.has(bookingKey)) {
        skippedRows.push({
          index,
          rowNumber: incoming?.rowNumber,
          reason: "Duplicate booking.",
        });
        continue;
      }

      const created = await storage.createBooking(parsed.data);
      createdBookings.push(created);
      existingKeys.add(bookingKey);
    }

    return res.status(201).json({
      success: true,
      imported: createdBookings.length,
      skipped: skippedRows.length,
      skippedRows,
    });
  } catch (error: any) {
    console.error("[Historical Import] Error:", error);

    return res.status(500).json({
      error: error?.message ?? "Unable to import historical bookings.",
    });
  }
});
// ─────────────────────────────────────────────────────────────────────────────

app.delete("/api/bookings/:id", async (req, res) => {
  const { id } = req.params;
  const deleted = await storage.deleteBooking(id);
  if (!deleted) return res.status(404).json({ error: "Booking not found" });
  res.json({ success: true });
});

app.post("/api/bookings", async (req, res) => {
  const parsed = insertBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error });
  }

  const { roomId, checkIn, checkOut } = parsed.data;
  const existing = await storage.getBookings();

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const conflict = existing.find(b =>
    b.roomId === roomId &&
    new Date(b.checkOut) >= now &&
    new Date(checkIn) < new Date(b.checkOut) &&
    new Date(checkOut) > new Date(b.checkIn)
  );

  if (conflict) {
    return res.status(409).json({ error: "Sold Out for these dates" });
  }

  const booking = await storage.createBooking(parsed.data);
  res.json(booking);
});

  // ── AI Chatbot (Google Gemini) ────────────────────────────────────────────
  const apiKey = process.env.GOOGLE_API_KEY ?? "";
  console.log(`[Gemini] API key loaded: ${apiKey ? `${apiKey.slice(0, 6)}…` : "NOT SET — check Secrets"}`);
  const genAI = new GoogleGenerativeAI(apiKey);

  const CHAT_LOG_FILE = path.join(process.cwd(), "data", "chat-logs.json");
  if (!fs.existsSync(CHAT_LOG_FILE)) fs.writeFileSync(CHAT_LOG_FILE, "[]");

  const SYSTEM_PROMPT = `You are Luxie, the warm and professional AI concierge for Luxarna Hotel & Spa in Port Harcourt, Nigeria.

TIME & LOCATION:
- Nigeria operates on West Africa Time (WAT), which is UTC+1. There is no daylight saving time.
- If a guest asks "What time is it in Nigeria?" compute and answer using UTC+1.
- The hotel address is: Plot 13, Trunk C, Mandela Estate, Port Harcourt, Rivers State, Nigeria.

ROOMS:
- King Suite (Room 206): ₦50,000/night. Panoramic views, private sitting lounge, premium finishes. Amenities: WiFi, AC, TV, Bathroom, Breakfast, Parking.
- Queen Suite (Room 204): ₦40,000/night. Modern elegance with warm Nigerian hospitality. Amenities: WiFi, AC, TV, Bathroom, Breakfast.
- Deluxe Rooms (Rooms 101, 102, 201, 202, 203, 205): ₦30,000/night each — 6 rooms available with refined décor. Amenities: WiFi, AC, TV, Bathroom.
- Standard Room (Room 103): ₦23,000/night. Comfortable and excellent value. Amenities: WiFi, AC, TV.
- Room availability can only be confirmed at booking. Guests should click "Book Now" on any room to start a WhatsApp booking with the hotel team.

RESTAURANT & KARAOKE BAR:
- Breakfast: 7:00 AM – 11:30 AM
- Lunch: 12:00 PM – 4:00 PM
- Dinner: 5:00 PM – 11:30 PM
- Karaoke Bar: 5:00 PM – 2:00 AM (premium cocktails and drinks available)
- Cuisine: Nigerian local dishes and continental options.

SPA (open 9:00 AM – 9:00 PM daily — advance booking strongly recommended):
- Full Body Massage: ₦40,000 (45 minutes)
- Facial: ₦30,000 (30 minutes)
- Pedicure: ₦7,500 (45–60 minutes)
- Manicure: ₦7,500 (25–30 minutes)

CONTACT:
- Phone / WhatsApp: +234 704 992 9851
- WhatsApp link: https://wa.me/2347049929851
- Email: LuxarnaHotel@gmail.com

CRITICAL RULES — FOLLOW THESE EXACTLY:
1. CASUAL GREETINGS: If a guest says "hi", "hello", "hey", "good morning", "good evening", or any greeting, respond warmly and introduce yourself. Example: "Hello! Welcome to Luxarna Hotel & Spa. I'm Luxie, your AI concierge. How may I assist you today? I can help with rooms, our spa, restaurant, or any hotel enquiries."
2. Answer all questions about rooms (prices, amenities, availability), restaurant, spa, Nigeria time, and the hotel location directly and confidently.
3. NEVER say "I don't know", "I'm not sure", or "that information is not available". If a guest asks for any specific hotel detail not in your data (e.g. pool, gym, event spaces, airport transfer, laundry, etc.), respond warmly and direct them to: WhatsApp https://wa.me/2347049929851 or Email LuxarnaHotel@gmail.com.
4. Keep all responses concise, warm, and professional. Use ₦ for all prices.
5. For questions completely unrelated to the hotel (politics, general trivia, etc.), politely say you specialise in Luxarna Hotel services and invite them to ask about rooms, spa, or restaurant.`;

  app.post("/api/chat", async (req, res) => {
    const { messages } = req.body as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    try {
      const [allBookings, allRooms] = await Promise.all([
        storage.getBookings(),
        storage.getRooms(),
      ]);

      const now = new Date();
      const activeBookings = allBookings.filter(b => new Date(b.checkOut) > now);

      let bookingContext = "\n\nLIVE ROOM AVAILABILITY (real-time — use this to answer availability questions):\n";

      if (activeBookings.length === 0) {
        bookingContext += "All rooms are currently available for booking.\n";
      } else {
        const byRoom: Record<string, typeof activeBookings> = {};
        for (const b of activeBookings) {
          if (!byRoom[b.roomId]) byRoom[b.roomId] = [];
          byRoom[b.roomId].push(b);
        }

        for (const room of allRooms) {
          const roomBookings = byRoom[room.id] ?? [];
          if (roomBookings.length === 0) {
            bookingContext += `- ${room.name} (Room ${room.id}): AVAILABLE\n`;
          } else {
            const ranges = roomBookings.map(b => {
              const ci = new Date(b.checkIn).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
              const co = new Date(b.checkOut).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
              return `booked ${ci} → ${co}`;
            }).join("; ");
            bookingContext += `- ${room.name} (Room ${room.id}): ${ranges}\n`;
          }
        }
      }

      bookingContext += "\nIMPORTANT RULES FOR AVAILABILITY:\n";
      bookingContext += "- If a room is shown as booked for a date range the guest wants, tell them clearly and suggest alternative rooms or dates.\n";
      bookingContext += "- If a room is AVAILABLE, encourage the guest to click 'Book Now' on the Rooms page to start a WhatsApp booking.\n";
      bookingContext += "- Never reveal guest names — only booking dates.\n";

      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: {
          role: "system",
          parts: [{ text: SYSTEM_PROMPT + bookingContext }],
        },
      });

      const history = messages.slice(0, -1).map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const chat = model.startChat({ history });
      const lastMessage = messages[messages.length - 1].content;
      const result = await chat.sendMessage(lastMessage);
      const reply = result.response.text();

      try {
        const logs = JSON.parse(fs.readFileSync(CHAT_LOG_FILE, "utf-8"));
        logs.push({
          timestamp: new Date().toISOString(),
          messages: [...messages, { role: "assistant", content: reply }],
        });
        fs.writeFileSync(CHAT_LOG_FILE, JSON.stringify(logs, null, 2));
      } catch { /* non-fatal */ }

      return res.json({ reply });
    } catch (err: any) {
      const message = err.message ?? "AI service error";
      return res.status(502).json({ error: message });
    }
  });

  app.get("/api/chat-logs", async (_req, res) => {
    try {
      const logs = JSON.parse(fs.readFileSync(CHAT_LOG_FILE, "utf-8"));
      res.json(logs);
    } catch {
      res.json([]);
    }
  });

  // ── Loyalty Programme sign-up ─────────────────────────────────────────────
 app.post("/api/loyalty", async (req, res) => {
  const { name, phone, email } = req.body as {
    name?: string;
    phone?: string;
    email?: string;
  };

  // Validate required fields
  if (!name || !phone || !email) {
    return res.status(400).json({
      error: "Name, phone and email are all required."
    });
  }

  // Normalize inputs
  const cleanName = name.trim();
  const cleanPhone = phone.trim();
  const cleanEmail = email.trim().toLowerCase();

  try {
    const { getSupabase } = await import("./storage");
    const supabase = getSupabase();

    // Insert into Supabase
    const { error } = await supabase
      .from("loyalty_members")
      .insert([
        {
          name: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
        },
      ]as any);

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({
          error: "This email is already registered. Welcome back!",
        });
      }

      console.error("[Loyalty] Supabase insert error:", error.message);
      return res.status(500).json({
        error: "Something went wrong. Please try again.",
      });
    }

    console.log("[Loyalty] Insert success, sending email to:", cleanEmail);
    console.log("[Loyalty] RESEND_API_KEY present:", !!process.env.RESEND_API_KEY);

    // Send welcome email via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Luxarna Hotel & Spa <loyalty@luxarnahotel.com>",
        reply_to: "luxarnahotel@gmail.com",
        to: cleanEmail,
        subject: "Welcome to the Luxarna Loyalty Programme ✦",
        html: `
          <div style="background:#080808; padding:48px 32px; font-family:Georgia,serif; max-width:560px; margin:0 auto;">
            <div style="text-align:center; border-bottom:1px solid #c9a84c; padding-bottom:28px; margin-bottom:32px;">
              <p style="color:#c9a84c; letter-spacing:6px; font-size:11px; margin-bottom:8px;">✦ ✦ ✦</p>
              <h1 style="color:#c9a84c; font-size:28px; letter-spacing:6px; margin:0;">LUXARNA</h1>
              <p style="color:rgba(201,168,76,0.5); letter-spacing:4px; font-size:11px; margin:4px 0 0;">HOTEL & SPA</p>
            </div>
            <h2 style="color:#f5f0e8; font-size:22px; font-weight:400; margin-bottom:12px;">Welcome, ${cleanName}.</h2>
            <p style="color:rgba(255,255,255,0.55); font-size:16px; line-height:1.7; margin-bottom:28px;">
              You are now a member of the Luxarna Loyalty Programme. Every stay brings you closer to something special.
            </p>
            <div style="border:1px solid rgba(201,168,76,0.3); border-radius:12px; padding:24px; margin-bottom:28px;">
              <p style="color:#c9a84c; letter-spacing:3px; font-size:11px; margin-bottom:16px;">YOUR REWARDS</p>
              <p style="color:#f5f0e8; font-size:15px; margin-bottom:10px;">✦ &nbsp;Stay 4 nights → get <strong style="color:#c9a84c;">50% off your 5th night</strong></p>
              <p style="color:#f5f0e8; font-size:15px;">✦ &nbsp;Stay 9 nights → get your <strong style="color:#c9a84c;">10th night completely free</strong></p>
            </div>
            <p style="color:rgba(255,255,255,0.35); font-size:13px; line-height:1.6; margin-bottom:32px;">
              Simply mention your membership at reception on your next visit and we will stamp your loyalty card. You can win multiple times within a year.
            </p>
            <div style="text-align:center; border-top:1px solid rgba(201,168,76,0.2); padding-top:24px;">
              <p style="color:rgba(201,168,76,0.5); font-style:italic; font-size:14px; margin-bottom:4px;">Thank you for choosing Luxarna.</p>
              <p style="color:rgba(255,255,255,0.25); font-size:12px;">We look forward to welcoming you again.</p>
              <p style="color:rgba(255,255,255,0.2); font-size:11px; margin-top:16px; letter-spacing:1px;">
                +234 704 992 9851 &nbsp;·&nbsp; luxarnahotel.com &nbsp;·&nbsp; @luxarnahotel
              </p>
            </div>
          </div>
        `,
      }),
    });

    const emailData = await emailRes.json();
    console.log("[Loyalty] Resend response:", JSON.stringify(emailData));

    return res.json({ success: true });
  } catch (err: any) {
    console.error("[Loyalty] Caught error:", err.message);
    return res.status(500).json({
      error: err.message ?? "Server error",
    });
  }
});

  // ─────────────────────────────────────────────────────────────────────────

  // ── Admin auth (server-side password check) ───────────────────────────────
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body as { password?: string };
    const adminPassword = process.env.ADMIN_PASSWORD ?? "luxarna-admin";
    if (!password || password !== adminPassword) {
      return res.status(401).json({ error: "Access denied" });
    }
    return res.json({ success: true });
  });
  // ─────────────────────────────────────────────────────────────────────────
// ── Paystack payment verification ────────────────────────────────────────
app.post("/api/verify-payment", async (req, res) => {
  const { reference, guestName, roomId, checkIn, checkOut } = req.body as {
    reference: string;
    guestName: string;
    roomId: string;
    checkIn: string;
    checkOut: string;
  };

  if (!reference || !roomId || !guestName || !checkIn || !checkOut) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // 1. Verify with Paystack
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );
    const paystackData = await paystackRes.json() as {
      status: boolean;
      data: { status: string };
    };

    if (!paystackData.status || paystackData.data.status !== "success") {
      return res.status(402).json({ error: "Payment not confirmed by Paystack" });
    }

    // 2. Save booking to DB
    const parsed = insertBookingSchema.safeParse({
      roomId,
      guestName,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
    });

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error });
    }

    // Check for conflicts first
    const existing = await storage.getBookings();
    const conflict = existing.find(
      (b) =>
        b.roomId === roomId &&
        new Date(checkIn) < new Date(b.checkOut) &&
        new Date(checkOut) > new Date(b.checkIn)
    );

    if (conflict) {
      return res.status(409).json({ error: "Room was just booked by someone else" });
    }

    const booking = await storage.createBooking(parsed.data);
    return res.json({ success: true, booking });
  } catch (err: any) {
    console.error("[Paystack] Verify error:", err.message);
    return res.status(500).json({ error: "Payment verification failed" });
  }
});
// ─────────────────────────────────────────────────────────────────────────
  return httpServer;
}