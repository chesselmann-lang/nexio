"use client";
import Link from "next/link";
import { useState, useRef, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import type { ConversationWithMembers, User } from "@/types/database";

function getConversationName(conv: ConversationWithMembers, currentUserId: string): string {
  if (conv.name) return conv.name;
  if (conv.type === "direct") {
    const other = conv.members?.find((m) => m.user_id !== currentUserId);
    return (other?.user as User)?.display_name ?? "Unbekannt";
  }
  return "Gruppe";
}

function getAvatar(conv: ConversationWithMembers, currentUserId: string): string | null {
  if (conv.avatar_url) return conv.avatar_url;
  if (conv.type === "direct") {
    const other = conv.members?.find((m) => m.user_id !== currentUserId);
    return (other?.user as User)?.avatar_url ?? null;
  }
  return null;
}

// Deterministic avatar color from name
const AVATAR_COLORS = ["#7c5cfc", "#07c160", "#1677ff", "#f59e0b", "#ef4444", "#8b5cf6"];
function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function AvatarCircle({
  src, name, size = 48, hasStory = false,
}: { src: string | null; name: string; size?: number; hasStory?: boolean }) {
  const initials = name.slice(0, 2).toUpperCase();
  const color = avatarColor(name);

  const img = src ? (
    <img src={src} alt={name} width={size} height={size}
      className="rounded-full object-cover flex-none"
      style={{ width: size, height: size }} />
  ) : (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold flex-none"
      style={{ width: size, height: size, background: color, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );

  if (!hasStory) return img;

  // Story ring — gradient border
  return (
    <div className="story-ring flex-none" style={{ width: size + 6, height: size + 6 }}>
      <div className="story-ring-inner">
        {img}
      </div>
    </div>
  );
}

// ── Timestamp helper ─────────────────────────────────────────
function relTime(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: false, locale: de });
}

// ── Single conversation row ───────────────────────────────────
function ConvRow({ conv, currentUserId }: { conv: ConversationWithMembers; currentUserId: string }) {
  const supabase = createClient();
  const name   = getConversationName(conv, currentUserId);
  const avatar = getAvatar(conv, currentUserId);
  const lastMsg = conv.last_message;
  const unread  = conv.unread_count ?? 0;

  // Draft persistence (E3) — read from localStorage on client
  const [draft, setDraft] = useState<string | null>(null);
  useState(() => {
    try {
      const d = localStorage.getItem(`nexio-draft-${conv.id}`);
      if (d) setDraft(d);
    } catch { /* ignore */ }
  });

  const myMembership = conv.members?.find((m: any) => m.user_id === currentUserId);
  const [isMuted, setIsMuted]   = useState<boolean>((myMembership as any)?.is_muted ?? false);
  const [showMenu, setShowMenu] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePressStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => setShowMenu(true), 500);
  }, []);
  const handlePressEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  async function toggleMute() {
    const next = !isMuted;
    setIsMuted(next);
    setShowMenu(false);
    await supabase
      .from("conversation_members")
      .update({ is_muted: next })
      .eq("conversation_id", conv.id)
      .eq("user_id", currentUserId);
  }

  const lastMsgPreview = lastMsg
    ? lastMsg.type === "text"  ? (lastMsg.content ?? "")
    : lastMsg.type === "image" ? "📷 Foto"
    : lastMsg.type === "audio" ? "🎙 Sprachnachricht"
    : lastMsg.type === "video" ? "🎥 Video"
    : lastMsg.type === "payment" ? "💶 Zahlung"
    : lastMsg.type === "system" ? "ℹ️ Systemnachricht"
    : "Nachricht"
    : "Noch keine Nachrichten";

  return (
    <li>
      <div
        className="relative"
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
      >
        <Link
          href={`/chats/${conv.id}`}
          className="flex items-center gap-3 px-4 py-3 active:opacity-70 transition-opacity"
          style={{ background: "var(--background)" }}
        >
          {/* Avatar */}
          <div className="relative flex-none">
            <AvatarCircle src={avatar} name={name} size={54} />
            {isMuted && (
              <span className="absolute -bottom-0.5 -right-0.5 text-[11px] leading-none">🔕</span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-[15px] truncate" style={{ color: "var(--foreground)" }}>
                {name}
              </span>
              {lastMsg && (
                <span className="text-[11px] flex-none" style={{ color: "var(--foreground-3)" }}>
                  {relTime(lastMsg.created_at)}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 mt-0.5">
              <p className="text-[13px] truncate leading-snug"
                style={{ color: isMuted ? "var(--foreground-3)" : "var(--foreground-2)" }}>
                {draft ? (
                  <>
                    <span className="font-semibold mr-1" style={{ color: "#ef4444" }}>Entwurf:</span>
                    {draft.slice(0, 40)}
                  </>
                ) : lastMsgPreview}
              </p>
              {unread > 0 && !isMuted && (
                <span
                  className="rounded-full text-white text-[11px] font-bold px-1.5 min-w-[20px] h-5 flex items-center justify-center flex-none"
                  style={{ background: "var(--nexio-indigo)" }}
                >
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
              {unread > 0 && isMuted && (
                <span
                  className="rounded-full text-[11px] font-bold px-1.5 min-w-[20px] h-5 flex items-center justify-center flex-none"
                  style={{ background: "var(--surface-2)", color: "var(--foreground-3)" }}
                >
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* Long-press context menu */}
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div
              className="absolute left-4 top-full mt-1 z-50 rounded-2xl shadow-2xl overflow-hidden min-w-[200px]"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <button
                onClick={toggleMute}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left"
                style={{ color: "var(--foreground)" }}
              >
                <span>{isMuted ? "🔔" : "🔕"}</span>
                {isMuted ? "Stummschaltung aufheben" : "Stumm schalten"}
              </button>
              <div className="border-t" style={{ borderColor: "var(--border)" }} />
              <Link
                href={`/chats/${conv.id}`}
                onClick={() => setShowMenu(false)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm"
                style={{ color: "var(--foreground)" }}
              >
                <span>💬</span>
                Chat öffnen
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Divider indented past avatar */}
      <div className="ml-[82px] border-b" style={{ borderColor: "var(--border-light, var(--border))" }} />
    </li>
  );
}

// ── Main list ─────────────────────────────────────────────────
export default function ConversationList({
  conversations,
  currentUserId,
}: {
  conversations: ConversationWithMembers[];
  currentUserId: string;
}) {
  if (!conversations.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 px-8 text-center">
        <div className="text-5xl mb-4">💬</div>
        <p className="font-semibold text-lg" style={{ color: "var(--foreground)" }}>
          Noch keine Chats
        </p>
        <p className="text-sm mt-2" style={{ color: "var(--foreground-3)" }}>
          Starte eine neue Unterhaltung mit Freunden oder Kontakten.
        </p>
      </div>
    );
  }

  return (
    <ul>
      {conversations.map((conv) => (
        <ConvRow key={conv.id} conv={conv} currentUserId={currentUserId} />
      ))}
    </ul>
  );
}
