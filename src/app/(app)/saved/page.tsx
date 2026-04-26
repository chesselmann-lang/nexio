import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { ArrowLeftIcon, BookmarkIcon } from "@heroicons/react/24/solid";
import SavedMessageItem from "@/components/saved/SavedMessageItem";

export default async function SavedMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rows } = await supabase
    .from("saved_messages")
    .select(`
      id,
      saved_at,
      note,
      conversation_id,
      message:messages(
        id,
        content,
        type,
        media_url,
        created_at,
        sender:users!messages_sender_id_fkey(id, display_name, avatar_url)
      ),
      conversation:conversations(id, name, type, avatar_url)
    `)
    .eq("user_id", user.id)
    .order("saved_at", { ascending: false })
    .limit(100);

  const items = (rows ?? []) as any[];

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(12px)",
          background: "var(--background)",
        }}
      >
        <Link href="/chats" style={{ color: "var(--nexio-indigo)" }}>
          <ArrowLeftIcon style={{ width: 22, height: 22 }} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: "var(--nexio-indigo)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <BookmarkIcon style={{ width: 18, height: 18, color: "#fff" }} />
          </div>
          <div>
            <p
              className="font-semibold text-base"
              style={{ color: "var(--foreground)", letterSpacing: "-0.2px" }}
            >
              Gespeicherte Nachrichten
            </p>
            <p className="text-xs" style={{ color: "var(--foreground-3)" }}>
              {items.length} {items.length === 1 ? "Nachricht" : "Nachrichten"}
            </p>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div
          className="flex flex-col items-center justify-center"
          style={{ flex: 1, padding: "48px 24px", textAlign: "center" }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              background: "rgba(124,92,252,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <BookmarkIcon style={{ width: 32, height: 32, color: "var(--nexio-indigo)" }} />
          </div>
          <p
            className="font-semibold text-lg"
            style={{ color: "var(--foreground)", marginBottom: 8 }}
          >
            Noch nichts gespeichert
          </p>
          <p className="text-sm" style={{ color: "var(--foreground-3)", maxWidth: 260 }}>
            Halte eine Nachricht im Chat gedrückt und tippe auf „Speichern", um sie hier zu archivieren.
          </p>
        </div>
      )}

      {/* Saved message list */}
      {items.length > 0 && (
        <div style={{ flex: 1, overflowY: "auto" }}>
          {items.map((item) => (
            <SavedMessageItem key={item.id} item={item} currentUserId={user.id} />
          ))}
        </div>
      )}
    </div>
  );
}
