"use client";
import { useEffect, useState } from "react";

const DISMISSED_KEY = "nexio_pwa_dismissed_until";

export default function PWAInstallBanner() {
  const [prompt, setPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed
    const until = localStorage.getItem(DISMISSED_KEY);
    if (until && Date.now() < Number(until)) return;

    // Check if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if ((navigator as any).standalone === true) return; // iOS Safari

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function install() {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
      setPrompt(null);
    }
  }

  function dismiss() {
    // Snooze for 7 days
    localStorage.setItem(DISMISSED_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 16px)" }}
    >
      <div
        className="rounded-3xl shadow-2xl flex items-center gap-3 px-4 py-4"
        style={{ background: "rgba(20,20,30,0.97)", backdropFilter: "blur(20px)" }}
      >
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-none text-2xl"
          style={{ background: "#07c160" }}
        >
          💬
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-tight">Nexio installieren</p>
          <p className="text-white/50 text-xs mt-0.5">
            Als App speichern — schneller, offline-fähig
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-none">
          <button
            onClick={dismiss}
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-white/50"
          >
            Später
          </button>
          <button
            onClick={install}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-white"
            style={{ background: "#07c160" }}
          >
            Installieren
          </button>
        </div>
      </div>
    </div>
  );
}
