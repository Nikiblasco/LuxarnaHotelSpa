import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema } from "@shared/schema";
import axios from "axios";

// Set timezone to Lagos
process.env.TZ = "Africa/Lagos";

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
    res.json(bookings);
  });

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
    
    const conflict = existing.find(b => 
      b.roomId === roomId &&
      new Date(checkIn) < new Date(b.checkOut) &&
      new Date(checkOut) > new Date(b.checkIn)
    );

    if (conflict) {
      return res.status(409).json({ error: "Sold Out for these dates" });
    }

    const booking = await storage.createBooking(parsed.data);
    res.json(booking);
  });

  return httpServer;
}
