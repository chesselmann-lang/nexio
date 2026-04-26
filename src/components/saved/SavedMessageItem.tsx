"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { BookmarkSlashIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { BookmarkIcon } from "@heroicons/react/24/solid";

interface SavedMessageItemProps {
  item: {
    id: string;
    saved_at: string;
    note: string | null;
    conversation_id: string;
    message: {
      id: string;
      content: string | null;
      type: string;
      media_url: string | null;
      created_at: string;
      sender: { id: string; display_name: string; avatar_url: string | null } | null;
    } | null;
    conversation: {
      id: string;
      name: string | null;
      type: string;
      avatar_url: string | null;
    } | null;
  };
  currentUserId: string;
}

const TYPE_LABELS: Record<string, string> = {
  image: "📷 Bild",
  video: "🎥 Video",
  audio: "🎤 Sprachnachricht",
  file: "📎 Datei",
  sticker: "🎭 Sticker",
  payment: "💸 Zahlung",
  location: "📍 Standort",
  system: "⚙️ System",
};

export default function SavedMessageItem({ item, currentUserId }: SavedMessageItemProps) {
  const router = useRouter();
  const [removed, setRemoved] = useState(false);
  const [saving, setSaving] = useState(false);

  if (removed) return null;

  const msg = item.message;
  if (!msg) return null;

  const senderName =
    msg.sender?.id === currentUserId
      ? "Du"
      : (msg.sender?.display_name ?? "Unbekannt");

  const preview =
    msg.type === "text"
      ? (msg.content ?? "")
      : TYPE_LABELS[msg.type] ?? msg.type;

  const convLabel =
    item.conversation?.name ??
    (item.conversation?.type === "direct" ? "Direktnachricht" : "Gruppe");

  const timeAgo = formatDistanceToNow(new Date(msg.created_at), {
    addSuffix: true,
    locale: de,
  });

  async function handleUnsave() {
    setSaving(true);
    try {
      await fetch("/api/messages/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message_id: msg!.id,
          conversation_id: item.conversation_id,
        }),
      });
      setRemoved(true);
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "14px 16px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Avatar or icon */}
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          background:
            msg.sender?.avatar_url
              ? undefined
              : "rgba(124,92,252,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {msg.sender?.avatar_url ? (
          <img
            src={msg.sender.avatar_url}
            alt={senderName}
            style={{ width: 42, height: 42, objectFit: "cover" }}
          />
        ) : (
          <BookmarkIcon
            style={{ width: 20, height: 20, color: "var(--nexio-indigo)" }}
          />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}
        >
          <span
            className="font-semibold text-sm"
            style={{ color: "var(--foreground)" }}
          >
            {senderName}
          </span>
          <span className="text-xs" style={{ color: "var(--foreground-3)" }}>
            · {timeAgo}
          </span>
        </div>

        {/* Message text */}
        <p
          className="text-sm"
          style={{
            color: "var(--foreground-2)",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            lineHeight: 1.45,
          }}
        >
          {preview}
        </p>

        {/* Origin conversation */}
        <button
          onClick={() => router.push(`/chats/${item.conversation_id}`)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginTop: 6,
            color: "var(--nexio-indigo)",
            fontSize: 12,
            fontWeight: 500,
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <ArrowRightIcon style={{ width: 12, height: 12 }} />
          {convLabel}
        </button>
      </div>

      {/* Unsave button */}
      <button
        onClick={handleUnsave}
        disabled={saving}
        style={{
          padding: 8,
          borderRadius: 20,
          background: "transparent",
          border: "none",
          cursor: saving ? "default" : "pointer",
          color: "var(--nexio-indigo)",
          opacity: saving ? 0.4 : 1,
          flexShrink: 0,
        }}
        title="Speichern aufheben"
      >
        <BookmarkSlashIcon style={{ width: 20, height: 20 }} />
      </button>
    </div>
  );
}
