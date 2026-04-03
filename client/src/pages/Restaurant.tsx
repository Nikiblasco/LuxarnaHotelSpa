import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Clock, UtensilsCrossed, Music, Wine } from "lucide-react";
import restaurantImage from "@assets/LUXARNA_RESTAURANT_1774999476903.png";

const mealTimes = [
  { name: "Breakfast", time: "7:00 AM – 11:30 AM" },
  { name: "Lunch", time: "12:00 PM – 4:00 PM" },
  { name: "Dinner", time: "5:00 PM – 11:30 PM" },
];

export default function Restaurant() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-24 md:pt-32 pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <p
              className="text-primary font-medium tracking-widest uppercase text-sm mb-3"
              data-testid="text-restaurant-subtitle"
            >
              <button
                className="
                 bg-gradient-to-br from-[#D4AF37] via-[#FFD700] to-[#B8860B] 
                 text-black font-serif font-bold text-xl uppercase tracking-widest
                 py-6 px-10 
                 rounded-none 
                 shadow-[5px_5px_15px_rgba(0,0,0,0.4)]
                 border-2 border-[#996515]
                 transition-all duration-300 ease-in-out
                 hover:scale-105 hover:brightness-110
                 active:scale-95
                 text-center
                "
              >
                Book a Table <br /> Now
              </button>
            </p>
            <h1
              className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4"
              data-testid="text-restaurant-title"
            >
              Restaurant & Karaoke Bar
            </h1>
            <p
              className="text-muted-foreground text-lg max-w-2xl mx-auto"
              data-testid="text-restaurant-desc"
            >
              Tasty our local dishes and chanel your inner superstar.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            <Card className="overflow-hidden">
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={restaurantImage}
                  alt="Restaurant interior"
                  className="w-full h-full object-cover"
                />
              </div>
            </Card>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <UtensilsCrossed className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2
                    className="font-serif text-2xl font-bold text-foreground"
                    data-testid="text-dining-title"
                  >
                    Eat what you like, when you like...
                  </h2>
                </div>
              </div>

              <div className="space-y-4">
                {mealTimes.map((meal, index) => (
                  <Card
                    key={meal.name}
                    className="p-4 flex items-center gap-4"
                    data-testid={`card-meal-${index}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-foreground">
                        {meal.name}
                      </h3>
                      <span className="text-primary font-medium text-sm">
                        {meal.time}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6 order-2 lg:order-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Music className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2
                    className="font-serif text-2xl font-bold text-foreground"
                    data-testid="text-karaoke-title"
                  >
                    Karaoke Bar
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Entertainment & nightlife
                  </p>
                </div>
              </div>

              <p
                className="text-muted-foreground leading-relaxed"
                data-testid="text-karaoke-desc"
              >
                Unwind and showcase your vocal talents at our vibrant karaoke
                bar. With an extensive song library, premium drinks, and a
                lively atmosphere, it's the perfect spot for memorable nights
                with friends and family.
              </p>

              <Card className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Wine className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Bar Hours</h3>
                  <p className="text-primary font-medium text-sm">
                    5:00 PM – 2:00 AM
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Premium cocktails and drinks available
                  </p>
                </div>
              </Card>
            </div>

            <Card className="overflow-hidden order-1 lg:order-2">
              <div className="aspect-[16/10] overflow-hidden bg-secondary flex items-center justify-center">
                <div className="text-center p-8">
                  <Music className="w-16 h-16 text-primary mx-auto mb-4" />
                  <p className="text-secondary-foreground font-medium">
                    Karaoke Bar
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
