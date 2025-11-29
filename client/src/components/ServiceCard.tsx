import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ServiceCardProps {
  name: string;
  price: number;
  description: string;
  duration?: string;
  icon: LucideIcon;
}

export default function ServiceCard({ name, price, description, duration, icon: Icon }: ServiceCardProps) {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="p-6 hover-elevate group" data-testid={`card-service-${name.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0 transition-colors group-hover:bg-primary/20">
          <Icon className="w-7 h-7 text-primary" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <h3 className="font-serif text-lg font-bold text-foreground" data-testid={`text-service-name-${name.toLowerCase().replace(/\s+/g, '-')}`}>
              {name}
            </h3>
            <span className="text-primary font-bold text-lg" data-testid={`text-service-price-${name.toLowerCase().replace(/\s+/g, '-')}`}>
              {formatPrice(price)}
            </span>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed" data-testid={`text-service-desc-${name.toLowerCase().replace(/\s+/g, '-')}`}>
            {description}
          </p>
          {duration && (
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm pt-1">
              <Clock className="w-4 h-4" />
              <span>{duration}</span>
            </div>
          )}
          <Button variant="outline" size="sm" className="mt-3" data-testid={`button-book-service-${name.toLowerCase().replace(/\s+/g, '-')}`}>
            Book Now
          </Button>
        </div>
      </div>
    </Card>
  );
}
