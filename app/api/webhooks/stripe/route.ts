import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSMS } from "@/lib/twilio";

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ received: true, mock: true });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    const supabase = createAdminClient();

    await supabase.from("transactions").insert({
      property_id: intent.metadata.property_id,
      tenant_id: intent.metadata.tenant_id,
      type: "income",
      category: "rent",
      amount: intent.amount / 100,
      description: "Rent payment via Stripe",
      date: new Date().toISOString().split("T")[0],
    });

    // Confirmation SMS would go here if tenant phone is available
  }

  return NextResponse.json({ received: true });
}
