import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RoomCard from "@/components/RoomCard";
import deluxeKingSuiteImage from "@assets/room pics 2_1764432338683.webp";
import kingSuiteImage from "@assets/Room pics_1764432345524.webp";
import deluxeRoomImage from "@assets/1764434733686_1764435313833.jpg";
import standardRoomImage from "@assets/generated_images/standard_hotel_room_interior.png";

const rooms = [
  {
    name: "Deluxe King Suite",
    price: 45000,
    description: "Our most spacious suite featuring a luxurious king-size bed, elegant furnishings, premium bathroom with jacuzzi, and a private living area. Perfect for those seeking the ultimate in comfort and style.",
    image: deluxeKingSuiteImage,
    amenities: ["wifi", "parking", "breakfast", "tv", "ac", "bathroom"],
    featured: true,
  },
  {
    name: "King Suite",
    price: 35000,
    description: "A sophisticated suite with a comfortable king-size bed, modern decor, spacious bathroom, and premium amenities. Ideal for couples and business travelers looking for refined comfort.",
    image: kingSuiteImage,
    amenities: ["wifi", "parking", "tv", "ac", "bathroom"],
    featured: false,
  },
  {
    name: "Deluxe Room",
    price: 25000,
    description: "Elegantly appointed room with premium bedding, ambient LED lighting, stylish furnishings, and all modern amenities. A perfect balance of luxury and value.",
    image: deluxeRoomImage,
    amenities: ["wifi", "tv", "ac", "bathroom"],
    featured: false,
  },
  {
    name: "Standard Room",
    price: 20000,
    description: "Comfortable and well-equipped room featuring quality bedding, modern amenities, and everything you need for a pleasant stay. Great value without compromising on comfort.",
    image: standardRoomImage,
    amenities: ["wifi", "tv", "ac"],
    featured: false,
  },
];

export default function Rooms() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-24 md:pt-32 pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-primary font-medium tracking-widest uppercase text-sm mb-3" data-testid="text-rooms-subtitle">
              Accommodations
            </p>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4" data-testid="text-rooms-title">
              Our Luxurious Rooms
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto" data-testid="text-rooms-desc">
              Each room is thoughtfully designed with your comfort in mind, featuring modern amenities and elegant decor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {rooms.map((room) => (
              <RoomCard key={room.name} {...room} />
            ))}
          </div>

          <div className="mt-16 bg-card rounded-lg p-8 md:p-12 text-center">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-4" data-testid="text-special-requests">
              Special Requests?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Looking for extended stays, special arrangements, or group bookings? Contact us directly and we'll create a personalized experience just for you.
            </p>
            <a href="/contact" className="inline-block">
              <button className="bg-primary text-primary-foreground px-8 py-3 rounded-md font-semibold hover-elevate" data-testid="button-contact-special">
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