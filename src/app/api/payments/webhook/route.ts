import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendPaymentReceipt } from "@/lib/resend";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Service-role client for webhook (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const { sender_id, receiver_id, nexio_payment } = pi.metadata;
    if (nexio_payment !== "true") return NextResponse.json({ ok: true });

    // Update payment status
    await supabase
      .from("payments")
      .update({ status: "completed" })
      .eq("stripe_payment_intent_id", pi.id);

    // Get sender email for receipt
    const { data: senderAuth } = await supabase.auth.admin.getUserById(sender_id);
    const senderEmail = senderAuth.user?.email;

    // Get receiver name
    const { data: receiver } = await supabase
      .from("users")
      .select("display_name")
      .eq("id", receiver_id)
      .single();

    if (senderEmail && receiver) {
      await sendPaymentReceipt(senderEmail, pi.amount, pi.currency.toUpperCase(), receiver.display_name);
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object as Stripe.PaymentIntent;
    await supabase
      .from("payments")
      .update({ status: "failed" })
      .eq("stripe_payment_intent_id", pi.id);
  }

  return NextResponse.json({ ok: true });
}
