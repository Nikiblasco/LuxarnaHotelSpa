import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import promo1 from "@assets/2_1778335013789.jpeg";
import promo2 from "@assets/3_1778335019032.jpeg";

const SLIDES = [
  { src: promo1, alt: "Luxarna Hotel – Stay More, Save More loyalty promotion" },
  { src: promo2, alt: "Luxarna Hotel – Loyalty Card: collect stamps and enjoy rewards" },
];

export default function PromoPopup() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const seen = sessionStorage.getItem("luxarna-promo-seen");
    if (!seen) {
      const t = setTimeout(() => setOpen(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const goTo = useCallback((index: number) => {
    setCurrent(index);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [open]);

  const close = useCallback(() => {
    setClosing(true);
    sessionStorage.setItem("luxarna-promo-seen", "1");
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 350);
  }, []);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-[9998] flex items-center justify-center p-4 ${closing ? "animate-fade-out" : "animate-fade-in"}`}
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div
        className={`relative z-[9999] w-full overflow-hidden ${closing ? "animate-slide-out" : "animate-slide-up"}`}
        style={{
          maxWidth: 860,
          background: "#0a0a0a",
          border: "1px solid #c9a84c",
          borderRadius: 16,
          boxShadow: "0 0 60px rgba(201,168,76,0.25), 0 30px 80px rgba(0,0,0,0.7)",
        }}
      >
        {/* Gold top bar */}
        <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #c9a84c, #f0d080, #c9a84c, transparent)" }} />

        {/* Close button */}
        <button
          onClick={close}
          aria-label="Close promotion"
          data-testid="button-promo-close"
          className="absolute top-3 right-3 z-10 flex items-center justify-center rounded-full transition-transform hover:rotate-90"
          style={{
            width: 32, height: 32,
            background: "rgba(201,168,76,0.15)",
            border: "1px solid rgba(201,168,76,0.5)",
            color: "#c9a84c",
            fontSize: 18,
            cursor: "pointer",
          }}
        >
          &#x2715;
        </button>

        {/* Slides */}
        <div style={{ overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              transform: `translateX(-${current * 100}%)`,
              transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {SLIDES.map((slide, i) => (
              <div key={i} className="relative" style={{ minWidth: "100%" }}>
                <img
                  src={slide.src}
                  alt={slide.alt}
                  data-testid={`img-promo-${i}`}
                  style={{ width: "100%", display: "block", maxHeight: 520, objectFit: "cover", objectPosition: "top center" }}
                />
                {/* Book Now button */}
                <Link href="/rooms" onClick={close}>
                  <span
                    data-testid={`button-promo-book-${i}`}
                    style={{
                      position: "absolute",
                      bottom: 70,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "linear-gradient(135deg, #c9a84c, #f0d080, #c9a84c)",
                      color: "#0a0a0a",
                      fontFamily: "'Georgia', serif",
                      fontWeight: 700,
                      fontSize: 15,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      textDecoration: "none",
                      padding: "14px 36px",
                      borderRadius: 50,
                      whiteSpace: "nowrap",
                      boxShadow: "0 8px 30px rgba(201,168,76,0.45), 0 2px 8px rgba(0,0,0,0.4)",
                      display: "inline-block",
                      cursor: "pointer",
                      animation: "luxarna-pulse 2.5s ease-in-out infinite",
                    }}
                    className="promo-book-btn"
                  >
                    &#10022; Book Now &#10022;
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Dot navigation */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "16px 0 20px", background: "#0a0a0a" }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              data-testid={`button-promo-dot-${i}`}
              onClick={() => goTo(i)}
              style={{
                width: 8, height: 8, borderRadius: "50%",
                background: i === current ? "#c9a84c" : "rgba(201,168,76,0.3)",
                border: "1px solid #c9a84c",
                cursor: "pointer",
                transform: i === current ? "scale(1.3)" : "scale(1)",
                transition: "background 0.3s, transform 0.3s",
                padding: 0,
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Tagline */}
        <p style={{
          textAlign: "center",
          color: "rgba(201,168,76,0.6)",
          fontFamily: "'Georgia', serif",
          fontStyle: "italic",
          fontSize: 12,
          letterSpacing: 1,
          paddingBottom: 14,
          background: "#0a0a0a",
          margin: 0,
        }}>
          Experience Elevated &nbsp;·&nbsp; Terms and Conditions Apply.
        </p>
      </div>

      <style>{`
        @keyframes luxarna-pulse {
          0%, 100% { box-shadow: 0 8px 30px rgba(201,168,76,0.45), 0 2px 8px rgba(0,0,0,0.4); }
          50%       { box-shadow: 0 8px 40px rgba(201,168,76,0.75), 0 2px 8px rgba(0,0,0,0.4); }
        }
        .promo-book-btn:hover {
          transform: translateX(-50%) scale(1.06) !important;
          box-shadow: 0 12px 40px rgba(201,168,76,0.65), 0 4px 12px rgba(0,0,0,0.4) !important;
          animation: none !important;
        }
        .animate-fade-in  { animation: lp-fadeIn 0.4s ease; }
        .animate-fade-out { animation: lp-fadeOut 0.35s ease forwards; }
        .animate-slide-up  { animation: lp-slideUp 0.5s cubic-bezier(0.16,1,0.3,1); }
        .animate-slide-out { animation: lp-slideOut 0.35s ease forwards; }
        @keyframes lp-fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes lp-fadeOut { to { opacity: 0; pointer-events: none; } }
        @keyframes lp-slideUp  { from { opacity:0; transform: translateY(40px) scale(0.97); } to { opacity:1; transform: translateY(0) scale(1); } }
        @keyframes lp-slideOut { to { opacity:0; transform: translateY(20px) scale(0.97); } }
      `}</style>
    </div>
  );
}
