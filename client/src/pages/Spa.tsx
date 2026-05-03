import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ServiceCard from "@/components/ServiceCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Hand, Footprints, Heart, Phone } from "lucide-react";
import spaImage from "@assets/generated_images/luxury_spa_treatment_room.png";

const WHATSAPP_SPA = "https://wa.me/2347049929851?text=Hello%20Luxarna%20Hotel!%20I%27d%20like%20to%20book%20a%20spa%20treatment.%20Please%20help%20me.";

const spaServices = [
  {
    name: "Full Body Massage",
    price: 40000,
    description: "Indulge in our signature full body massage that combines traditional techniques with modern relaxation therapy. Release tension, improve circulation, and leave feeling completely renewed.",
    duration: "45 minutes",
    icon: Sparkles,
  },
  {
    name: "Facials",
    price: 30000,
    description: "Rejuvenate your skin with our premium facial treatments. Using high-quality products, our specialists will cleanse, exfoliate, and nourish your skin for a radiant glow.",
    icon: Heart,
    duration: "30 minutes",
  },
  {
    name: "Pedicure",
    price: 7500,
    description: "Treat your feet to our relaxing pedicure service. Includes foot soak, exfoliation, nail care, and massage for beautifully pampered feet.",
    duration: "45-60 minutes",
    icon: Footprints,
  },
  {
    name: "Manicure",
    price: 7500,
    description: "Experience our professional manicure service featuring nail shaping, cuticle care, hand massage, and your choice of polish for elegant, well-groomed hands.",
    duration: "25-30 minutes",
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
              Enjoy 24hrs spa services at your beck and call.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => window.open(WHATSAPP_SPA, "_blank")}
                data-testid="button-book-spa"
              >
                Book Now
              </Button>
              <a href="tel:+2347049929851">
                <Button variant="outline" size="lg" className="gap-2" data-testid="button-call-spa">
                  <Phone className="w-4 h-4" />
                  Call to Inquire
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
