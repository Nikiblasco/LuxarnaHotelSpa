import type { AnalyticsBooking } from "./types";

const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function getBookingNights(booking: AnalyticsBooking): number {
  const checkIn = startOfDay(new Date(booking.checkIn));
  const checkOut = startOfDay(new Date(booking.checkOut));

  const difference =
    (checkOut.getTime() - checkIn.getTime()) / MILLISECONDS_PER_DAY;

  return Math.max(1, Math.round(difference));
}

export function calculateBookingRevenue(
  booking: AnalyticsBooking
): number {
  const nights = getBookingNights(booking);
  const nightlyRate = Number(booking.nightlyRate);

  if (!Number.isFinite(nightlyRate) || nightlyRate < 0) {
    return 0;
  }

  return nights * nightlyRate;
}

export function calculateTotalRevenue(
  bookings: AnalyticsBooking[]
): number {
  return bookings.reduce((total, booking) => {
    return total + calculateBookingRevenue(booking);
  }, 0);
}

export function calculateAverageDailyRate(
  bookings: AnalyticsBooking[]
): number {
  const totalRoomNights = bookings.reduce((total, booking) => {
    return total + getBookingNights(booking);
  }, 0);

  if (totalRoomNights === 0) {
    return 0;
  }

  return calculateTotalRevenue(bookings) / totalRoomNights;
}