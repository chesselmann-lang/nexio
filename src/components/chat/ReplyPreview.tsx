"use client";
import type { MessageWithSender } from "@/types/database";

interface ReplyPreviewProps {
  message: MessageWithSender;
  onCancel: () => void;
}

function contentPreview(msg: MessageWithSender): string {
  if (msg.type === "text") return msg.content?.slice(0, 80) ?? "";
  if (msg.type === "image") return "📷 Bild";
  if (msg.type === "video") return "🎥 Video";
  if (msg.type === "audio") return "🎙️ Sprachnachricht";
  if (msg.type === "file") return "📎 Datei";
  return "Nachricht";
}

export default function ReplyPreview({ message, onCancel }: ReplyPreviewProps) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 border-t border-b"
      style={{
        background: "var(--surface-2)",
        borderColor: "var(--border)",
      }}
    >
      {/* Green left bar */}
      <div className="w-0.5 h-10 rounded-full flex-none" style={{ background: "var(--nexio-green)" }} />

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: "var(--nexio-green)" }}>
          {message.sender?.display_name ?? "Jemand"}
        </p>
        <p className="text-xs truncate" style={{ color: "var(--foreground-3)" }}>
          {contentPreview(message)}
        </p>
      </div>

      {/* Cancel */}
      <button
        onClick={onCancel}
        className="w-6 h-6 flex items-center justify-center flex-none rounded-full"
        style={{ color: "var(--foreground-3)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
