"use client";
import { useEffect } from "react";

/**
 * Registers the Nexio Service Worker silently.
 * Mounted at root layout level so it fires on every page.
 */
export default function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("[Nexio PWA] SW registered:", reg.scope);

          // Check for SW updates every hour
          setInterval(() => reg.update(), 60 * 60 * 1000);
        })
        .catch((err) => {
          // Non-fatal — app still works without SW
          console.warn("[Nexio PWA] SW registration failed:", err);
        });
    });
  }, []);

  return null;
}
