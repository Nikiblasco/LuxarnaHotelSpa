import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RoomCard from "@/components/RoomCard";

// Import images
import deluxeKingSuiteImage from "@assets/room pics 2_1764432338683.webp";
import kingSuiteImage from "@assets/Room pics_1764432345524.webp";
import deluxeRoomImage from "@assets/1764434733686_1764435313833.jpg";
import standardRoomImage from "@assets/generated_images/standard_hotel_room_interior.png";

export default function Rooms() {
  const [dbRooms, setDbRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRooms() {
      try {
        const { data, error } = await supabase
          .from('Rooms')
          .select('*');

        if (error) throw error;

        if (data) {
          const formattedRooms = data.map(room => {
            const rawName = room['ROOM NAME'] || room.name || "Unknown Room";
            const upperName = rawName.toUpperCase();

            let img = standardRoomImage;
            let desc = room.description || "Comfortable and well-equipped room featuring modern amenities.";

            if (upperName.includes("DELUXE KING")) {
              img = deluxeKingSuiteImage;
              desc = desc || "Our most spacious suite featuring a luxurious king-size bed and premium bathroom.";
            } else if (upperName.includes("KING SUITE")) {
              img = kingSuiteImage;
              desc = desc || "A sophisticated suite with modern decor and premium amenities.";
            } else if (upperName.includes("DELUXE")) {
              img = deluxeRoomImage;
              desc = desc || "Elegantly appointed room with premium bedding and ambient lighting.";
            }

            return {
              name: rawName,
              price: room.PRICE || room.price || 0,
              description: desc,
              image: img,
              amenities: ["wifi", "tv", "ac", "bathroom"],
              featured: upperName.includes("KING"),
            };
          });
          setDbRooms(formattedRooms);
        }
      } catch (err) {
        console.error("Supabase Error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchRooms();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-24 md:pt-32 pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-primary font-medium tracking-widest uppercase text-sm mb-3">
              Accommodations
            </p>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Our Luxurious Rooms
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {loading ? "Checking live availability..." : "Each room is thoughtfully designed with your comfort in mind."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {dbRooms.map((room, index) => (
              <RoomCard key={index} {...room} />
            ))}
          </div>

          <div className="mt-16 bg-card rounded-lg p-8 md:p-12 text-center">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-4">
              Special Requests?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Looking for extended stays, special arrangements, or group bookings? Contact us directly.
            </p>
            <a href="/contact" className="inline-block">
              <button className="bg-primary text-primary-foreground px-8 py-3 rounded-md font-semibold hover-elevate">
                Contact Us
              </button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
