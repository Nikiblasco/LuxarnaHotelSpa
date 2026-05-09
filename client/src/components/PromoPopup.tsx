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
          padding: 16px;
          animation: lpFadeIn 0.4s ease;
        }
        .lp-overlay.closing { animation: lpFadeOut 0.35s ease forwards; }

        .lp-popup {
          position: relative;
          background: #080808;
          border: 1px solid #c9a84c;
          border-radius: 18px;
          box-shadow: 0 0 70px rgba(201,168,76,0.2), 0 40px 100px rgba(0,0,0,0.8);
          max-width: 820px; width: 100%;
          max-height: 92vh;
          overflow-y: auto;
          overflow-x: hidden;
          animation: lpSlideUp 0.5s cubic-bezier(0.16,1,0.3,1);
        }
        .lp-popup::-webkit-scrollbar { width: 4px; }
        .lp-popup::-webkit-scrollbar-track { background: #0a0a0a; }
        .lp-popup::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.4); border-radius: 2px; }
        .lp-popup::before {
          content: '';
          position: sticky; top: 0; z-index: 2;
          display: block; height: 3px;
          background: linear-gradient(90deg, transparent, #c9a84c, #f0d080, #c9a84c, transparent);
        }

        .lp-close {
          position: absolute; top: 14px; right: 14px;
          width: 34px; height: 34px; border-radius: 50%;
          background: rgba(201,168,76,0.12);
          border: 1px solid rgba(201,168,76,0.45);
          color: #c9a84c; font-size: 17px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, transform 0.25s;
          z-index: 10;
        }
        .lp-close:hover { background: rgba(201,168,76,0.28); transform: rotate(90deg); }

        .lp-track { overflow: hidden; }
        .lp-slides { display: flex; transition: transform 0.55s cubic-bezier(0.16,1,0.3,1); }
        .lp-slide { min-width: 100%; position: relative; }
        .lp-slide img {
          width: 100%; display: block;
          height: auto;
        }

        .lp-signup-btn {
          display: block;
          margin: 0 auto 4px;
          background: linear-gradient(135deg, #b8882e, #f0d080, #b8882e);
          color: #080808;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-weight: 700; font-size: 15px;
          letter-spacing: 2.5px; text-transform: uppercase;
          border: none;
          padding: 13px 40px; border-radius: 50px;
          cursor: pointer; white-space: nowrap;
          box-shadow: 0 8px 32px rgba(201,168,76,0.5), 0 2px 8px rgba(0,0,0,0.5);
          animation: lpPulse 2.8s ease-in-out infinite;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .lp-signup-btn:hover {
          transform: scale(1.07);
          box-shadow: 0 12px 44px rgba(201,168,76,0.7), 0 4px 12px rgba(0,0,0,0.5);
          animation: none;
        }

        .lp-dots {
          display: flex; justify-content: center;
          gap: 8px; padding: 16px 0 12px;
          background: #080808;
        }
        .lp-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: rgba(201,168,76,0.25);
          border: 1px solid #c9a84c;
          cursor: pointer;
          transition: background 0.3s, transform 0.3s;
        }
        .lp-dot.active { background: #c9a84c; transform: scale(1.35); }

        .lp-footer {
          text-align: center;
          color: rgba(201,168,76,0.5);
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-style: italic; font-size: 12px;
          letter-spacing: 1px;
          padding: 0 0 16px;
          background: #080808;
          margin: 0;
        }

        @keyframes lpFadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes lpFadeOut { to   { opacity:0 } }
        @keyframes lpSlideUp {
          from { opacity:0; transform: translateY(40px) scale(0.97); }
          to   { opacity:1; transform: translateY(0) scale(1); }
        }
        @keyframes lpPulse {
          0%,100% { box-shadow: 0 8px 32px rgba(201,168,76,0.5), 0 2px 8px rgba(0,0,0,0.5); }
          50%     { box-shadow: 0 10px 44px rgba(201,168,76,0.8), 0 2px 8px rgba(0,0,0,0.5); }
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

          <div style={{ background: "#080808", padding: "12px 24px 4px" }}>
            <button className="lp-signup-btn" onClick={handleSignUp} data-testid="button-loyalty-signup">
              ✦ Join Loyalty Programme ✦
            </button>
          </div>

          <p className="lp-footer">It's free to join · Terms and Conditions Apply.</p>
        </div>
      </div>
    </>
  );
}
