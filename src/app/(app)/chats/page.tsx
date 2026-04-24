import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ConversationList from "@/components/chat/ConversationList";
import type { ConversationWithMembers } from "@/types/database";
import LookaroundButton from "@/components/LookaroundButton";

export default async function ChatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: memberships } = await supabase
    .from("conversation_members")
    .select(`
      *,
      conversation:conversations(
        *,
        members:conversation_members(
          *,
          user:users(id, display_name, avatar_url, status, last_seen)
        )
      )
    `)
    .eq("user_id", user!.id)
    .order("conversation.last_message_at", { ascending: false });

  const conversations = (memberships ?? [])
    .map((m) => m.conversation as ConversationWithMembers)
    .filter(Boolean)
    .filter((c) => !c.is_archived);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div
        className="flex-none px-4 flex items-center justify-between"
        style={{
          height: "var(--header-height)",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Chats</h1>
        <div className="flex gap-2 items-center">
          <LookaroundButton />
          {/* Neuer Chat → /chats/new */}
          <Link href="/chats/new"
            className="w-9 h-9 flex items-center justify-center rounded-full"
            style={{ color: "var(--nexio-green)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        <ConversationList conversations={conversations} currentUserId={user!.id} />
      </div>
    </div>
  );
}
