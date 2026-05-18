import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RoomCard from "@/components/RoomCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CalendarDays } from "lucide-react";
import { Room, Booking } from "@shared/schema";

import KingSuiteImage from "@assets/niiggg.png";
import QueenSuiteImage from "@assets/holyyyyy.png";
import deluxeRoomImage from "@assets/nicholas.jpg";
import standardRoomImage from "@assets/OMOSEEYAHOONA.png";

const WHATSAPP_NUMBER = "2347049929851";

const TYPE_IMAGES: Record<string, string> = {
  "King Suite": KingSuiteImage,
  "Queen Suite": QueenSuiteImage,
  "Deluxe Room": deluxeRoomImage,
  "Standard Room": standardRoomImage,
};

const TYPE_DETAILS: Record<
  string,
  { description: string; amenities: string[]; featured?: boolean }
> = {
  "King Suite": {
    description:
      "Our most prestigious accommodation — a sprawling king suite with panoramic views, a private sitting lounge, and premium finishes throughout. Perfect for a truly indulgent stay.",
    amenities: ["wifi", "ac", "tv", "bathroom", "breakfast", "parking"],
    featured: true,
  },
  "Queen Suite": {
    description:
      "A sophisticated Queen suite blending modern elegance with warm Nigerian hospitality. Spacious, serene, and designed for ultimate comfort.",
    amenities: ["wifi", "ac", "tv", "bathroom", "breakfast", "parking"],
  },
  "Deluxe Room": {
    description:
      "A beautifully appointed deluxe room offering generous space, refined décor, and all the comfort you need for a relaxing and productive stay.",
    amenities: ["wifi", "ac", "tv", "bathroom", "parking"],
  },
  "Standard Room": {
    description:
      "Smart, comfortable, and thoughtfully furnished — our standard room delivers excellent value with everything you need for a pleasant night's rest.",
    amenities: ["wifi", "ac", "tv", "bathroom", "parking"],
  },
};

const TYPE_ORDER = [
  "King Suite",
  "Queen Suite",
  "Deluxe Room",
  "Standard Room",
];

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);

export default function Rooms() {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [name, setName] = useState("");
  const [showDialog, setShowDialog] = useState(false);

  const { data: rooms } = useQuery<Room[]>({ queryKey: ["/api/rooms"] });
  const { data: bookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const datesReady = () => {
    if (!checkIn || !checkOut) return false;
    const s = new Date(checkIn);
    const e = new Date(checkOut);
    return !isNaN(s.getTime()) && !isNaN(e.getTime()) && e > s;
  };

  const getNights = () => {
    if (!datesReady()) return 0;
    return Math.round(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
        (1000 * 60 * 60 * 24),
    );
  };

  const isRoomBooked = (roomId: string) => {
    if (!bookings || !datesReady()) return false;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return bookings.some(
      (b) =>
        b.roomId === roomId &&
        start < new Date(b.checkOut) &&
        end > new Date(b.checkIn),
    );
  };

  const getTypeAvailability = (roomsOfType: Room[]) => {
    const total = roomsOfType.length;
    if (!checkIn || !checkOut) {
      return {
        status: "no_dates" as const,
        availableRooms: roomsOfType,
        count: total,
        total,
      };
    }
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return {
        status: "invalid" as const,
        availableRooms: [],
        count: 0,
        total,
      };
    }
    const availableRooms = roomsOfType.filter((r) => !isRoomBooked(r.id));
    return {
      status:
        availableRooms.length === 0
          ? ("occupied" as const)
          : ("available" as const),
      availableRooms,
      count: availableRooms.length,
      total,
    };
  };

  const handleBookNow = (
    type: string,
    pricePerNight: number,
    avail: ReturnType<typeof getTypeAvailability>,
  ) => {
    // Guard: dates not filled → show polite popup
    if (!datesReady()) {
      setShowDialog(true);
      return;
    }

    // Guard: room fully booked for these dates (shouldn't reach here if button is disabled, but safety net)
    if (avail.status === "occupied") return;

    const nights = getNights();
    let text = `Hello Luxarna Hotel! I'd like to book the ${type}.`;
    if (name.trim()) text += ` My name is ${name.trim()}.`;

    const fmtDate = (d: string) =>
      new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    const total = formatPrice(pricePerNight * nights);
    text += ` Check-in: ${fmtDate(checkIn)}, Check-out: ${fmtDate(checkOut)} (${nights} night${nights > 1 ? "s" : ""}). Total: ${total}.`;
    text += " Please confirm availability and payment details. Thank you!";

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  };

  const roomsByType = rooms
    ? TYPE_ORDER.map((type) => ({
        type,
        rooms: rooms.filter((r) => r.type === type),
      })).filter((g) => g.rooms.length > 0)
    : [];

  const nights = getNights();
  const ready = datesReady();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* ── "Please choose dates" popup ── */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="max-w-sm text-center"
          data-testid="dialog-dates-required"
        >
          <DialogHeader className="items-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <CalendarDays className="w-7 h-7 text-primary" />
            </div>
            <DialogTitle className="font-serif text-xl">
              Choose Your Dates First
            </DialogTitle>
            <DialogDescription className="text-base mt-1">
              Please select your <strong>check-in</strong> and{" "}
              <strong>check-out</strong> dates above so we can check
              availability for you before booking.
            </DialogDescription>
          </DialogHeader>
          <Button
            className="w-full mt-2"
            onClick={() => setShowDialog(false)}
            data-testid="button-dialog-ok"
          >
            Got it, I'll choose my dates
          </Button>
        </DialogContent>
      </Dialog>

      <section className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* ── Availability form ── */}
          <div className="bg-card p-6 rounded-lg shadow-sm mb-12 border">
            <h2 className="font-serif text-2xl mb-1">Check Availability</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Select your dates to see availability, then click{" "}
              <strong>Book Now</strong> on any room to continue via WhatsApp.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Your Name{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="name"
                  data-testid="input-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ada Okafor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkIn">
                  Check-in{" "}
                  <span className="text-destructive font-normal text-xs">
                    *required
                  </span>
                </Label>
                <Input
                  id="checkIn"
                  type="date"
                  data-testid="input-checkin"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className={
                    !checkIn
                      ? "border-destructive/40 focus-visible:ring-destructive/40"
                      : ""
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOut">
                  Check-out{" "}
                  <span className="text-destructive font-normal text-xs">
                    *required
                  </span>
                </Label>
                <Input
                  id="checkOut"
                  type="date"
                  data-testid="input-checkout"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className={
                    !checkOut
                      ? "border-destructive/40 focus-visible:ring-destructive/40"
                      : ""
                  }
                />
              </div>
            </div>

            {/* Live night count once both dates filled */}
            {ready && nights > 0 && (
              <p className="mt-4 text-sm text-primary font-medium">
                {nights} night{nights > 1 ? "s" : ""} selected — rooms below now
                show live availability.
              </p>
            )}
          </div>

          {/* ── Room cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {roomsByType.map(({ type, rooms: roomsOfType }) => {
              const avail = getTypeAvailability(roomsOfType);
              const isMultiple = roomsOfType.length > 1;
              const price = roomsOfType[0]?.price ?? 0;
              const isOccupied = avail.status === "occupied";

              // Button is disabled only when the room is fully booked for the chosen dates
              const btnDisabled = isOccupied;

              const badgeClass =
                avail.status === "no_dates"
                  ? "bg-muted text-muted-foreground"
                  : avail.count === 0
                    ? "bg-destructive/10 text-destructive"
                    : avail.count <= 2
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";

              const singleStatusColor =
                avail.status === "no_dates" || avail.status === "invalid"
                  ? "text-muted-foreground"
                  : avail.status === "occupied"
                    ? "text-destructive"
                    : "text-green-600 dark:text-green-400";

              const singleStatusText =
                avail.status === "no_dates"
                  ? "Select your dates above to check availability"
                  : avail.status === "invalid"
                    ? "Check-out must be after check-in"
                    : avail.status === "occupied"
                      ? "Sold Out for your selected dates"
                      : "Available for your dates";

              // Button label
              const btnLabel = isOccupied
                ? "Sold Out"
                : ready && nights > 0
                  ? `Book Now — ${formatPrice(price * nights)} (${nights} night${nights > 1 ? "s" : ""})`
                  : "Book Now";

              return (
                <div key={type} className="relative flex flex-col">
                  <div className="flex-1">
                    <RoomCard
                      name={type}
                      price={price}
                      image={TYPE_IMAGES[type]}
                      description={TYPE_DETAILS[type]?.description ?? ""}
                      amenities={TYPE_DETAILS[type]?.amenities ?? []}
                      featured={TYPE_DETAILS[type]?.featured}
                    />
                  </div>

                  <div className="px-4 py-3 bg-card border-x border-b rounded-b-lg -mt-2 flex flex-col items-center gap-2 text-center">
                    {isMultiple ? (
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${badgeClass}`}
                      >
                        {avail.status === "no_dates"
                          ? `${avail.total} rooms available — select dates to confirm`
                          : avail.count === 0
                            ? `All ${avail.total} rooms fully booked for these dates`
                            : `${avail.count} of ${avail.total} rooms available`}
                      </span>
                    ) : (
                      <p
                        className={`text-xs font-semibold ${singleStatusColor}`}
                      >
                        {singleStatusText}
                      </p>
                    )}

                    <Button
                      className="w-full"
                      disabled={btnDisabled}
                      data-testid={`button-book-${type.toLowerCase().replace(/\s+/g, "-")}`}
                      onClick={() => handleBookNow(type, price, avail)}
                    >
                      {btnLabel}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
