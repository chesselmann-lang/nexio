import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { recipientId, amountCents, note } = await req.json();
  if (!recipientId || !amountCents || amountCents <= 0) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey || stripeKey === "sk_test_...") {
    // Demo mode — Stripe not configured, just record the tx
    return NextResponse.json({ disabled: true, message: "Stripe not configured" });
  }

  // Stripe is configured — create a Checkout Session
  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(stripeKey, { apiVersion: "2025-03-31.basil" });

  // Look up recipient display name for description
  const { data: recipient } = await supabase
    .from("users")
    .select("display_name, username")
    .eq("id", recipientId)
    .single();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "eur",
        unit_amount: amountCents,
        product_data: {
          name: `Nexio Pay → @${recipient?.username ?? recipientId.slice(0, 8)}`,
          description: note ?? "Nexio P2P Zahlung",
        },
      },
    }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://nexio-jet.vercel.app"}/pay?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://nexio-jet.vercel.app"}/pay?cancelled=1`,
    metadata: {
      sender_id: user.id,
      recipient_id: recipientId,
      amount_cents: String(amountCents),
      note: note ?? "",
    },
  });

  // Record pending transaction
  await supabase.from("pay_transactions").insert({
    sender_id: user.id,
    recipient_id: recipientId,
    amount_cents: amountCents,
    note,
    status: "pending",
    stripe_session_id: session.id,
  });

  return NextResponse.json({ checkoutUrl: session.url });
}
