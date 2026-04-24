"use client";
import QRCode from "./QRCode";

interface QRModalProps {
  userId: string;
  displayName: string;
  username: string;
  onClose: () => void;
}

export default function QRModal({ userId, displayName, username, onClose }: QRModalProps) {
  const deepLink = `https://nexio.app/add/${username}`;

  async function share() {
    if (navigator.share) {
      await navigator.share({
        title: "Nexio — Füge mich hinzu",
        text: `Schreib mir auf Nexio: @${username}`,
        url: deepLink,
      });
    } else {
      await navigator.clipboard.writeText(deepLink);
      alert("Link kopiert!");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl pb-safe"
        style={{ background: "var(--surface)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
        </div>

        <div className="px-6 pb-8">
          <h2 className="text-lg font-bold text-center mb-1" style={{ color: "var(--foreground)" }}>
            Mein Nexio-Code
          </h2>
          <p className="text-sm text-center mb-6" style={{ color: "var(--foreground-3)" }}>
            Lass andere diesen Code scannen, um dir zu schreiben
          </p>

          {/* QR Card */}
          <div
            className="rounded-2xl p-6 flex flex-col items-center gap-4"
            style={{ background: "var(--background)" }}
          >
            {/* Avatar placeholder */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md"
              style={{ background: "var(--nexio-green)" }}
            >
              {displayName.slice(0, 1).toUpperCase()}
            </div>

            <div className="text-center">
              <p className="font-semibold" style={{ color: "var(--foreground)" }}>{displayName}</p>
              <p className="text-sm" style={{ color: "var(--foreground-3)" }}>@{username}</p>
            </div>

            {/* QR Code */}
            <div className="p-3 rounded-2xl bg-white shadow-sm">
              <QRCode value={deepLink} size={180} color="#07c160" />
            </div>

            <p className="text-xs text-center" style={{ color: "var(--foreground-3)" }}>
              nexio.app/add/{username}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={share}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: "var(--nexio-green)", color: "white" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Teilen
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold"
              style={{ background: "var(--surface-2)", color: "var(--foreground-2)" }}
            >
              Schließen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
