import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema, insertPaymentBookingSchema } from "@shared/schema";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";
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
- Room availability can only be confirmed at booking. Guests should book on the Rooms page or contact the front desk.

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
      // ── Fetch live booking data to inject into the system prompt ──────────
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
      bookingContext += "- If a room is AVAILABLE, encourage the guest to book via the Rooms page on the website.\n";
      bookingContext += "- Never reveal guest names — only booking dates.\n";
      // ─────────────────────────────────────────────────────────────────────

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: SYSTEM_PROMPT + bookingContext,
      });

      // Convert message history (all but last) to Gemini format
      const history = messages.slice(0, -1).map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const chat = model.startChat({ history });
      const lastMessage = messages[messages.length - 1].content;
      const result = await chat.sendMessage(lastMessage);
      const reply = result.response.text();

      // Log conversation
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

  // ── POST /initialize-payment ─────────────────────────────────────────────
  // Initializes a Paystack transaction and saves a pending booking record.
  // Body: { email, amount (in ₦), name, room }
  app.post("/initialize-payment", async (req, res) => {
    const { email, amount, name, room } = req.body as {
      email: string;
      amount: number;
      name: string;
      room: string;
    };

    if (!email || !amount || !name || !room) {
      return res.status(400).json({ error: "email, amount, name and room are required" });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return res.status(500).json({ error: "Paystack secret key not configured" });
    }

    try {
      // 1 ── Initialize with Paystack (amount in kobo)
      const paystackRes = await axios.post<{
        status: boolean;
        data: { authorization_url: string; access_code: string; reference: string };
      }>(
        "https://api.paystack.co/transaction/initialize",
        { email, amount: Math.round(amount * 100) },
        { headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" } }
      );

      const { authorization_url, access_code, reference } = paystackRes.data.data;

      // 2 ── Save a PENDING booking record immediately
      await storage.createPaymentBooking({ email, amount, name, room, reference });

      return res.json({ authorization_url, access_code, reference });
    } catch (err: any) {
      const message = err.response?.data?.message ?? err.message ?? "Paystack error";
      return res.status(502).json({ error: message });
    }
  });

  // ── POST /webhook ─────────────────────────────────────────────────────────
  // Receives Paystack webhook events and updates booking_status accordingly.
  // Paystack sends: POST with JSON body + x-paystack-signature header (HMAC-SHA512)
  app.post("/webhook", async (req, res) => {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return res.sendStatus(500);

    // Verify the HMAC-SHA512 signature — only Paystack knows the secret key,
    // so only Paystack can produce a matching hash. This prevents anyone else
    // from injecting fake events and modifying booking records.
    const hash = crypto
      .createHmac("sha512", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      console.warn("[Webhook] Signature mismatch — request rejected");
      return res.sendStatus(401);
    }

    // Signature verified — safe to process the event
    const event = req.body as { event: string; data: { reference: string } };

    if (event.event === "charge.success") {
      const { reference } = event.data;
      const updated = await storage.updatePaymentBookingStatus(reference, "confirmed");
      console.log(`[Webhook] charge.success — reference: ${reference}, updated: ${updated}`);
    } else if (event.event === "charge.failed") {
      const { reference } = event.data;
      await storage.updatePaymentBookingStatus(reference, "failed");
      console.log(`[Webhook] charge.failed — reference: ${reference}`);
    }

    // Always acknowledge quickly so Paystack does not retry the event
    return res.sendStatus(200);
  });
  // ─────────────────────────────────────────────────────────────────────────

  return httpServer;
}
