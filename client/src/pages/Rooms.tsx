import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RoomCard from "@/components/RoomCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Room, Booking } from "@shared/schema";

import deluxeKingSuiteImage from "@assets/room pics 2_1764432338683.webp";
import kingSuiteImage from "@assets/Room pics_1764432345524.webp";
import deluxeRoomImage from "@assets/1764434733686_1764435313833.jpg";
import standardRoomImage from "@assets/generated_images/standard_hotel_room_interior.png";

const ROOM_IMAGES: Record<string, string> = {
  "1": deluxeKingSuiteImage,
  "2": kingSuiteImage,
  "3": deluxeRoomImage,
  "4": standardRoomImage,
};

export default function Rooms() {
  const { toast } = useToast();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestName, setGuestName] = useState("");

  const { data: rooms } = useQuery<Room[]>({ queryKey: ["/api/rooms"] });
  const { data: bookings } = useQuery<Booking[]>({ queryKey: ["/api/bookings"] });

  const bookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/bookings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({ title: "Booking successful!", description: "We look forward to your stay." });
      setGuestName("");
    },
    onError: (err: any) => {
      toast({ 
        title: "Booking failed", 
        description: err.message || "Sold Out for these dates",
        variant: "destructive" 
      });
    }
  });

  const checkAvailability = (roomId: string) => {
    if (!checkIn || !checkOut || !bookings) return true;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (start >= end) return false;

    return !bookings.some(b => 
      b.roomId === roomId &&
      start < new Date(b.checkOut) &&
      end < new Date(b.checkIn)
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <section className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-card p-6 rounded-lg shadow-sm mb-12 border">
            <h2 className="font-serif text-2xl mb-6">Check Availability</h2>
            <div className="grid md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label>Guest Name</Label>
                <Input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Full Name" />
              </div>
              <div className="space-y-2">
                <Label>Check-in</Label>
                <Input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Check-out</Label>
                <Input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {rooms?.map((room) => {
              const available = checkAvailability(room.id);
              return (
                <div key={room.id} className="relative">
                  <RoomCard 
                    name={room.name} 
                    price={room.price}
                    image={ROOM_IMAGES[room.id]}
                    description={`${room.type} at Luxarna Hotel.`}
                  />
                  <div className="px-6 pb-6">
                    <Button 
                      className="w-full" 
                      disabled={!available || !checkIn || !checkOut || !guestName || bookingMutation.isPending}
                      onClick={() => bookingMutation.mutate({
                        roomId: room.id,
                        guestName,
                        checkIn,
                        checkOut
                      })}
                    >
                      {available ? "Book Now" : "Sold Out for these dates"}
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
