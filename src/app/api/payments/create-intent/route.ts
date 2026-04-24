import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { sendPaymentReceipt } from "@/lib/resend";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { receiverId, amountCents, note, conversationId } = await req.json();

  if (amountCents < 100) {
    return NextResponse.json({ error: "Mindestbetrag: 1,00 €" }, { status: 400 });
  }

  // Get receiver info (users table only — no cross-schema join needed)
  const { data: receiver } = await supabase
    .from("users")
    .select("id, display_name")
    .eq("id", receiverId)
    .single();

  if (!receiver) return NextResponse.json({ error: "Empfänger nicht gefunden" }, { status: 404 });

  // Get or create Stripe customer for sender
  const { data: senderProfile } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  let customerId = (senderProfile as any)?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({ metadata: { supabase_user_id: user.id } });
    customerId = customer.id;
    await supabase.from("users").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  // Create Payment Intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "eur",
    customer: customerId,
    payment_method_types: ["sepa_debit", "card"],
    description: note ?? `Nexio Pay — ${new Date().toLocaleDateString("de-DE")}`,
    metadata: {
      sender_id: user.id,
      receiver_id: receiverId,
      conversation_id: conversationId ?? "",
      nexio_payment: "true",
    },
  });

  // Create payment record in DB
  const { data: payment } = await supabase
    .from("payments")
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      conversation_id: conversationId ?? null,
      amount_cents: amountCents,
      currency: "EUR",
      note,
      status: "processing",
      stripe_payment_intent_id: paymentIntent.id,
    })
    .select()
    .single();

  // If in a conversation, send a payment message
  if (conversationId) {
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      type: "payment",
      content: `payment:${payment?.id}:${amountCents}:EUR:${note ?? ""}`,
    });
  }

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    paymentId: payment?.id,
  });
}
