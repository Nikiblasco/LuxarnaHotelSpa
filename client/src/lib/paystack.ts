export interface PaystackPaymentOptions {
  email: string;
  amount: number;
}

export async function handlePaystackPayment({ email, amount }: PaystackPaymentOptions): Promise<void> {
  const response = await fetch("/paystack/initialize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, amount }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to initialize payment");
  }

  const data = await response.json() as { authorization_url: string };

  if (!data.authorization_url) {
    throw new Error("No authorization URL returned from Paystack");
  }

  window.location.href = data.authorization_url;
}
