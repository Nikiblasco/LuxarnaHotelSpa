import { createClient } from "@supabase/supabase-js";
import type {
  User,
  InsertUser,
  Room,
  Booking,
  InsertBooking,
} from "@shared/schema";
import { randomUUID } from "crypto";

let _supabase: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (_supabase) return _supabase;

  const url = process.env.SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_KEY ?? "";

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set."
    );
  }

  _supabase = createClient(url, key);
  return _supabase;
}

const ROOMS: Room[] = [
  { id: "206", name: "King Suite", type: "King Suite", price: 50000 },
  { id: "204", name: "Queen Suite", type: "Queen Suite", price: 40000 },
  { id: "101", name: "Deluxe Room 101", type: "Deluxe Room", price: 30000 },
  { id: "102", name: "Deluxe Room 102", type: "Deluxe Room", price: 30000 },
  { id: "201", name: "Deluxe Room 201", type: "Deluxe Room", price: 30000 },
  { id: "202", name: "Deluxe Room 202", type: "Deluxe Room", price: 30000 },
  { id: "203", name: "Deluxe Room 203", type: "Deluxe Room", price: 30000 },
  { id: "205", name: "Deluxe Room 205", type: "Deluxe Room", price: 30000 },
  { id: "103", name: "Standard Room", type: "Standard Room", price: 23000 },
];

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getRooms(): Promise<Room[]>;
  getBookings(): Promise<Booking[]>;
  getAllBookings(): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  deleteBooking(id: string): Promise<boolean>;
}

export class SupabaseStorage implements IStorage {
  private users: Map<string, User> = new Map();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (u) => u.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getRooms(): Promise<Room[]> {
    return ROOMS;
  }

  async getBookings(): Promise<Booking[]> {
    const { data, error } = await getSupabase()
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Storage] getBookings error:", error.message);
      throw new Error(error.message);
    }

    return ((data ?? []) as any[]).map((row) => ({
      id: row.id,
      roomId: row.room_id,
      guestName: row.guest_name,
      checkIn: new Date(row.check_in),
      checkOut: new Date(row.check_out),
      checkinTime: row.checkin_time ?? null,
      checkoutTime: row.checkout_time ?? "12:00 PM",
      nightlyRate: Number(row.nightly_rate),
    }));
  }

  async getAllBookings(): Promise<Booking[]> {
    const { data, error } = await getSupabase()
      .from("bookings")
      .select("*")
      .order("check_in", { ascending: true });

    if (error) {
      console.error("[Storage] getAllBookings error:", error.message);
      throw new Error(error.message);
    }

    return ((data ?? []) as any[]).map((row) => ({
      id: row.id,
      roomId: row.room_id,
      guestName: row.guest_name,
      checkIn: new Date(row.check_in),
      checkOut: new Date(row.check_out),
      checkinTime: row.checkin_time ?? null,
      checkoutTime: row.checkout_time ?? "12:00 PM",
      nightlyRate: Number(row.nightly_rate),
    }));
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
  const id = randomUUID();
  const room = ROOMS.find((r) => r.id === booking.roomId);

  if (!room) {
    throw new Error(`Room ${booking.roomId} was not found.`);
  }

  const suppliedRate = Number(booking.nightlyRate);

  // Historical/manual bookings can supply their original rate.
  // Normal bookings fall back to the room's current price.
  const nightlyRate =
    Number.isFinite(suppliedRate) && suppliedRate > 0
      ? suppliedRate
      : room.price;

  const { data, error } = await (getSupabase() as any)
    .from("bookings")
    .insert({
      id,
      room_id: booking.roomId,
      room_name: room.name,
      guest_name: booking.guestName,
      check_in: new Date(booking.checkIn).toISOString(),
      check_out: new Date(booking.checkOut).toISOString(),
      checkin_time: booking.checkinTime ?? null,
      checkout_time: booking.checkoutTime ?? "12:00 PM",
      nightly_rate: nightlyRate,
    })
    .select()
    .single();

  if (error) {
    console.error("[Storage] createBooking error:", error.message);
    throw new Error(error.message);
  }

  return {
    id: data.id,
    roomId: data.room_id,
    guestName: data.guest_name,
    checkIn: new Date(data.check_in),
    checkOut: new Date(data.check_out),
    checkinTime: data.checkin_time ?? null,
    checkoutTime: data.checkout_time ?? "12:00 PM",
    nightlyRate: Number(data.nightly_rate),
  };
}

  async deleteBooking(id: string): Promise<boolean> {
    const { error, count } = await getSupabase()
      .from("bookings")
      .delete({ count: "exact" })
      .eq("id", id);

    if (error) {
      console.error("[Storage] deleteBooking error:", error.message);
      throw new Error(error.message);
    }

    return (count ?? 0) > 0;
  }
}

export const storage = new SupabaseStorage();