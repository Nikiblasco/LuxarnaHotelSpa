import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Shield, Heart, Sparkles, Users, Award, Leaf } from "lucide-react";
import heroImage from "@assets/luxarna-hotel-and-s-ng-port-harcourt-bc-15089961-0_1764432368085.jpg";

const coreValues = [
  {
    icon: Shield,
    title: "Privacy",
    description: "Your personal space and privacy are sacred to us. We ensure complete discretion and security throughout your stay.",
  },
  {
    icon: Heart,
    title: "Comfort",
    description: "Every element is designed with your comfort in mind, from our plush bedding to our attentive service.",
  },
  {
    icon: Sparkles,
    title: "Luxury",
    description: "Experience the finest in hospitality with premium amenities, elegant spaces, and exceptional attention to detail.",
  },
];

const stats = [
  { value: "50+", label: "Luxury Rooms" },
  { value: "24/7", label: "Room Service" },
  { value: "1000+", label: "Happy Guests" },
  { value: "5", label: "Star Experience" },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <section className="pt-24 md:pt-32 pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-primary font-medium tracking-widest uppercase text-sm mb-3" data-testid="text-about-subtitle">
              Our Story
            </p>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4" data-testid="text-about-title">
              About Luxarna
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto" data-testid="text-about-desc">
              Where luxury meets tranquility in the heart of Port Harcourt
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <div className="space-y-6">
              <p className="text-foreground text-lg leading-relaxed" data-testid="text-story-1">
                Welcome to <span className="text-primary font-semibold">Luxarna Hotel & Spa</span>, a premier destination for discerning travelers seeking an exceptional blend of luxury, comfort, and tranquility.
              </p>
              <p className="text-muted-foreground leading-relaxed" data-testid="text-story-2">
                Located in the prestigious Mandela Estate of Port Harcourt, Luxarna was founded with a singular vision: to create a sanctuary where guests can escape the ordinary and immerse themselves in extraordinary hospitality.
              </p>
              <p className="text-muted-foreground leading-relaxed" data-testid="text-story-3">
                Our hotel combines elegant architecture with modern amenities, featuring beautifully appointed rooms, a world-class spa, an exquisite restaurant, and vibrant entertainment options. Every corner of Luxarna reflects our commitment to excellence and our passion for creating memorable experiences.
              </p>
              <p className="text-muted-foreground leading-relaxed" data-testid="text-story-4">
                Whether you're here for business or leisure, a romantic getaway or a family celebration, we invite you to discover the Luxarna experience — where your peaceful escape truly awaits.
              </p>
            </div>

            <Card className="overflow-hidden">
              <img
                src={heroImage}
                alt="Luxarna Hotel exterior"
                className="w-full h-full object-cover"
              />
            </Card>
          </div>

          <div className="mb-16">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground text-center mb-12" data-testid="text-values-title">
              Our Core Values
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {coreValues.map((value, index) => (
                <Card key={value.title} className="p-8 text-center hover-elevate" data-testid={`card-value-${index}`}>
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <value.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-foreground mb-3">{value.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
                </Card>
              ))}
            </div>
          </div>

          <div className="bg-secondary rounded-lg p-8 md:p-12 mb-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={stat.label} className="text-center" data-testid={`stat-${index}`}>
                  <p className="font-serif text-3xl md:text-4xl font-bold text-primary mb-2">
                    {stat.value}
                  </p>
                  <p className="text-secondary-foreground text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6 text-center hover-elevate" data-testid="card-commitment-1">
              <Users className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Our Team</h3>
              <p className="text-muted-foreground text-sm">Dedicated professionals committed to exceeding your expectations</p>
            </Card>
            <Card className="p-6 text-center hover-elevate" data-testid="card-commitment-2">
              <Award className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Excellence</h3>
              <p className="text-muted-foreground text-sm">Award-winning service and hospitality standards</p>
            </Card>
            <Card className="p-6 text-center hover-elevate" data-testid="card-commitment-3">
              <Leaf className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Sustainability</h3>
              <p className="text-muted-foreground text-sm">Committed to eco-friendly practices and responsible hospitality</p>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
