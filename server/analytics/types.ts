export type AnalyticsBooking = {
  id: string;
  roomId: string;
  guestName: string;
  checkIn: Date;
  checkOut: Date;
  nightlyRate: number;
};

export type AnalyticsSummary = {
  totalRevenue: number;
  totalBookings: number;
  totalRoomNights: number;
  occupancyRate: number;
  averageDailyRate: number;
  revPAR: number;
};