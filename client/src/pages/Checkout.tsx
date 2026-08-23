import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Room } from "@shared/schema";
import { CalendarDays, BedDouble, CheckCircle2, XCircle } from "lucide-react";

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);

type CheckoutStatus = "idle" | "loading" | "verifying" | "success" | "error";

const STORAGE_KEY = "luxarna_last_booking";

export default function Checkout() {
  const [, navigate] = useLocation();

  const params = new URLSearchParams(window.location.search);
  const roomId = params.get("roomId") ?? "";
  const checkIn = params.get("checkIn") ?? "";
  const checkOut = params.get("checkOut") ?? "";

  const [guestName, setGuestName] = useState(params.get("name") ?? "");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<CheckoutStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState<null | {
    roomName: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    guestName: string;
    email: string;
  }>(null);
  const statusRef = useRef<CheckoutStatus>("idle");
  const paystackReady = useRef(false);

  const updateStatus = (s: CheckoutStatus) => {
    statusRef.current = s;
    setStatus(s);
  };

  const { data: rooms } = useQuery<Room[]>({ queryKey: ["/api/rooms"] });
  const room = rooms?.find((r) => r.id === roomId);

  const nights =
    checkIn && checkOut
      ? Math.round(
          (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  const totalNGN = (room?.price ?? 0) * nights;

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  useEffect(() => {
    if (!roomId || !checkIn || !checkOut) navigate("/rooms");
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (
          parsed.roomId === roomId &&
          parsed.checkIn === checkIn &&
          parsed.checkOut === checkOut
        ) {
          setConfirmedBooking(parsed);
          updateStatus("success");
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    const existing = document.querySelector(
      'script[src="https://js.paystack.co/v1/inline.js"]'
    );
    if (existing) {
      paystackReady.current = true;
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => {
      paystackReady.current = true;
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePay = () => {
    if (!guestName.trim() || !email.trim()) {
      setErrorMsg("Please enter your name and email.");
      return;
    }
    if (!email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (!paystackReady.current) {
      setErrorMsg("Payment is still loading, please try again in a second.");
      return;
    }
    setErrorMsg("");
    updateStatus("loading");

    const handler = (window as any).PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email: email.trim(),
      amount: totalNGN * 100,
      currency: "NGN",
      ref: `luxarna_${Date.now()}`,
      metadata: {
        custom_fields: [
          { display_name: "Guest Name", value: guestName.trim() },
          { display_name: "Room", value: room?.name ?? roomId },
          { display_name: "Check-in", value: fmtDate(checkIn) },
          { display_name: "Check-out", value: fmtDate(checkOut) },
        ],
      },
      callback: async (response: { reference: string }) => { 
       console.log("✅ callback fired:", response.reference);
  updateStatus("verifying");
        try {
          const res = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reference: response.reference,
              guestName: guestName.trim(),
              roomId,
              checkIn,
              checkOut,
            }),
          });
          console.log("📡 verify status:", res.status);
          const data = await res.json();
          console.log("📦 verify data:", data);
          if (data.success) {
            const bookingRecord = {
              roomId,
              roomName: room?.name ?? roomId,
              checkIn,
              checkOut,
              nights,
              guestName: guestName.trim(),
              email: email.trim(),
            };
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(bookingRecord));
            setConfirmedBooking(bookingRecord);
            updateStatus("success");
            window.history.replaceState(null, "", "/rooms");
          } else {
            updateStatus("error");
            setErrorMsg(data.error ?? "Payment could not be verified.");
          }
        } catch (err) {
          console.error("❌ verify error:", err);
          updateStatus("error");
          setErrorMsg("Network error. Please contact us directly.");
        }
      },
      onClose: () => {
        console.log("🚪 onClose fired, status:", statusRef.current);
        if (statusRef.current === "loading") updateStatus("idle");
      },
    });

    handler.openIframe();
  };

  if (status === "success" && confirmedBooking) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-lg mx-auto px-4 pt-32 pb-16 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="font-serif text-3xl font-bold mb-3">
            Booking Confirmed!
          </h1>
          <p className="text-muted-foreground mb-2">
            Thank you, <strong>{confirmedBooking.guestName}</strong>. Your stay
            at Luxarna is booked.
          </p>
          <p className="text-muted-foreground mb-6">
            {confirmedBooking.roomName} · {fmtDate(confirmedBooking.checkIn)} →{" "}
            {fmtDate(confirmedBooking.checkOut)} · {confirmedBooking.nights}{" "}
            night{confirmedBooking.nights > 1 ? "s" : ""}
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            For any questions, call us on{" "}
            <a href="tel:+2347049929851" className="text-primary">
              +234 704 992 9851
            </a>
            .
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => {
                sessionStorage.removeItem(STORAGE_KEY);
                navigate("/rooms");
              }}
            >
              Book Another Room
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                sessionStorage.removeItem(STORAGE_KEY);
                navigate("/");
              }}
            >
              Back to Home
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <section className="pt-28 pb-16">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="font-serif text-3xl font-bold mb-2">
            Complete Your Booking
          </h1>
          <p className="text-muted-foreground mb-8">
            Review your stay details and pay securely with Paystack.
          </p>

          <Card className="p-5 mb-6 space-y-3">
            <div className="flex items-center gap-3">
              <BedDouble className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="font-semibold">{room?.name ?? "Loading…"}</p>
                <p className="text-sm text-muted-foreground">
                  {formatPrice(room?.price ?? 0)} / night
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-primary shrink-0" />
              <p className="text-sm">
                {fmtDate(checkIn)} → {fmtDate(checkOut)} &nbsp;·&nbsp;{" "}
                <strong>
                  {nights} night{nights > 1 ? "s" : ""}
                </strong>
              </p>
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Total</span>
              <span className="font-bold text-lg text-primary">
                {formatPrice(totalNGN)}
              </span>
            </div>
          </Card>

          <Card className="p-5 mb-6 space-y-4">
            <h2 className="font-semibold">Your Details</h2>
            <div className="space-y-2">
              <Label htmlFor="guestName">Full Name</Label>
              <Input
                id="guestName"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Ada Okafor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ada@example.com"
              />
            </div>
          </Card>

          {errorMsg && (
            <div className="flex items-center gap-2 text-destructive text-sm mb-4">
              <XCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            disabled={status === "loading" || status === "verifying"}
            onClick={handlePay}
          >
            {status === "loading"
              ? "Opening payment…"
              : status === "verifying"
              ? "Confirming booking…"
              : `Pay ${formatPrice(totalNGN)} with Paystack`}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-3">
            🔒 Secured by Paystack · Cards, bank transfer, USSD accepted
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
}