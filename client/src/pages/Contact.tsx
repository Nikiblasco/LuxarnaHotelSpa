import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-12 md:mb-16">
            <p className="text-primary font-medium tracking-widest uppercase text-sm mb-3" data-testid="text-contact-subtitle">
              Get In Touch
            </p>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4" data-testid="text-contact-title">
              Contact Us
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto" data-testid="text-contact-desc">
              Have questions or ready to book your stay? Reach us directly — we're always happy to help.
            </p>
          </div>

          <div className="space-y-8">
            {/* Info cards */}
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
                      {info.subContent && <p className="text-muted-foreground text-sm">{info.subContent}</p>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* WhatsApp CTA */}
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
                    data-testid="button-whatsapp"
                  >
                    <SiWhatsapp className="w-4 h-4 mr-2" />
                    Start Chat
                  </Button>
                </div>
              </div>
            </Card>

            {/* Map */}
            <div className="w-full h-[420px] rounded-xl overflow-hidden shadow-sm border relative">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3975.385366472492!2d6.985994474980287!3d4.892911195083161!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1069d1ec4f59b535%3A0x9afd60f900d0cb3d!2sLuxarna%20Hotel%20and%20Spa!5e0!3m2!1sen!2sng!4v1712420000000!5m2!1sen!2sng"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Luxarna Hotel Location"
                className="absolute inset-0"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
