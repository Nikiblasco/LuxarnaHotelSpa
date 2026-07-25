import type { AnalyticsBooking } from "./types";

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function filterBookingsByPeriod(
  bookings: AnalyticsBooking[],
  periodStart: Date,
  periodEnd: Date
): AnalyticsBooking[] {
  const start = startOfDay(periodStart);
  const end = startOfDay(periodEnd);

  return bookings.filter((booking) => {
    const checkIn = startOfDay(new Date(booking.checkIn));
    const checkOut = startOfDay(new Date(booking.checkOut));

    // A booking overlaps the selected period when:
    // check-in is before or on the period end,
    // and check-out is after the period start.
    return checkIn <= end && checkOut > start;
  });
}

export function countBookings(
  bookings: AnalyticsBooking[]
): number {
  return bookings.length;
}

export function countUniqueGuests(
  bookings: AnalyticsBooking[]
): number {
  const guests = new Set(
    bookings
      .map((booking) => booking.guestName.trim().toLowerCase())
      .filter((guestName) => guestName && guestName !== "no name")
  );

  return guests.size;
}