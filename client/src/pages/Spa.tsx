import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ServiceCard from "@/components/ServiceCard";
import { Card } from "@/components/ui/card";
import { Sparkles, Hand, Footprints, Heart } from "lucide-react";
import spaImage from "@assets/generated_images/luxury_spa_treatment_room.png";

const spaServices = [
  {
    name: "Full Body Massage",
    price: 45000,
    description: "Indulge in our signature full body massage that combines traditional techniques with modern relaxation therapy. Release tension, improve circulation, and leave feeling completely renewed.",
    duration: "90 minutes",
    icon: Sparkles,
  },
  {
    name: "Facials",
    price: 18000,
    description: "Rejuvenate your skin with our premium facial treatments. Using high-quality products, our specialists will cleanse, exfoliate, and nourish your skin for a radiant glow.",
    duration: "60 minutes",
    icon: Heart,
  },
  {
    name: "Pedicure",
    price: 7500,
    description: "Treat your feet to our relaxing pedicure service. Includes foot soak, exfoliation, nail care, and massage for beautifully pampered feet.",
    duration: "45 minutes",
    icon: Footprints,
  },
  {
    name: "Manicure",
    price: 7500,
    description: "Experience our professional manicure service featuring nail shaping, cuticle care, hand massage, and your choice of polish for elegant, well-groomed hands.",
    duration: "30 minutes",
    icon: Hand,
  },
];

export default function Spa() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <section className="pt-24 md:pt-32 pb-16 md:pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-primary font-medium tracking-widest uppercase text-sm mb-3" data-testid="text-spa-subtitle">
              Wellness & Relaxation
            </p>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4" data-testid="text-spa-title">
              Luxarna Spa
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto" data-testid="text-spa-desc">
              Escape into a world of tranquility. Our spa offers a sanctuary where you can rejuvenate your body, calm your mind, and restore your spirit.
            </p>
          </div>

          <Card className="overflow-hidden mb-12">
            <div className="aspect-[21/9] overflow-hidden">
              <img
                src={spaImage}
                alt="Luxarna Spa treatment room"
                className="w-full h-full object-cover"
              />
            </div>
          </Card>

          <div className="space-y-6">
            {spaServices.map((service) => (
              <ServiceCard key={service.name} {...service} />
            ))}
          </div>

          <div className="mt-16 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-8 md:p-12 text-center">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-4" data-testid="text-spa-cta-title">
              Book Your Spa Experience
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto" data-testid="text-spa-cta-desc">
              Our spa is open daily from 9:00 AM to 9:00 PM. Advance booking is recommended to ensure availability.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/contact" className="inline-block">
                <button className="bg-primary text-primary-foreground px-8 py-3 rounded-md font-semibold hover-elevate" data-testid="button-book-spa">
                  Book Now
                </button>
              </a>
              <a href="tel:+2348000000000" className="inline-block">
                <button className="border border-border bg-background px-8 py-3 rounded-md font-semibold hover-elevate" data-testid="button-call-spa">
                  Call to Inquire
                </button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
