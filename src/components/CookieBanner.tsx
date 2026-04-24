"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const COOKIE_KEY = "nexio_cookie_notice";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(COOKIE_KEY)) setVisible(true);
    } catch {
      // localStorage not available (SSR / private mode)
    }
  }, []);

  function dismiss() {
    try { localStorage.setItem(COOKIE_KEY, "1"); } catch { /* ignore */ }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
    >
      <div
        className="max-w-lg mx-auto rounded-2xl p-4 shadow-xl flex flex-col gap-3"
        style={{ background: "var(--surface, #fff)", border: "1px solid var(--border, #e5e5e5)" }}
      >
        <p className="text-xs leading-relaxed" style={{ color: "var(--foreground-2, #555)" }}>
          Nexio verwendet ausschließlich technisch notwendige Cookies für die Sitzungsverwaltung.
          Es werden keine Tracking- oder Werbe-Cookies eingesetzt.{" "}
          <Link href="/datenschutz" className="underline" style={{ color: "var(--nexio-green, #07c160)" }}>
            Mehr erfahren
          </Link>
        </p>
        <button
          onClick={dismiss}
          className="self-end px-5 py-2 rounded-xl text-xs font-semibold text-white"
          style={{ background: "var(--nexio-green, #07c160)" }}
        >
          Verstanden
        </button>
      </div>
    </div>
  );
}
