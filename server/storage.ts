import {
  type User,
  type InsertUser,
  type Room,
  type Booking,
  type InsertBooking,
  type InsertPaymentBooking,
  type PaymentBooking,
} from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

const DATA_DIR             = path.join(process.cwd(), "data");
const BOOKINGS_FILE        = path.join(DATA_DIR, "bookings.json");
const PAYMENT_BOOKINGS_FILE = path.join(DATA_DIR, "payment-bookings.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

if (!fs.existsSync(BOOKINGS_FILE)) {
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify([]));
}

if (!fs.existsSync(PAYMENT_BOOKINGS_FILE)) {
  fs.writeFileSync(PAYMENT_BOOKINGS_FILE, JSON.stringify([]));
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getRooms(): Promise<Room[]>;
  getBookings(): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  deleteBooking(id: string): Promise<boolean>;

  getPaymentBookings(): Promise<PaymentBooking[]>;
  createPaymentBooking(booking: InsertPaymentBooking): Promise<PaymentBooking>;
  updatePaymentBookingStatus(reference: string, status: "pending" | "confirmed" | "failed"): Promise<boolean>;
}

export class JSONStorage implements IStorage {
  private users: Map<string, User>;
  private rooms: Room[];

  constructor() {
    this.users = new Map();
    this.rooms = [
      { id: "206", name: "King Suite",   type: "King Suite",   price: 50000 },
      { id: "204", name: "Queen Suite", type: "Queen Suite", price: 40000 },
      { id: "101", name: "Deluxe Room 101",    type: "Deluxe Room",       price: 30000 },
      { id: "102", name: "Deluxe Room 102",    type: "Deluxe Room",       price: 30000 },
      { id: "201", name: "Deluxe Room 201",    type: "Deluxe Room",       price: 30000 },
      { id: "202", name: "Deluxe Room 202",    type: "Deluxe Room",       price: 30000 },
      { id: "203", name: "Deluxe Room 203",    type: "Deluxe Room",       price: 30000 },
      { id: "205", name: "Deluxe Room 205",    type: "Deluxe Room",       price: 30000 },
      { id: "103", name: "Standard Room",      type: "Standard Room",     price: 23000 },
    ];
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((u) => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getRooms(): Promise<Room[]> {
    return this.rooms;
  }

  async getBookings(): Promise<Booking[]> {
    try {
      const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
      if (!data || data.trim() === "") {
        return [];
      }
      const bookings = JSON.parse(data);
      return bookings.map((b: any) => ({
        ...b,
        checkIn: b.checkIn ? new Date(b.checkIn) : null,
        checkOut: b.checkOut ? new Date(b.checkOut) : null,
      }));
    } catch (e) {
      console.error("Error reading bookings file:", e);
      return [];
    }
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const bookings = await this.getBookings();
    const id = randomUUID();
    const booking = { ...insertBooking, id };
    bookings.push(booking);
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
    return booking;
  }

  async deleteBooking(id: string): Promise<boolean> {
    const bookings = await this.getBookings();
    const index = bookings.findIndex((b) => b.id === id);
    if (index === -1) return false;
    bookings.splice(index, 1);
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
    return true;
  }

  async getPaymentBookings(): Promise<PaymentBooking[]> {
    try {
      const data = fs.readFileSync(PAYMENT_BOOKINGS_FILE, "utf-8");
      if (!data || data.trim() === "") return [];
      return JSON.parse(data) as PaymentBooking[];
    } catch (e) {
      console.error("Error reading payment-bookings.json:", e);
      fs.writeFileSync(PAYMENT_BOOKINGS_FILE, JSON.stringify([]));
      return [];
    }
  }

  async updatePaymentBookingStatus(reference: string, status: "pending" | "confirmed" | "failed"): Promise<boolean> {
    const existing = await this.getPaymentBookings();
    const index = existing.findIndex(b => b.reference === reference);
    if (index === -1) return false;
    existing[index].status = status;
    fs.writeFileSync(PAYMENT_BOOKINGS_FILE, JSON.stringify(existing, null, 2));
    return true;
  }

  async createPaymentBooking(booking: InsertPaymentBooking): Promise<PaymentBooking> {
    const existing = await this.getPaymentBookings();

    // Prevent duplicate reference
    const duplicate = existing.find((b) => b.reference === booking.reference);
    if (duplicate) return duplicate;

    const newEntry: PaymentBooking = {
      ...booking,
      id:     randomUUID(),
      paidAt: new Date().toISOString(),
      status: "pending",
    };

    existing.push(newEntry);

    try {
      fs.writeFileSync(PAYMENT_BOOKINGS_FILE, JSON.stringify(existing, null, 2));
    } catch (e) {
      console.error("Error writing payment-bookings.json:", e);
      throw new Error("Could not save payment booking");
    }

    return newEntry;
  }
}

export const storage = new JSONStorage();
