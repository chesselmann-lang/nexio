"use client";
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentSheetProps {
  receiverId: string;
  receiverName: string;
  conversationId?: string;
  onSuccess: () => void;
  onClose: () => void;
}

export default function PaymentSheet(props: PaymentSheetProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [step, setStep] = useState<"amount" | "pay">("amount");
  const [loading, setLoading] = useState(false);

  async function initiatePayment() {
    const cents = Math.round(parseFloat(amount.replace(",", ".")) * 100);
    if (!cents || cents < 100) return;
    setLoading(true);

    const res = await fetch("/api/payments/create-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiverId: props.receiverId,
        amountCents: cents,
        note,
        conversationId: props.conversationId,
      }),
    });

    const { clientSecret } = await res.json();
    setClientSecret(clientSecret);
    setStep("pay");
    setLoading(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={props.onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl pb-safe"
        style={{ background: "var(--surface)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
        </div>

        <div className="px-6 pb-8">
          <h2 className="text-lg font-bold mb-1" style={{ color: "var(--foreground)" }}>
            Geld senden
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--foreground-3)" }}>
            an {props.receiverName}
          </p>

          {step === "amount" ? (
            <>
              {/* Amount input */}
              <div
                className="rounded-2xl p-4 mb-4 text-center"
                style={{ background: "var(--background)" }}
              >
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-3xl font-bold" style={{ color: "var(--foreground-3)" }}>€</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    step="0.01"
                    min="1"
                    className="text-5xl font-bold bg-transparent text-center focus:outline-none w-40"
                    style={{ color: "var(--foreground)" }}
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2 mb-4">
                {["5", "10", "20", "50"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(v)}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold border"
                    style={{
                      background: amount === v ? "var(--nexio-green)" : "var(--surface-2)",
                      borderColor: amount === v ? "var(--nexio-green)" : "var(--border)",
                      color: amount === v ? "white" : "var(--foreground-2)",
                    }}
                  >
                    {v} €
                  </button>
                ))}
              </div>

              {/* Note */}
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Notiz (optional) — Miete, Essen, ..."
                className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none mb-4 border"
                style={{
                  background: "var(--surface-2)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              />

              <button
                onClick={initiatePayment}
                disabled={!amount || parseFloat(amount) < 1 || loading}
                className="w-full py-4 rounded-2xl font-bold text-white disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: "var(--nexio-green)" }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    {amount ? `${parseFloat(amount).toFixed(2)} € senden` : "Betrag eingeben"}
                  </>
                )}
              </button>
            </>
          ) : clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret, locale: "de" }}>
              <StripePayForm onSuccess={props.onSuccess} onBack={() => setStep("amount")} />
            </Elements>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StripePayForm({ onSuccess, onBack }: { onSuccess: () => void; onBack: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const { error } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      setError(error.message ?? "Zahlung fehlgeschlagen.");
      setLoading(false);
    } else {
      onSuccess();
    }
  }

  return (
    <div>
      <PaymentElement options={{ layout: "tabs" }} />
      {error && (
        <p className="text-red-500 text-sm mt-3 text-center">{error}</p>
      )}
      <div className="flex gap-3 mt-4">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-2xl text-sm font-semibold border"
          style={{ borderColor: "var(--border)", color: "var(--foreground-2)" }}
        >
          Zurück
        </button>
        <button
          onClick={handlePay}
          disabled={loading}
          className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-40 flex items-center justify-center"
          style={{ background: "var(--nexio-green)" }}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : "Jetzt bezahlen"}
        </button>
      </div>
    </div>
  );
}
