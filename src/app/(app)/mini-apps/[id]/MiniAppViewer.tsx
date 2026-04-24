"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const APP_ICONS: Record<string, string> = {
  "Bürgeramt-Termin": "🏛", "eRezept Scanner": "💊", "DB Verbindungen": "🚂",
  "Elster Lite": "📋", "Wetter & Klima": "🌤", "Splittr": "💸",
  "Mini-Umfrage": "📊", "Essen bestellen": "🍔",
};

// ── Nexio API Bridge ──────────────────────────────────────────────────────────
// Mini-apps communicate via postMessage:
// { type: "nexio_api", method: "getUserProfile" | "getToken" | "close" | "share", payload: {} }
// Nexio responds: { type: "nexio_response", method, data }

export default function MiniAppViewer({ program, userId }: { program: any; userId?: string }) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const supabase = createClient();

  // Listen for postMessage from mini-app iframe
  useEffect(() => {
    async function handleMessage(event: MessageEvent) {
      if (!event.data || event.data.type !== "nexio_api") return;
      const { method, payload, requestId } = event.data;

      let responseData: any = null;

      switch (method) {
        case "getUserProfile": {
          if (!userId) { responseData = { error: "Not authenticated" }; break; }
          const { data } = await supabase.from("users").select("id, display_name, username, avatar_url, account_tier").eq("id", userId).single();
          responseData = data;
          break;
        }
        case "getToken": {
          const { data: { session } } = await supabase.auth.getSession();
          responseData = { token: session?.access_token ?? null };
          break;
        }
        case "close": {
          router.back();
          return;
        }
        case "share": {
          if (navigator.share && payload?.text) {
            navigator.share({ title: payload.title ?? "Nexio", text: payload.text, url: payload.url }).catch(() => {});
          }
          responseData = { ok: true };
          break;
        }
        default:
          responseData = { error: `Unknown method: ${method}` };
      }

      iframeRef.current?.contentWindow?.postMessage({
        type: "nexio_response",
        method,
        requestId,
        data: responseData,
      }, "*");
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [userId]);

  // Built-in mini-apps get their content from our routes
  // External URLs load in the sandbox
  const isBuiltin = program.url.startsWith("/mini-apps/");
  const iframeSrc = isBuiltin
    ? `${program.url}/app` // Built-in mini-apps served at /mini-apps/[slug]/app
    : program.url;

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="flex-none flex items-center gap-3 px-4 border-b"
        style={{ height: "var(--header-height)", background: "var(--surface)", borderColor: "var(--border)" }}>
        <button onClick={() => router.back()} style={{ color: "var(--foreground-2)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-xl">{APP_ICONS[program.name] ?? "🔧"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{program.name}</p>
            {program.is_verified && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full text-white font-bold" style={{ background: "#1677ff" }}>✓</span>
            )}
          </div>
          <p className="text-xs truncate" style={{ color: "var(--foreground-3)" }}>{program.developer}</p>
        </div>
        {/* Reload */}
        <button onClick={() => { setLoading(true); setError(false); iframeRef.current?.contentWindow?.location.reload(); }}
          className="w-8 h-8 flex items-center justify-center"
          style={{ color: "var(--foreground-3)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
      </div>

      {/* Sandbox notice */}
      <div className="flex items-center gap-2 px-4 py-2 border-b"
        style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ color: "#07c160", flexShrink: 0 }}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span className="text-[10px]" style={{ color: "var(--foreground-3)" }}>
          Diese App läuft in einer gesicherten Sandbox · Kein Datenzugriff ohne Erlaubnis
        </span>
      </div>

      {/* iframe */}
      <div className="flex-1 relative">
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: "var(--background)" }}>
            <div className="flex flex-col items-center gap-3">
              <div className="text-4xl">{APP_ICONS[program.name] ?? "🔧"}</div>
              <div className="w-6 h-6 rounded-full border-2 animate-spin"
                style={{ borderColor: "var(--nexio-green)", borderTopColor: "transparent" }} />
              <p className="text-sm" style={{ color: "var(--foreground-3)" }}>Lade {program.name}…</p>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
            <div className="text-4xl">😵</div>
            <p className="font-semibold" style={{ color: "var(--foreground)" }}>Mini-Programm nicht verfügbar</p>
            <p className="text-sm" style={{ color: "var(--foreground-3)" }}>
              {program.name} konnte nicht geladen werden. Bitte versuche es später erneut.
            </p>
            <button onClick={() => router.back()}
              className="px-6 py-2 rounded-2xl text-sm font-semibold text-white"
              style={{ background: "var(--nexio-green)" }}>
              Zurück
            </button>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
          onLoad={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
          style={{ display: error ? "none" : "block" }}
          title={program.name}
        />
      </div>
    </div>
  );
}
