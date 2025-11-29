import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, Car, Coffee, Tv, AirVent, Bath } from "lucide-react";

interface RoomCardProps {
  name: string;
  price: number;
  description: string;
  image: string;
  amenities?: string[];
  featured?: boolean;
}

const amenityIcons: Record<string, typeof Wifi> = {
  wifi: Wifi,
  parking: Car,
  breakfast: Coffee,
  tv: Tv,
  ac: AirVent,
  bathroom: Bath,
};

export default function RoomCard({ name, price, description, image, amenities = [], featured }: RoomCardProps) {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="group overflow-hidden hover-elevate" data-testid={`card-room-${name.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {featured && (
          <Badge className="absolute top-4 left-4" data-testid="badge-featured">
            Popular Choice
          </Badge>
        )}
        <div className="absolute bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md font-bold text-lg shadow-lg" data-testid={`text-room-price-${name.toLowerCase().replace(/\s+/g, '-')}`}>
          {formatPrice(price)}
          <span className="text-sm font-normal opacity-90">/night</span>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <h3 className="font-serif text-xl md:text-2xl font-bold text-foreground" data-testid={`text-room-name-${name.toLowerCase().replace(/\s+/g, '-')}`}>
          {name}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed" data-testid={`text-room-desc-${name.toLowerCase().replace(/\s+/g, '-')}`}>
          {description}
        </p>
        
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-3 pt-2">
            {amenities.map((amenity) => {
              const Icon = amenityIcons[amenity] || Wifi;
              return (
                <div
                  key={amenity}
                  className="flex items-center gap-1.5 text-muted-foreground text-sm"
                  data-testid={`amenity-${amenity}`}
                >
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="capitalize">{amenity}</span>
                </div>
              );
            })}
          </div>
        )}

        <Button className="w-full mt-4" data-testid={`button-check-availability-${name.toLowerCase().replace(/\s+/g, '-')}`}>
          Check Availability
        </Button>
      </div>
    </Card>
  );
}
