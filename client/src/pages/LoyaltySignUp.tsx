import { useState } from "react";
import { useLocation } from "wouter";

export default function LoyaltySignUp() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrMsg("");

    try {
      const res = await fetch("/api/loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrMsg(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
      } else {
        setStatus("success");
      }
    } catch {
      setErrMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=Cinzel:wght@400;600&display=swap');

        .ls-page {
          min-height: 100vh;
          background: #060606;
          display: flex; align-items: center; justify-content: center;
          padding: 40px 20px;
          position: relative; overflow: hidden;
        }
        .ls-page::before {
          content: '';
          position: absolute;
          width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .ls-page::after {
          content: '';
          position: absolute; inset: 24px;
          border: 1px solid rgba(201,168,76,0.08);
          border-radius: 4px;
          pointer-events: none;
        }

        .ls-card {
          position: relative;
          width: 100%; max-width: 520px;
          background: #0d0d0d;
          border: 1px solid rgba(201,168,76,0.35);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 0 80px rgba(201,168,76,0.1), 0 40px 120px rgba(0,0,0,0.9);
          animation: lsAppear 0.6s cubic-bezier(0.16,1,0.3,1);
        }
        .ls-card::before {
          content: '';
          display: block; height: 3px;
          background: linear-gradient(90deg, transparent, #c9a84c, #f0d080, #c9a84c, transparent);
        }

        .ls-inner { padding: 44px 48px 48px; }

        .ls-logo { text-align: center; margin-bottom: 32px; }
        .ls-logo-icon { font-size: 28px; color: #c9a84c; display: block; margin-bottom: 8px; letter-spacing: 6px; }
        .ls-logo-name { font-family: 'Cinzel', Georgia, serif; font-size: 24px; font-weight: 600; color: #c9a84c; letter-spacing: 6px; display: block; }
        .ls-logo-sub  { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 11px; letter-spacing: 4px; color: rgba(201,168,76,0.55); text-transform: uppercase; margin-top: 4px; display: block; }

        .ls-divider { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
        .ls-divider span { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(201,168,76,0.4)); }
        .ls-divider span:last-child { background: linear-gradient(90deg, rgba(201,168,76,0.4), transparent); }
        .ls-divider em { font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; color: rgba(201,168,76,0.6); font-size: 13px; letter-spacing: 1px; white-space: nowrap; }

        .ls-heading { font-family: 'Cinzel', Georgia, serif; font-size: 20px; font-weight: 400; color: #f5f0e8; text-align: center; letter-spacing: 2px; margin-bottom: 6px; }
        .ls-sub { font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: 15px; color: rgba(255,255,255,0.4); text-align: center; margin-bottom: 36px; }

        .ls-field { margin-bottom: 20px; }
        .ls-label { display: block; font-family: 'Cinzel', Georgia, serif; font-size: 10px; letter-spacing: 3px; color: rgba(201,168,76,0.7); text-transform: uppercase; margin-bottom: 8px; }
        .ls-input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(201,168,76,0.25);
          border-radius: 8px;
          padding: 14px 18px;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 16px; color: #f5f0e8;
          outline: none;
          transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
        }
        .ls-input::placeholder { color: rgba(255,255,255,0.2); }
        .ls-input:focus { border-color: rgba(201,168,76,0.7); background: rgba(201,168,76,0.04); box-shadow: 0 0 0 3px rgba(201,168,76,0.08); }

        .ls-btn {
          width: 100%; margin-top: 8px; padding: 16px;
          background: linear-gradient(135deg, #b8882e, #f0d080, #b8882e);
          background-size: 200% 100%;
          color: #080808;
          font-family: 'Cinzel', Georgia, serif;
          font-size: 13px; font-weight: 600;
          letter-spacing: 3px; text-transform: uppercase;
          border: none; border-radius: 8px;
          cursor: pointer;
          transition: background-position 0.4s, transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 6px 24px rgba(201,168,76,0.35);
        }
        .ls-btn:hover:not(:disabled) { background-position: right center; transform: translateY(-1px); box-shadow: 0 10px 32px rgba(201,168,76,0.55); }
        .ls-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .ls-error {
          margin-top: 14px; padding: 12px 16px;
          background: rgba(220,50,50,0.1);
          border: 1px solid rgba(220,50,50,0.3);
          border-radius: 8px;
          color: #e07070;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 15px; text-align: center;
        }

        .ls-success { text-align: center; padding: 20px 0 8px; animation: lsAppear 0.5s ease; }
        .ls-success-icon { font-size: 48px; color: #c9a84c; display: block; margin-bottom: 20px; }
        .ls-success-title { font-family: 'Cinzel', Georgia, serif; font-size: 20px; color: #c9a84c; letter-spacing: 2px; margin-bottom: 12px; }
        .ls-success-msg { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px; color: rgba(255,255,255,0.55); line-height: 1.6; margin-bottom: 32px; }
        .ls-back-btn {
          display: inline-block; padding: 13px 36px;
          border: 1px solid rgba(201,168,76,0.45);
          border-radius: 50px;
          color: #c9a84c; background: transparent;
          font-family: 'Cinzel', Georgia, serif;
          font-size: 11px; letter-spacing: 2px;
          cursor: pointer;
          transition: background 0.25s, border-color 0.25s;
        }
        .ls-back-btn:hover { background: rgba(201,168,76,0.1); border-color: rgba(201,168,76,0.7); }

        .ls-note { margin-top: 24px; font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: 12px; color: rgba(255,255,255,0.2); text-align: center; line-height: 1.6; }

        @keyframes lsAppear { from { opacity:0; transform: translateY(20px); } to { opacity:1; transform: translateY(0); } }

        @media (max-width: 560px) {
          .ls-inner { padding: 36px 28px 40px; }
          .ls-logo-name { font-size: 20px; }
        }
      `}</style>

      <div className="ls-page">
        <div className="ls-card">
          <div className="ls-inner">

            <div className="ls-logo">
              <span className="ls-logo-icon">✦ ✦ ✦</span>
              <span className="ls-logo-name">LUXARNA</span>
              <span className="ls-logo-sub">Hotel &amp; Spa</span>
            </div>

            {status === "success" ? (
              <div className="ls-success">
                <span className="ls-success-icon">✦</span>
                <h2 className="ls-success-title">Welcome to the Programme</h2>
                <p className="ls-success-msg">
                  Thank you for joining the Luxarna Loyalty Programme.<br />
                  Every stay brings you closer to something special.
                </p>
                <button className="ls-back-btn" onClick={() => navigate("/")} data-testid="button-loyalty-home">
                  Return Home
                </button>
              </div>
            ) : (
              <>
                <div className="ls-divider">
                  <span /><em>Loyalty Programme</em><span />
                </div>

                <h1 className="ls-heading">Join &amp; Start Earning</h1>
                <p className="ls-sub">It's free · Stay 4 nights, save on your 5th</p>

                <form onSubmit={handleSubmit} noValidate>
                  <div className="ls-field">
                    <label className="ls-label" htmlFor="ls-name">Full Name</label>
                    <input
                      id="ls-name" className="ls-input"
                      type="text" name="name"
                      placeholder="Your full name"
                      value={form.name} onChange={handleChange}
                      required autoComplete="name"
                      data-testid="input-loyalty-name"
                    />
                  </div>

                  <div className="ls-field">
                    <label className="ls-label" htmlFor="ls-phone">Phone Number</label>
                    <input
                      id="ls-phone" className="ls-input"
                      type="tel" name="phone"
                      placeholder="+234 000 000 0000"
                      value={form.phone} onChange={handleChange}
                      required autoComplete="tel"
                      data-testid="input-loyalty-phone"
                    />
                  </div>

                  <div className="ls-field">
                    <label className="ls-label" htmlFor="ls-email">Email Address</label>
                    <input
                      id="ls-email" className="ls-input"
                      type="email" name="email"
                      placeholder="your@email.com"
                      value={form.email} onChange={handleChange}
                      required autoComplete="email"
                      data-testid="input-loyalty-email"
                    />
                  </div>

                  <button
                    type="submit" className="ls-btn"
                    disabled={status === "loading"}
                    data-testid="button-loyalty-submit"
                  >
                    {status === "loading" ? "Enrolling…" : "Join the Programme"}
                  </button>

                  {status === "error" && (
                    <div className="ls-error" data-testid="text-loyalty-error">{errMsg}</div>
                  )}
                </form>

                <p className="ls-note">
                  Your information is kept private and will never be shared.<br />
                  By joining you agree to our Terms &amp; Conditions.
                </p>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
