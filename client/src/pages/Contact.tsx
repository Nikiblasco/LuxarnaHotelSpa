import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

const contactInfo = [
  {
    icon: MapPin,
    title: "Address",
    content: "Plot 13, Trunk C, Mandela Estate",
    subContent: "Port Harcourt, Rivers State, Nigeria",
  },
  {
    icon: Phone,
    title: "Phone",
    content: "+234 704 992 9851",
    subContent: "",
  },
  {
    icon: Mail,
    title: "Email",
    content: "LuxarnaHotel@gmail.com",
    subContent: "",
  },
  {
    icon: Clock,
    title: "Reception Hours",
    content: "24 Hours",
    subContent: "7 Days a Week",
  },
];

export default function Contact() {
  const handleWhatsAppClick = () => {
    window.open("https://wa.me/2347049929851", "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <section className="pt-24 md:pt-32 pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-primary font-medium tracking-widest uppercase text-sm mb-3" data-testid="text-contact-subtitle">
              Get In Touch
            </p>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4" data-testid="text-contact-title">
              Contact Us
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto" data-testid="text-contact-desc">
              Have questions or ready to book your stay? We're here to help you plan your perfect escape.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {contactInfo.map((info, index) => (
                  <Card key={info.title} className="p-6 hover-elevate" data-testid={`card-contact-info-${index}`}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <info.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{info.title}</h3>
                        <p className="text-muted-foreground text-sm">{info.content}</p>
                        <p className="text-muted-foreground text-sm">{info.subContent}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                    <SiWhatsapp className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">Chat on WhatsApp</h3>
                    <p className="text-muted-foreground text-sm mb-3">Quick responses during business hours</p>
                    <Button
                      onClick={handleWhatsAppClick}
                      className="bg-green-500 hover:bg-green-600 text-white gap-2"
                      data-testid="button-whatsapp"
                    >
                      <SiWhatsapp className="w-4 h-4" />
                      Start Chat
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="overflow-hidden h-64 md:h-80">
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium" data-testid="text-map-placeholder">Map Placeholder</p>
                    <p className="text-muted-foreground text-sm">Plot 13, Trunk C, Mandela Estate</p>
                  </div>
                </div>
              </Card>
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-6" data-testid="text-form-title">
                Send Us a Message
              </h2>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
