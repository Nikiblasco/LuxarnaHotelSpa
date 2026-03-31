import RoomCard from "../RoomCard";
import roomImage from "@assets/room pics 2_1764432338683.webp";

export default function RoomCardExample() {
  return (
    <div className="max-w-md">
      <RoomCard
        name="Deluxe King Suite"
        price={50000}
        description="Our most spacious suite featuring a luxurious king-size bed, elegant furnishings, premium bathroom with jacuzzi, and a private living area."
        image={roomImage}
        amenities={["wifi", "parking", "breakfast", "tv", "ac", "bathroom"]}
        featured={true}
      />
    </div>
  );
}
