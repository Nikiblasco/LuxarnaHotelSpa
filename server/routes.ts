import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema, insertPaymentBookingSchema } from "@shared/schema";
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

  // Save payment booking after successful Paystack payment
  app.post("/api/payment-bookings", async (req, res) => {
    const parsed = insertPaymentBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    try {
      const booking = await storage.createPaymentBooking(parsed.data);
      return res.status(201).json(booking);
    } catch (e: any) {
      return res.status(500).json({ error: e.message ?? "Failed to save booking" });
    }
  });

  app.get("/api/payment-bookings", async (_req, res) => {
    const bookings = await storage.getPaymentBookings();
    res.json(bookings);
  });

  // Paystack: Initialize transaction
  app.post("/paystack/initialize", async (req, res) => {
    const { email, amount } = req.body as { email: string; amount: number };

    if (!email || !amount) {
      return res.status(400).json({ error: "email and amount are required" });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return res.status(500).json({ error: "Paystack secret key not configured" });
    }

    try {
      const response = await axios.post<{
        status: boolean;
        message: string;
        data: { authorization_url: string; access_code: string; reference: string };
      }>(
        "https://api.paystack.co/transaction/initialize",
        { email, amount: Math.round(amount * 100) },
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return res.json({
        authorization_url: response.data.data.authorization_url,
        access_code: response.data.data.access_code,
        reference: response.data.data.reference,
      });
    } catch (err: any) {
      const message = err.response?.data?.message ?? err.message ?? "Paystack error";
      return res.status(502).json({ error: message });
    }
  });

  // Paystack: Verify transaction
  app.get("/paystack/verify/:reference", async (req, res) => {
    const { reference } = req.params;

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return res.status(500).json({ error: "Paystack secret key not configured" });
    }

    try {
      const response = await axios.get<{
        status: boolean;
        message: string;
        data: {
          status: string;
          reference: string;
          amount: number;
          currency: string;
          customer: { email: string };
        };
      }>(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
          },
        }
      );

      const { status, reference: ref, amount, currency, customer } = response.data.data;
      return res.json({ status, reference: ref, amount, currency, email: customer.email });
    } catch (err: any) {
      const message = err.response?.data?.message ?? err.message ?? "Paystack error";
      return res.status(502).json({ error: message });
    }
  });

  return httpServer;
}
