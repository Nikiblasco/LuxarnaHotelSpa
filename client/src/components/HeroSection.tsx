import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import heroImage from "@assets/luxarna-hotel-and-s-ng-port-harcourt-bc-15089961-0_1764432368085.jpg";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-fade-in-up space-y-6">
          <p 
            className="text-white/70 font-medium tracking-[0.3em] uppercase text-sm md:text-base"
            style={{ animationDelay: "0.2s" }}
            data-testid="text-hero-welcome"
          >
            Welcome to
          </p>
          
          <h1 
            className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-primary leading-tight drop-shadow-lg"
            style={{ animationDelay: "0.4s" }}
            data-testid="text-hero-tagline"
          >
            LUXARNA
          </h1>
          
          <p 
            className="font-serif text-xl sm:text-2xl md:text-3xl text-white/90 italic"
            style={{ animationDelay: "0.5s" }}
            data-testid="text-hero-subtitle"
          >
            Your Peaceful Escape Awaits
          </p>
          
          <p 
            className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
            style={{ animationDelay: "0.6s" }}
            data-testid="text-hero-description"
          >
            Experience luxury accommodation, world-class spa treatments, and unforgettable dining in the heart of Port Harcourt.
          </p>
          
          <div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            style={{ animationDelay: "0.8s" }}
          >
            <Link href="/contact">
              <Button 
                size="lg" 
                className="min-w-[180px] text-base font-semibold shadow-lg shadow-primary/25"
                data-testid="button-hero-book"
              >
                Book Your Stay
              </Button>
            </Link>
            <Link href="/rooms">
              <Button 
                variant="outline" 
                size="lg" 
                className="min-w-[180px] text-base font-semibold bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
                data-testid="button-hero-explore"
              >
                Explore Rooms
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <button 
        onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 hover:text-white transition-colors animate-bounce"
        data-testid="button-scroll-down"
      >
        <ChevronDown className="w-8 h-8" />
      </button>

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up > * {
          opacity: 0;
          animation: fade-in-up 0.8s ease-out forwards;
        }
      `}</style>
    </section>
  );
}
