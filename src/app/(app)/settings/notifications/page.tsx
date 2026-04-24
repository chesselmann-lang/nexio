"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface NotifPrefs {
  messages: boolean;
  groups: boolean;
  mentions: boolean;
  stories: boolean;
  channels: boolean;
  sounds: boolean;
  vibrate: boolean;
  preview: boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  messages: true,
  groups: true,
  mentions: true,
  stories: false,
  channels: false,
  sounds: true,
  vibrate: true,
  preview: true,
};

export default function NotificationsPage() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [permState, setPermState] = useState<NotificationPermission>("default");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("nexio-notif-prefs");
    if (stored) {
      try { setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(stored) }); } catch (_) {}
    }
    if ("Notification" in window) setPermState(Notification.permission);
  }, []);

  function toggle(key: keyof NotifPrefs) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  async function requestPermission() {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setPermState(perm);
  }

  function save() {
    localStorage.setItem("nexio-notif-prefs", JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const groups: { title: string; items: { key: keyof NotifPrefs; label: string; desc: string }[] }[] = [
    {
      title: "Benachrichtigungen erhalten für",
      items: [
        { key: "messages", label: "Direktnachrichten", desc: "Neue Nachrichten von Kontakten" },
        { key: "groups", label: "Gruppen", desc: "Nachrichten in Gruppenunterhaltungen" },
        { key: "mentions", label: "Erwähnungen", desc: "Wenn jemand @du schreibt" },
        { key: "stories", label: "Momente", desc: "Neue Stories von Kontakten" },
        { key: "channels", label: "Kanäle", desc: "Neue Posts in abonnierten Kanälen" },
      ],
    },
    {
      title: "Ton & Haptik",
      items: [
        { key: "sounds", label: "Töne", desc: "Benachrichtigungston abspielen" },
        { key: "vibrate", label: "Vibration", desc: "Vibration bei Benachrichtigungen" },
      ],
    },
    {
      title: "Sonstiges",
      items: [
        { key: "preview", label: "Nachrichtenvorschau", desc: "Nachrichteninhalt im Banner anzeigen" },
      ],
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <header className="sticky top-0 z-10 px-4 py-3 border-b flex items-center gap-3"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <button onClick={() => router.back()} style={{ color: "var(--foreground-3)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-base font-semibold flex-1" style={{ color: "var(--foreground)" }}>Benachrichtigungen</h1>
        <button onClick={save}
          className="text-sm font-semibold px-4 py-1.5 rounded-full text-white"
          style={{ background: saved ? "#22c55e" : "var(--nexio-green)" }}>
          {saved ? "✅ Gespeichert" : "Speichern"}
        </button>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Browser permission banner */}
        {permState !== "granted" && (
          <div className="rounded-2xl p-4 flex items-start gap-3"
            style={{ background: permState === "denied" ? "rgba(239,68,68,0.1)" : "rgba(7,193,96,0.1)" }}>
            <span className="text-xl mt-0.5">{permState === "denied" ? "🚫" : "🔔"}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                {permState === "denied"
                  ? "Benachrichtigungen blockiert"
                  : "Browser-Benachrichtigungen aktivieren"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--foreground-2)" }}>
                {permState === "denied"
                  ? "Bitte aktiviere Benachrichtigungen in den Browser-Einstellungen."
                  : "Erhalte Benachrichtigungen auch wenn Nexio im Hintergrund läuft."}
              </p>
              {permState !== "denied" && (
                <button onClick={requestPermission}
                  className="mt-2 text-xs font-semibold px-3 py-1 rounded-full text-white"
                  style={{ background: "var(--nexio-green)" }}>
                  Jetzt aktivieren
                </button>
              )}
            </div>
          </div>
        )}

        {groups.map((group) => (
          <div key={group.title}>
            <p className="text-xs font-semibold uppercase mb-2 px-1" style={{ color: "var(--foreground-3)" }}>
              {group.title}
            </p>
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)" }}>
              {group.items.map((item, i) => (
                <div key={item.key} className="flex items-center gap-3 px-4 py-3.5"
                  style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{item.label}</p>
                    <p className="text-xs" style={{ color: "var(--foreground-3)" }}>{item.desc}</p>
                  </div>
                  <button onClick={() => toggle(item.key)}
                    className="w-12 h-6 rounded-full transition-colors flex-none relative"
                    style={{ background: prefs[item.key] ? "var(--nexio-green)" : "var(--border)" }}>
                    <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                      style={{ transform: prefs[item.key] ? "translateX(26px)" : "translateX(2px)" }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
