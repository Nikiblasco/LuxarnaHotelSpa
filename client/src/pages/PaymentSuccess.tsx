import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface VerifyResult {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  email: string;
}

async function saveBookingAfterPayment(data: VerifyResult): Promise<void> {
  // Retrieve pending booking details stored before redirecting to Paystack
  const raw = sessionStorage.getItem("pendingBooking");
  const pending = raw ? JSON.parse(raw) as { room?: string; guestName?: string } : null;

  const res = await fetch("/api/payment-bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name:      pending?.guestName ?? data.email,
      email:     data.email,
      room:      pending?.room ?? "Unknown",
      amount:    data.amount / 100,
      reference: data.reference,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to save booking");
  }

  sessionStorage.removeItem("pendingBooking");
}

type PageStatus = "loading" | "success" | "failed" | "no_reference";

export default function PaymentSuccess() {
  const [, navigate] = useLocation();
  const [status, setStatus]     = useState<PageStatus>("loading");
  const [result, setResult]     = useState<VerifyResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const params    = new URLSearchParams(window.location.search);
    const reference = params.get("reference") ?? params.get("trxref");

    if (!reference) {
      setStatus("no_reference");
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/paystack/verify/${encodeURIComponent(reference)}`);
        const data: VerifyResult = await res.json();

        if (!res.ok) throw new Error((data as any).error ?? "Verification failed");

        setResult(data);

        if (data.status === "success") {
          await saveBookingAfterPayment(data);
          setStatus("success");
        } else {
          setStatus("failed");
        }
      } catch (err: any) {
        setErrorMsg(err.message ?? "Something went wrong");
        setStatus("failed");
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-8 space-y-6">

            {status === "loading" && (
              <>
                <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin" />
                <h1 className="font-serif text-2xl font-bold text-foreground">
                  Verifying Payment…
                </h1>
                <p className="text-muted-foreground text-sm">
                  Please wait while we confirm your transaction.
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <CheckCircle
                  className="w-16 h-16 mx-auto text-green-500"
                  data-testid="icon-payment-success"
                />
                <h1
                  className="font-serif text-2xl font-bold text-foreground"
                  data-testid="text-payment-success"
                >
                  Payment Successful
                </h1>
                <p className="text-muted-foreground text-sm">
                  Thank you! Your booking at Luxarna Hotel &amp; Spa has been confirmed.
                </p>
                {result && (
                  <div className="bg-muted rounded-md px-4 py-3 text-sm text-left space-y-1">
                    <p><span className="font-medium">Reference:</span> {result.reference}</p>
                    <p><span className="font-medium">Email:</span> {result.email}</p>
                    <p>
                      <span className="font-medium">Amount paid:</span>{" "}
                      {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(result.amount / 100)}
                    </p>
                  </div>
                )}
                <Button className="w-full" onClick={() => navigate("/")}>
                  Back to Home
                </Button>
              </>
            )}

            {(status === "failed" || status === "no_reference") && (
              <>
                <XCircle
                  className="w-16 h-16 mx-auto text-destructive"
                  data-testid="icon-payment-failed"
                />
                <h1
                  className="font-serif text-2xl font-bold text-foreground"
                  data-testid="text-payment-failed"
                >
                  Payment Failed
                </h1>
                <p className="text-muted-foreground text-sm">
                  {status === "no_reference"
                    ? "No payment reference found. Please try booking again."
                    : errorMsg || "Your payment could not be verified. Please contact us if you were charged."}
                </p>
                <div className="flex flex-col gap-3">
                  <Button className="w-full" onClick={() => navigate("/rooms")}>
                    Try Again
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/contact")}>
                    Contact Support
                  </Button>
                </div>
              </>
            )}

          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
