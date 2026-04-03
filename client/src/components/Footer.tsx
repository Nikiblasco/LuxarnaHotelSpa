import { Link } from "wouter";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { SiWhatsapp, SiFacebook, SiInstagram } from "react-icons/si";
import { Button } from "@/components/ui/button";
import logoImage from "@assets/1764434830238_1764435323080.jpg";

export default function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                data-testid="link-social-whatsapp"
              >
                <SiWhatsapp className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                data-testid="link-social-facebook"
              >
                <SiFacebook className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                data-testid="link-social-instagram"
              >
                <SiInstagram className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/rooms"
                  className="text-secondary-foreground/80 hover:text-primary transition-colors"
                  data-testid="link-footer-rooms"
                >
                  Our Rooms
                </Link>
              </li>
              <li>
                <Link
                  href="/spa"
                  className="text-secondary-foreground/80 hover:text-primary transition-colors"
                  data-testid="link-footer-spa"
                >
                  Spa Services
                </Link>
              </li>
              <li>
                <Link
                  href="/restaurant"
                  className="text-secondary-foreground/80 hover:text-primary transition-colors"
                  data-testid="link-footer-restaurant"
                >
                  Restaurant & Karaoke
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-secondary-foreground/80 hover:text-primary transition-colors"
                  data-testid="link-footer-about"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-secondary-foreground/80 hover:text-primary transition-colors"
                  data-testid="link-footer-contact"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Contact Info</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span
                  className="text-secondary-foreground/80"
                  data-testid="text-footer-address"
                >
                  Plot 13, Trunk C, Mandela Estate, Port Harcourt
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <span
                  className="text-secondary-foreground/80"
                  data-testid="text-footer-phone"
                >
                  +234 704 992 9851
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <span
                  className="text-secondary-foreground/80"
                  data-testid="text-footer-email"
                >
                  LuxarnaHotel@gmail.com
                </span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Opening Hours</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="text-secondary-foreground/80">
                  <p className="font-medium">Reception</p>
                  <p>24 Hours</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="text-secondary-foreground/80">
                  <p className="font-medium">Spa</p>
                  <p>24 Hours</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="text-secondary-foreground/80">
                  <p className="font-medium">Restaurant</p>
                  <p>6:00 AM - 1:00 AM</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/10 mt-12 pt-8 text-center">
          <p
            className="text-sm text-secondary-foreground/60"
            data-testid="text-copyright"
          >
            &copy; {new Date().getFullYear()} Luxarna Hotel & Spa. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
