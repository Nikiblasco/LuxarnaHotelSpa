import ServiceCard from "../ServiceCard";
import { Sparkles } from "lucide-react";

export default function ServiceCardExample() {
  return (
    <div className="max-w-xl">
      <ServiceCard
        name="Full Body Massage"
        price={45000}
        description="Indulge in our signature full body massage that combines traditional techniques with modern relaxation therapy."
        duration="90 minutes"
        icon={Sparkles}
      />
    </div>
  );
}
