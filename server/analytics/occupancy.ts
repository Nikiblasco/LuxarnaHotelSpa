import type { AnalyticsBooking } from "./types";
import { getBookingNights } from "./revenue";

const TOTAL_ROOMS = 9;
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function getInclusivePeriodDays(start: Date, end: Date): number {
  const startDate = startOfDay(start);
  const endDate = startOfDay(end);

  const difference =
    (endDate.getTime() - startDate.getTime()) / MILLISECONDS_PER_DAY;

  return Math.max(1, Math.floor(difference) + 1);
}

export function calculateTotalRoomNights(
  bookings: AnalyticsBooking[]
): number {
  return bookings.reduce((total, booking) => {
    return total + getBookingNights(booking);
  }, 0);
}

export function calculateAvailableRoomNights(
  periodStart: Date,
  periodEnd: Date
): number {
  const days = getInclusivePeriodDays(periodStart, periodEnd);

  return TOTAL_ROOMS * days;
}

export function calculateOccupancyRate(
  bookings: AnalyticsBooking[],
  periodStart: Date,
  periodEnd: Date
): number {
  const occupiedRoomNights = calculateTotalRoomNights(bookings);

  const availableRoomNights = calculateAvailableRoomNights(
    periodStart,
    periodEnd
  );

  if (availableRoomNights === 0) {
    return 0;
  }

  return (occupiedRoomNights / availableRoomNights) * 100;
}

export function calculateRevPAR(
  totalRevenue: number,
  periodStart: Date,
  periodEnd: Date
): number {
  const availableRoomNights = calculateAvailableRoomNights(
    periodStart,
    periodEnd
  );

  if (availableRoomNights === 0) {
    return 0;
  }

  return totalRevenue / availableRoomNights;
}