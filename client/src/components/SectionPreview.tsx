import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Bed, Sparkles, UtensilsCrossed, Heart } from "lucide-react";
import roomImage1 from "@assets/room pics 2_1764432338683.webp";
import roomImage2 from "@assets/Room pics_1764432345524.webp";

const sections = [
  {
    title: "Luxurious Rooms",
    description: "Elegantly designed rooms with modern amenities, plush bedding, and breathtaking ambiance for your perfect stay.",
    icon: Bed,
    image: roomImage1,
    link: "/rooms",
    cta: "View Rooms",
  },
  {
    title: "Relaxing Spa",
    description: "Rejuvenate your body and mind with our world-class spa treatments, from massages to facials.",
    icon: Sparkles,
    image: roomImage2,
    link: "/spa",
    cta: "Explore Spa",
  },
  {
    title: "Fine Dining",
    description: "Savor exquisite cuisine at our restaurant and enjoy entertainment at our karaoke bar.",
    icon: UtensilsCrossed,
    image: roomImage1,
    link: "/restaurant",
    cta: "See Menu",
  },
  {
    title: "Our Story",
    description: "Discover the Luxarna experience - where comfort, privacy, and luxury come together.",
    icon: Heart,
    image: roomImage2,
    link: "/about",
    cta: "Learn More",
  },
];

export default function SectionPreview() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-primary font-medium tracking-widest uppercase text-sm mb-3" data-testid="text-section-subtitle">
            Discover Luxarna
          </p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground" data-testid="text-section-title">
            Experience Premium Hospitality
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {sections.map((section, index) => (
            <Card
              key={section.title}
              className="group relative overflow-hidden border-0 hover-elevate"
              data-testid={`card-preview-${index}`}
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={section.image}
                  alt={section.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center">
                    <section.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-serif text-xl md:text-2xl font-bold text-white" data-testid={`text-preview-title-${index}`}>
                    {section.title}
                  </h3>
                </div>
                <p className="text-white/80 text-sm md:text-base mb-4 line-clamp-2" data-testid={`text-preview-desc-${index}`}>
                  {section.description}
                </p>
                <Link href={section.link}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-fit bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 gap-2 group/btn"
                    data-testid={`button-preview-${index}`}
                  >
                    {section.cta}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
