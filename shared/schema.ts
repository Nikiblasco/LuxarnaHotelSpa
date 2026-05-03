import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const rooms = pgTable("rooms", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  price: integer("price").notNull(),
});

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey(),
  roomId: varchar("room_id").notNull(),
  guestName: text("guest_name").notNull(),
  checkIn: timestamp("check_in").notNull(),
  checkOut: timestamp("check_out").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true }).extend({
  checkIn: z.coerce.date(),
  checkOut: z.coerce.date(),
});

export type InsertUser    = z.infer<typeof insertUserSchema>;
export type User          = typeof users.$inferSelect;
export type Room          = typeof rooms.$inferSelect;
export type Booking       = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
