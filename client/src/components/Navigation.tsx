import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone } from "lucide-react";
import logoImage from "@assets/1764434830238_1764435323080.jpg";

const WHATSAPP_URL = "https://wa.me/2347049929851?text=Hello%20Luxarna%20Hotel!%20I%27d%20like%20to%20make%20a%20booking.%20Please%20help%20me.";

const navItems = [
  { name: "Home",       path: "/" },
  { name: "Rooms",      path: "/rooms" },
  { name: "Spa",        path: "/spa" },
  { name: "Restaurant", path: "/restaurant" },
  { name: "About",      path: "/about" },
  { name: "Contact",    path: "/contact" },
];

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();

  const openWhatsApp = () => window.open(WHATSAPP_URL, "_blank");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-3">
            <img src={logoImage} alt="Luxarna Hotel & Spa" className="h-10 md:h-12 w-auto rounded" data-testid="img-logo" />
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={location === item.path ? "secondary" : "ghost"}
                  size="sm"
                  className="text-sm font-medium transition-all duration-300"
                  data-testid={`link-nav-${item.name.toLowerCase()}`}
                >
                  {item.name}
                </Button>
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <a href="tel:+2347049929851">
              <Button variant="outline" size="sm" className="gap-2" data-testid="button-call">
                <Phone className="w-4 h-4" />
                <span className="hidden xl:inline">Call Us</span>
              </Button>
            </a>
            <Button size="sm" onClick={openWhatsApp} data-testid="button-book-now">
              Book Now
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsOpen(!isOpen)}
            data-testid="button-mobile-menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden bg-background border-t border-border animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={location === item.path ? "secondary" : "ghost"}
                  className="w-full justify-start text-base"
                  onClick={() => setIsOpen(false)}
                  data-testid={`link-mobile-nav-${item.name.toLowerCase()}`}
                >
                  {item.name}
                </Button>
              </Link>
            ))}
            <div className="pt-4 flex flex-col gap-2">
              <a href="tel:+2347049929851" className="w-full">
                <Button variant="outline" className="w-full gap-2" data-testid="button-mobile-call">
                  <Phone className="w-4 h-4" />
                  Call Us
                </Button>
              </a>
              <Button
                className="w-full"
                onClick={() => { setIsOpen(false); openWhatsApp(); }}
                data-testid="button-mobile-book"
              >
                Book Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
