import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RoomCard from "@/components/RoomCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Room, Booking } from "@shared/schema";

import KingSuiteImage    from "@assets/room pics 2_1764432338683.webp";
import QueenSuiteImage   from "@assets/luxarna.jpeg";
import deluxeRoomImage   from "@assets/1764434733686_1764435313833.jpg";
import standardRoomImage from "@assets/generated_images/standard_hotel_room_interior.png";

const WHATSAPP_NUMBER = "2347049929851";

const TYPE_IMAGES: Record<string, string> = {
  "King Suite":   KingSuiteImage,
  "Queen Suite":  QueenSuiteImage,
  "Deluxe Room":  deluxeRoomImage,
  "Standard Room": standardRoomImage,
};

const TYPE_DETAILS: Record<string, { description: string; amenities: string[]; featured?: boolean }> = {
  "King Suite": {
    description: "Our most prestigious accommodation — a sprawling king suite with panoramic views, a private sitting lounge, and premium finishes throughout. Perfect for a truly indulgent stay.",
    amenities: ["wifi", "ac", "tv", "bathroom", "breakfast", "parking"],
    featured: true,
  },
  "Queen Suite": {
    description: "A sophisticated Queen suite blending modern elegance with warm Nigerian hospitality. Spacious, serene, and designed for ultimate comfort.",
    amenities: ["wifi", "ac", "tv", "bathroom", "breakfast", "parking"],
  },
  "Deluxe Room": {
    description: "A beautifully appointed deluxe room offering generous space, refined décor, and all the comfort you need for a relaxing and productive stay.",
    amenities: ["wifi", "ac", "tv", "bathroom", "parking"],
  },
  "Standard Room": {
    description: "Smart, comfortable, and thoughtfully furnished — our standard room delivers excellent value with everything you need for a pleasant night's rest.",
    amenities: ["wifi", "ac", "tv", "bathroom", "parking"],
  },
};

const TYPE_ORDER = ["King Suite", "Queen Suite", "Deluxe Room", "Standard Room"];

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount);

export default function Rooms() {
  const [checkIn,  setCheckIn]  = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [name,     setName]     = useState("");

  const { data: rooms    } = useQuery<Room[]>   ({ queryKey: ["/api/rooms"]    });
  const { data: bookings } = useQuery<Booking[]>({ queryKey: ["/api/bookings"] });

  const getNights = () => {
    if (!checkIn || !checkOut) return 0;
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
  };

  const isRoomBooked = (roomId: string) => {
    if (!bookings || !checkIn || !checkOut) return false;
    const start = new Date(checkIn);
    const end   = new Date(checkOut);
    return bookings.some(
      b =>
        b.roomId === roomId &&
        start < new Date(b.checkOut) &&
        end   > new Date(b.checkIn)
    );
  };

  const getTypeAvailability = (roomsOfType: Room[]) => {
    const total = roomsOfType.length;
    if (!checkIn || !checkOut) {
      return { status: "no_dates" as const, availableRooms: roomsOfType, count: total, total };
    }
    const start = new Date(checkIn);
    const end   = new Date(checkOut);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return { status: "invalid" as const, availableRooms: [], count: 0, total };
    }
    const availableRooms = roomsOfType.filter(r => !isRoomBooked(r.id));
    return {
      status: availableRooms.length === 0 ? ("occupied" as const) : ("available" as const),
      availableRooms,
      count: availableRooms.length,
      total,
    };
  };

  const handleBookNow = (type: string, pricePerNight: number) => {
    const nights = getNights();

    // Build a friendly pre-filled WhatsApp message
    let text = `Hello Luxarna Hotel! I'd like to book the ${type}.`;

    if (name.trim()) text += ` My name is ${name.trim()}.`;

    if (checkIn && checkOut && nights > 0) {
      const fmtDate = (d: string) =>
        new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      const total = formatPrice(pricePerNight * nights);
      text += ` Check-in: ${fmtDate(checkIn)}, Check-out: ${fmtDate(checkOut)} (${nights} night${nights > 1 ? "s" : ""}). Total: ${total}.`;
    }

    text += " Please confirm availability and payment details. Thank you!";

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const roomsByType = rooms
    ? TYPE_ORDER.map(type => ({ type, rooms: rooms.filter(r => r.type === type) })).filter(g => g.rooms.length > 0)
    : [];

  const nights = getNights();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <section className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4">

          {/* ── Optional details panel ── */}
          <div className="bg-card p-6 rounded-lg shadow-sm mb-12 border">
            <h2 className="font-serif text-2xl mb-2">Check Availability</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Optionally fill in your details and dates — they'll be included in your WhatsApp message to us automatically.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="name"
                  data-testid="input-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Ada Okafor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkIn">Check-in <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="checkIn"
                  type="date"
                  data-testid="input-checkin"
                  value={checkIn}
                  onChange={e => setCheckIn(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOut">Check-out <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="checkOut"
                  type="date"
                  data-testid="input-checkout"
                  value={checkOut}
                  onChange={e => setCheckOut(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ── Room cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {roomsByType.map(({ type, rooms: roomsOfType }) => {
              const avail      = getTypeAvailability(roomsOfType);
              const isMultiple = roomsOfType.length > 1;
              const price      = roomsOfType[0]?.price ?? 0;
              const total      = nights > 0 ? price * nights : null;

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
                avail.status === "no_dates"  ? "Select dates above to check availability" :
                avail.status === "invalid"   ? "Check-out must be after check-in" :
                avail.status === "occupied"  ? "Sold Out for these dates" :
                "Available";

              // Button label
              const btnLabel = total
                ? `Book Now — ${formatPrice(total)} (${nights} night${nights > 1 ? "s" : ""})`
                : "Book Now via WhatsApp";

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
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${badgeClass}`}>
                        {avail.status === "no_dates"
                          ? `${avail.total} rooms available`
                          : avail.count === 0
                          ? `All ${avail.total} rooms fully booked`
                          : `${avail.count} of ${avail.total} rooms remaining`}
                      </span>
                    ) : (
                      <p className={`text-xs font-semibold ${singleStatusColor}`}>
                        {singleStatusText}
                      </p>
                    )}

                    <Button
                      className="w-full"
                      data-testid={`button-book-${type.toLowerCase().replace(/\s+/g, "-")}`}
                      onClick={() => handleBookNow(type, price)}
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
