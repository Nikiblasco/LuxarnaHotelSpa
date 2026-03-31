import {
  type User,
  type InsertUser,
  type Room,
  type Booking,
  type InsertBooking,
} from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

if (!fs.existsSync(BOOKINGS_FILE)) {
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify([]));
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getRooms(): Promise<Room[]>;
  getBookings(): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
}

export class JSONStorage implements IStorage {
  private users: Map<string, User>;
  private rooms: Room[];

  constructor() {
    this.users = new Map();
    this.rooms = [
      { id: "1", name: "Deluxe King Suite", type: "Suite", price: 50000 },
      { id: "2", name: "King Suite", type: "Suite", price: 40000 },
      { id: "3", name: "Deluxe Room", type: "Room", price: 30000 },
      { id: "4", name: "Standard Room", type: "Room", price: 23000 },
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
}

export const storage = new JSONStorage();
