import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripe) stripe = new Stripe(key, { apiVersion: "2025-02-24.acacia" });
  return stripe;
}

export async function createRentPaymentIntent(opts: {
  amount: number;
  tenantId: string;
  propertyId: string;
  description: string;
}) {
  const client = getStripe();
  if (!client) {
    return { clientSecret: "mock_secret", paymentIntentId: "mock_pi" };
  }

  const intent = await client.paymentIntents.create({
    amount: Math.round(opts.amount * 100),
    currency: "usd",
    description: opts.description,
    metadata: {
      tenant_id: opts.tenantId,
      property_id: opts.propertyId,
    },
  });

  return {
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
  };
}

export function calculateLateFee(rentAmount: number, daysLate: number): number {
  const gracePeriod = 5;
  if (daysLate <= gracePeriod) return 0;
  return Math.min(rentAmount * 0.05, 150);
}
