import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema } from "@shared/schema";
import { GoogleGenerativeAI } from "@google/generative-ai";
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
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const active = bookings.filter(b => new Date(b.checkOut) >= now);
  res.json(active);
});

app.get("/api/bookings/stats", async (_req, res) => {
  const all = await storage.getAllBookings();
  res.json(all);
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

  app.post("/api/bookings", async (req, res) => {
    const parsed = insertBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error });
    }
    app.get("/api/bookings/stats", async (_req, res) => {
  const all = await storage.getAllBookings();
  res.json(all);
});

    const { roomId, checkIn, checkOut } = parsed.data;
    const existing = await storage.getBookings();

    const now = new Date();
const conflict = existing.find(b =>
  b.roomId === roomId &&
  new Date(b.checkOut) > now &&          // ignore expired bookings
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
        model: "gemini-2.5-flash",
        systemInstruction: SYSTEM_PROMPT + bookingContext,
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
    const { name, phone, email } = req.body as { name?: string; phone?: string; email?: string };
    if (!name || !phone || !email) {
      return res.status(400).json({ error: "Name, phone and email are all required." });
    }

    try {
      const { getSupabase } = await import("./storage");
      const supabase = getSupabase();

      const { error } = await supabase
        .from("loyalty_members")
        .insert([{ name: name.trim(), phone: phone.trim(), email: email.trim().toLowerCase() }]);

      if (error) {
        if (error.code === "23505") {
          return res.status(409).json({ error: "This email is already registered. Welcome back!" });
        }
        console.error("[Loyalty] Supabase insert error:", error.message);
        return res.status(500).json({ error: "Something went wrong. Please try again." });
      }

      console.log("[Loyalty] Insert success, sending email to:", email);
      console.log("[Loyalty] RESEND_API_KEY present:", !!process.env.RESEND_API_KEY);

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Luxarna Hotel & Spa <loyalty@luxarnahotel.com>",
          reply_to: "luxarnahotel@gmail.com",
          to: email.trim().toLowerCase(),
          subject: "Welcome to the Luxarna Loyalty Programme ✦",
          html: `
            <div style="background:#080808; padding:48px 32px; font-family:Georgia,serif; max-width:560px; margin:0 auto;">
              <div style="text-align:center; border-bottom:1px solid #c9a84c; padding-bottom:28px; margin-bottom:32px;">
                <p style="color:#c9a84c; letter-spacing:6px; font-size:11px; margin-bottom:8px;">✦ ✦ ✦</p>
                <h1 style="color:#c9a84c; font-size:28px; letter-spacing:6px; margin:0;">LUXARNA</h1>
                <p style="color:rgba(201,168,76,0.5); letter-spacing:4px; font-size:11px; margin:4px 0 0;">HOTEL & SPA</p>
              </div>
              <h2 style="color:#f5f0e8; font-size:22px; font-weight:400; margin-bottom:12px;">Welcome, ${name.trim()}.</h2>
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
      return res.status(500).json({ error: err.message ?? "Server error" });
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

  return httpServer;
}