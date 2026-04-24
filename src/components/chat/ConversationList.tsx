"use client";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
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

function AvatarCircle({ src, name, size = 48 }: { src: string | null; name: string; size?: number }) {
  const initials = name.slice(0, 2).toUpperCase();
  const colors = ["#07c160", "#1677ff", "#ff6b35", "#8b5cf6", "#ef4444", "#f59e0b"];
  const color = colors[name.charCodeAt(0) % colors.length];
  if (src) {
    return <img src={src} alt={name} width={size} height={size}
      className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <div className="rounded-full flex items-center justify-center text-white font-semibold flex-none"
      style={{ width: size, height: size, background: color, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

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
      {conversations.map((conv) => {
        const name = getConversationName(conv, currentUserId);
        const avatar = getAvatar(conv, currentUserId);
        const lastMsg = conv.last_message;
        const unread = conv.unread_count ?? 0;

        return (
          <li key={conv.id}>
            <Link
              href={`/chats/${conv.id}`}
              className="flex items-center gap-3 px-4 py-3 active:opacity-70 transition-opacity"
              style={{ background: "var(--surface)" }}
            >
              {/* Avatar */}
              <AvatarCircle src={avatar} name={name} size={52} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold truncate" style={{ color: "var(--foreground)" }}>
                    {name}
                  </span>
                  {lastMsg && (
                    <span className="text-xs flex-none" style={{ color: "var(--foreground-3)" }}>
                      {formatDistanceToNow(new Date(lastMsg.created_at), {
                        addSuffix: false,
                        locale: de,
                      })}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="text-sm truncate" style={{ color: "var(--foreground-3)" }}>
                    {lastMsg
                      ? lastMsg.type === "text"
                        ? lastMsg.content ?? ""
                        : lastMsg.type === "image"
                        ? "📷 Foto"
                        : lastMsg.type === "audio"
                        ? "🎙 Sprachnachricht"
                        : lastMsg.type === "payment"
                        ? "💶 Zahlung"
                        : "Nachricht"
                      : "Noch keine Nachrichten"}
                  </p>
                  {unread > 0 && (
                    <span
                      className="rounded-full text-white text-xs font-semibold px-1.5 py-0.5 min-w-5 text-center flex-none"
                      style={{ background: "var(--nexio-green)" }}
                    >
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </div>
              </div>
            </Link>
            <div className="ml-[76px] border-b" style={{ borderColor: "var(--border)" }} />
          </li>
        );
      })}
    </ul>
  );
}
