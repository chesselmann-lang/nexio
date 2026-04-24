import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ChatView from "@/components/chat/ChatView";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check membership
  const { data: member } = await supabase
    .from("conversation_members")
    .select("*")
    .eq("conversation_id", id)
    .eq("user_id", user!.id)
    .single();

  if (!member) notFound();

  // Load conversation
  const { data: conv } = await supabase
    .from("conversations")
    .select(`
      *,
      members:conversation_members(
        *,
        user:users(id, display_name, avatar_url, status, last_seen, public_key)
      )
    `)
    .eq("id", id)
    .single();

  if (!conv) notFound();

  // Load last 50 messages
  const { data: messages } = await supabase
    .from("messages")
    .select(`
      *,
      sender:users(id, display_name, avatar_url)
    `)
    .eq("conversation_id", id)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true })
    .limit(50);

  // Mark as read
  await supabase
    .from("conversation_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", id)
    .eq("user_id", user!.id);

  return (
    <ChatView
      conversation={conv as any}
      initialMessages={(messages ?? []) as any}
      currentUserId={user!.id}
    />
  );
}
