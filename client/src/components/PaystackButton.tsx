import { useState } from "react";
import { Button } from "@/components/ui/button";
import { handlePaystackPayment } from "@/lib/paystack";
import { useToast } from "@/hooks/use-toast";

interface PaystackButtonProps {
  email: string;
  amount: number;
  disabled?: boolean;
}

export default function PaystackButton({ email, amount, disabled }: PaystackButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!email || !amount) {
      toast({ title: "Missing details", description: "Email and amount are required.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await handlePaystackPayment({ email, amount });
    } catch (err: any) {
      toast({ title: "Payment failed", description: err.message ?? "Something went wrong.", variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || loading}
      data-testid="button-pay-naira"
    >
      {loading ? "Redirecting..." : "Pay in Naira"}
    </Button>
  );
}
