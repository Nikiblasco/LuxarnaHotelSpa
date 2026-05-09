import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import promo1 from "@assets/2_1778335013789.jpeg";
import promo2 from "@assets/3_1778335019032.jpeg";

const slides = [
  { src: promo1, alt: "Luxarna Stay More Save More – Loyalty Programme" },
  { src: promo2, alt: "Luxarna Loyalty Card – Collect Stamps, Enjoy Rewards" },
];

export default function PromoPopup() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    const seen = sessionStorage.getItem("luxarna-loyalty-seen");
    if (!seen) {
      const show = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(show);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 4000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible]);

  function goTo(index: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrent(index);
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 4000);
  }

  function close() {
    setClosing(true);
    sessionStorage.setItem("luxarna-loyalty-seen", "1");
    setTimeout(() => setVisible(false), 350);
  }

  function handleSignUp() {
    close();
    navigate("/loyalty-signup");
  }

  if (!visible) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&display=swap');

        .lp-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.72);
          backdrop-filter: blur(5px);
          z-index: 9998;
          display: flex; align-items: center; justify-content: center;
          padding: 12px;
          animation: lpFadeIn 0.4s ease;
        }
        .lp-overlay.closing { animation: lpFadeOut 0.35s ease forwards; }

        /* Popup is a flex column — image shrinks to fit, footer stays fixed */
        .lp-popup {
          position: relative;
          background: #080808;
          border: 1px solid #c9a84c;
          border-radius: 18px;
          box-shadow: 0 0 70px rgba(201,168,76,0.2), 0 40px 100px rgba(0,0,0,0.8);
          max-width: 760px; width: 100%;
          max-height: 94vh;
          display: flex; flex-direction: column;
          overflow: hidden;
          animation: lpSlideUp 0.5s cubic-bezier(0.16,1,0.3,1);
        }
        /* Gold top bar */
        .lp-popup::before {
          content: ''; flex-shrink: 0;
          display: block; height: 3px;
          background: linear-gradient(90deg, transparent, #c9a84c, #f0d080, #c9a84c, transparent);
        }

        .lp-close {
          position: absolute; top: 10px; right: 10px;
          width: 30px; height: 30px; border-radius: 50%;
          background: rgba(201,168,76,0.12);
          border: 1px solid rgba(201,168,76,0.45);
          color: #c9a84c; font-size: 15px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, transform 0.25s;
          z-index: 10;
        }
        .lp-close:hover { background: rgba(201,168,76,0.28); transform: rotate(90deg); }

        /* Image area grows to fill space, image scales to fit fully */
        .lp-track { flex: 1; min-height: 0; overflow: hidden; }
        .lp-slides {
          display: flex; height: 100%;
          transition: transform 0.55s cubic-bezier(0.16,1,0.3,1);
        }
        .lp-slide {
          min-width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          background: #000;
        }
        .lp-slide img {
          max-width: 100%; max-height: 100%;
          width: auto; height: auto;
          display: block; object-fit: contain;
        }

        /* Fixed footer below image */
        .lp-bottom {
          flex-shrink: 0;
          background: #080808;
          padding: 10px 16px 12px;
          display: flex; flex-direction: column; align-items: center; gap: 8px;
        }

        /* Dots */
        .lp-dots { display: flex; justify-content: center; gap: 8px; }
        .lp-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: rgba(201,168,76,0.25);
          border: 1px solid #c9a84c;
          cursor: pointer;
          transition: background 0.3s, transform 0.3s;
        }
        .lp-dot.active { background: #c9a84c; transform: scale(1.35); }

        /* Sign-up button — responsive sizing */
        .lp-signup-btn {
          background: linear-gradient(135deg, #b8882e, #f0d080, #b8882e);
          color: #080808;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-weight: 700; font-size: 13px;
          letter-spacing: 2px; text-transform: uppercase;
          border: none;
          padding: 10px 28px; border-radius: 50px;
          cursor: pointer; white-space: nowrap;
          box-shadow: 0 6px 24px rgba(201,168,76,0.5);
          animation: lpPulse 2.8s ease-in-out infinite;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .lp-signup-btn:hover {
          transform: scale(1.06);
          box-shadow: 0 10px 36px rgba(201,168,76,0.7);
          animation: none;
        }

        .lp-tagline {
          color: rgba(201,168,76,0.5);
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-style: italic; font-size: 11px;
          letter-spacing: 0.8px; margin: 0; text-align: center;
        }

        /* Tablet */
        @media (max-width: 768px) {
          .lp-popup { max-width: 98vw; max-height: 92vh; border-radius: 14px; }
          .lp-signup-btn { font-size: 12px; padding: 9px 22px; letter-spacing: 1.5px; }
        }

        /* Mobile */
        @media (max-width: 480px) {
          .lp-overlay { padding: 8px; }
          .lp-popup { max-height: 90vh; border-radius: 12px; }
          .lp-bottom { padding: 8px 12px 10px; gap: 6px; }
          .lp-signup-btn { font-size: 11px; padding: 8px 18px; letter-spacing: 1px; }
          .lp-tagline { font-size: 10px; }
        }

        @keyframes lpFadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes lpFadeOut { to   { opacity:0 } }
        @keyframes lpSlideUp {
          from { opacity:0; transform: translateY(30px) scale(0.97); }
          to   { opacity:1; transform: translateY(0) scale(1); }
        }
        @keyframes lpPulse {
          0%,100% { box-shadow: 0 6px 24px rgba(201,168,76,0.5); }
          50%     { box-shadow: 0 8px 36px rgba(201,168,76,0.8); }
        }
      `}</style>

      <div
        className={`lp-overlay${closing ? " closing" : ""}`}
        onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      >
        <div className="lp-popup">
          <button className="lp-close" onClick={close} aria-label="Close" data-testid="button-loyalty-close">
            ✕
          </button>

          <div className="lp-track">
            <div className="lp-slides" style={{ transform: `translateX(-${current * 100}%)` }}>
              {slides.map((slide, i) => (
                <div className="lp-slide" key={i}>
                  <img src={slide.src} alt={slide.alt} data-testid={`img-loyalty-${i}`} />
                </div>
              ))}
            </div>
          </div>

          <div className="lp-bottom">
            <div className="lp-dots">
              {slides.map((_, i) => (
                <div
                  key={i}
                  className={`lp-dot${i === current ? " active" : ""}`}
                  onClick={() => goTo(i)}
                  data-testid={`button-loyalty-dot-${i}`}
                />
              ))}
            </div>
            <button className="lp-signup-btn" onClick={handleSignUp} data-testid="button-loyalty-signup">
              ✦ Join Loyalty Programme ✦
            </button>
            <p className="lp-tagline">It's free to join · Terms and Conditions Apply.</p>
          </div>
        </div>
      </div>
    </>
  );
}
