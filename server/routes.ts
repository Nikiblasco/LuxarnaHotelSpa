import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema, insertPaymentBookingSchema } from "@shared/schema";
import axios from "axios";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

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

  // ── AI Chatbot ───────────────────────────────────────────────────────────
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const CHAT_LOG_FILE = path.join(process.cwd(), "data", "chat-logs.json");
  if (!fs.existsSync(CHAT_LOG_FILE)) fs.writeFileSync(CHAT_LOG_FILE, "[]");

  const SYSTEM_PROMPT = `You are Luxie, the friendly AI concierge for Luxarna Hotel & Spa in Port Harcourt, Nigeria.
You only answer questions about our hotel's Rooms, Restaurant & Karaoke Bar, and Spa.

ROOMS:
- King Suite (Room 206): ₦50,000/night. The most prestigious suite — panoramic views, private sitting lounge, premium finishes. Amenities: WiFi, AC, TV, bathroom, breakfast, parking.
- Queen Suite (Room 204): ₦40,000/night. Sophisticated suite blending modern elegance with warm Nigerian hospitality. Amenities: WiFi, AC, TV, bathroom, breakfast.
- Deluxe Rooms (Rooms 101,102,201,202,203,205): ₦30,000/night each. 6 rooms available — generously spaced with refined décor. Amenities: WiFi, AC, TV, bathroom.
- Standard Room (Room 103): ₦23,000/night. Smart, comfortable, excellent value. Amenities: WiFi, AC, TV.

RESTAURANT & KARAOKE BAR:
- Breakfast: 7:00 AM – 11:30 AM
- Lunch: 12:00 PM – 4:00 PM
- Dinner: 5:00 PM – 11:30 PM
- Karaoke Bar Hours: 5:00 PM – 2:00 AM (premium cocktails & drinks available)

SPA (open 9:00 AM – 9:00 PM daily, advance booking recommended):
- Full Body Massage: ₦40,000 (45 minutes)
- Facial: ₦30,000 (30 minutes)
- Pedicure: ₦7,500 (45–60 minutes)
- Manicure: ₦7,500 (25–30 minutes)

CONTACT:
- Phone: +234 704 992 9851
- Email: LuxarnaHotel@gmail.com
- WhatsApp: https://wa.me/2347049929851
- Address: Plot 13, Trunk C, Mandela Estate, Port Harcourt, Rivers State, Nigeria

RULES:
- Only discuss Rooms, Restaurant/Karaoke Bar, and Spa.
- For anything outside these topics (careers, management, complaints, other services), politely say you cannot help with that and direct the guest to Email: LuxarnaHotel@gmail.com or WhatsApp: https://wa.me/2347049929851.
- Keep responses concise, warm, and professional.
- Use Nigerian Naira (₦) for all prices.
- Never make up information not listed above.`;

  app.post("/api/chat", async (req, res) => {
    const { messages } = req.body as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array is required" });
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        max_tokens: 400,
        temperature: 0.7,
      });

      const reply = completion.choices[0]?.message?.content ?? "I'm sorry, I couldn't process that. Please try again.";

      // Log conversation to file
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
  // ─────────────────────────────────────────────────────────────────────────

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
