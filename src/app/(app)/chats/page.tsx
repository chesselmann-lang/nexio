import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ConversationList from "@/components/chat/ConversationList";
import type { ConversationWithMembers } from "@/types/database";
import LookaroundButton from "@/components/LookaroundButton";
import StoryBar from "@/components/chat/StoryBar";
import NotificationBell from "@/components/notifications/NotificationBell";

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


  // Fetch contacts who have active stories in last 24h
  const { data: storyData } = await supabase
    .from("stories")
    .select("user_id, seen_by, users(id, display_name, avatar_url)")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  // Build story user list: own entry first, then others
  const storyUserMap = new Map<string, { id: string; display_name: string; avatar_url: string | null; seen: boolean; isOwn?: boolean }>();
  (storyData ?? []).forEach((s: any) => {
    const u = s.users;
    if (!u || storyUserMap.has(u.id)) return;
    storyUserMap.set(u.id, {
      id: u.id,
      display_name: u.display_name ?? "?",
      avatar_url: u.avatar_url ?? null,
      seen: Array.isArray(s.seen_by) && s.seen_by.includes(user!.id),
      isOwn: u.id === user!.id,
    });
  });
  // Always prepend current user as "add story" entry
  const storyUsers = [
    { id: user!.id, display_name: "Meine Story", avatar_url: null, hasStory: storyUserMap.has(user!.id), seen: false, isOwn: true },
    ...[...storyUserMap.values()].filter(u => u.id !== user!.id).map(u => ({ ...u, hasStory: true })),
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div
        className="flex-none px-4 flex items-center justify-between"
        style={{
          height: "var(--header-height)",
          background: "var(--background)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Chats</h1>
        <div className="flex gap-1 items-center">
          <LookaroundButton />
          {/* Notification Bell */}
          <NotificationBell />
          {/* Search */}
          <Link href="/search"
            className="w-9 h-9 flex items-center justify-center rounded-full"
            style={{ color: "var(--foreground-3)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </Link>
          {/* Neuer Chat → /chats/new */}
          <Link href="/chats/new"
            className="w-9 h-9 flex items-center justify-center rounded-full"
            style={{ color: "var(--nexio-indigo)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Story Bar */}
      <StoryBar users={storyUsers} />

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        <ConversationList conversations={conversations} currentUserId={user!.id} />
      </div>
    </div>
  );
}
