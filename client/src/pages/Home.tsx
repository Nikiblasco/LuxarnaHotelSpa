import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import SectionPreview from "@/components/SectionPreview";
import GallerySection from "@/components/GallerySection";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Star, Shield, Heart, Award } from "lucide-react";

const features = [
  {
    icon: Star,
    title: "Premium Quality",
    description: "Every detail crafted to perfection for your comfort",
  },
  {
    icon: Shield,
    title: "Complete Privacy",
    description: "Your sanctuary away from the hustle and bustle",
  },
  {
    icon: Heart,
    title: "Personalized Service",
    description: "Attentive staff dedicated to your every need",
  },
  {
    icon: Award,
    title: "Award Winning",
    description: "Recognized for excellence in hospitality",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <SectionPreview />
      <GallerySection />

      <section className="py-16 md:py-24 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-primary font-medium tracking-widest uppercase text-sm mb-3" data-testid="text-why-subtitle">
              Why Choose Us
            </p>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground" data-testid="text-why-title">
              The Luxarna Experience
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="text-center space-y-4 p-6"
                data-testid={`feature-${index}`}
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-bold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-secondary text-secondary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/rooms">
              <Button size="lg" className="min-w-[180px]" data-testid="button-cta-book">
                Book Your Stay
              </Button>
            </Link>
            <Link href="/rooms">
              <Button variant="outline" size="lg" className="min-w-[180px]" data-testid="button-cta-rooms">
                View Our Rooms
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
