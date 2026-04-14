import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RoomCard from "@/components/RoomCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Room, Booking } from "@shared/schema";

import KingSuiteImage from "@assets/room pics 2_1764432338683.webp";
import QueenSuiteImage from "@assets/luxarna.jpeg";
import deluxeRoomImage from "@assets/1764434733686_1764435313833.jpg";
import standardRoomImage from "@assets/generated_images/standard_hotel_room_interior.png";

const TYPE_IMAGES: Record<string, string> = {
  "King Suite": KingSuiteImage,
  "Queen Suite": QueenSuiteImage,
  "Deluxe Room": deluxeRoomImage,
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

export default function Rooms() {
  const { toast } = useToast();
  const [checkIn, setCheckIn]     = useState("");
  const [checkOut, setCheckOut]   = useState("");
  const [guestName, setGuestName] = useState("");
  const [email, setEmail]         = useState("");
  const [loadingType, setLoadingType] = useState<string | null>(null);

  const { data: rooms }    = useQuery<Room[]>({ queryKey: ["/api/rooms"] });
  const { data: bookings } = useQuery<Booking[]>({ queryKey: ["/api/bookings"] });

  // ── Paystack payment flow ────────────────────────────────────────────────
  const payMutation = useMutation({
    mutationFn: async (data: { email: string; amount: number; name: string; room: string }) => {
      const res = await apiRequest("POST", "/initialize-payment", data);
      return res.json() as Promise<{ authorization_url: string; reference: string }>;
    },
    onSuccess: ({ authorization_url }) => {
      // Redirect to Paystack hosted checkout page
      window.location.href = authorization_url;
    },
    onError: (err: any) => {
      setLoadingType(null);
      toast({
        title: "Payment could not be initiated",
        description: err.message ?? "Please try again.",
        variant: "destructive",
      });
    },
  });

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

  const roomsByType = rooms
    ? TYPE_ORDER.map(type => ({ type, rooms: rooms.filter(r => r.type === type) })).filter(g => g.rooms.length > 0)
    : [];

  // Validate form fields before allowing Book Now
  const formReady = guestName.trim().length > 0 && email.trim().length > 0 && checkIn && checkOut;

  const getNights = () => {
    if (!checkIn || !checkOut) return 0;
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
  };

  const handleBookNow = (type: string, pricePerNight: number, availableRooms: Room[]) => {
    const roomToBook = availableRooms[0];
    if (!roomToBook) return;

    if (!formReady) {
      toast({
        title: "Please fill in all fields",
        description: "Name, email, check-in and check-out dates are required.",
        variant: "destructive",
      });
      return;
    }

    const nights = getNights();
    if (nights < 1) {
      toast({
        title: "Invalid dates",
        description: "Check-out must be at least one day after check-in.",
        variant: "destructive",
      });
      return;
    }

    const totalAmount = pricePerNight * nights;
    setLoadingType(type);
    payMutation.mutate({ email, amount: totalAmount, name: guestName, room: type });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <section className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4">

          {/* ── Booking form ── */}
          <div className="bg-card p-6 rounded-lg shadow-sm mb-12 border">
            <h2 className="font-serif text-2xl mb-6">Check Availability & Book</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="guestName">Full Name</Label>
                <Input
                  id="guestName"
                  data-testid="input-guest-name"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  placeholder="e.g. Ada Okafor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  data-testid="input-email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkIn">Check-in</Label>
                <Input
                  id="checkIn"
                  type="date"
                  data-testid="input-checkin"
                  value={checkIn}
                  onChange={e => setCheckIn(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOut">Check-out</Label>
                <Input
                  id="checkOut"
                  type="date"
                  data-testid="input-checkout"
                  value={checkOut}
                  onChange={e => setCheckOut(e.target.value)}
                />
              </div>
            </div>

            {/* Helper hint */}
            {!formReady && (
              <p className="text-xs text-muted-foreground mt-3">
                Fill in all four fields above, then click <strong>Book Now</strong> on any available room — you'll be taken to our secure Paystack checkout.
              </p>
            )}
          </div>

          {/* ── Room cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {roomsByType.map(({ type, rooms: roomsOfType }) => {
              const avail       = getTypeAvailability(roomsOfType);
              const isMultiple  = roomsOfType.length > 1;
              const isAvailable = avail.status === "available";
              const price       = roomsOfType[0]?.price ?? 0;
              const isPaying    = loadingType === type && payMutation.isPending;
              const nights      = getNights();
              const totalAmount = price * (nights > 0 ? nights : 1);
              const totalLabel  = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(totalAmount);

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
                avail.status === "no_dates"  ? "Please select dates first" :
                avail.status === "invalid"   ? "Check-out must be after check-in" :
                avail.status === "occupied"  ? "Sold Out for these dates" :
                "Available";

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
                      data-testid={`button-book-${type.toLowerCase().replace(/\s+/g, '-')}`}
                      disabled={!isAvailable || !formReady || isPaying}
                      onClick={() => handleBookNow(type, price, avail.availableRooms)}
                    >
                      {isPaying
                        ? "Redirecting to payment..."
                        : avail.status === "occupied"
                        ? "Sold Out"
                        : nights > 0 && formReady
                        ? `Book Now — ${totalLabel} (${nights} night${nights > 1 ? "s" : ""})`
                        : "Book Now"}
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
