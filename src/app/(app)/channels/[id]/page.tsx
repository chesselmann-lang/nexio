import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ChannelDetailClient from "./ChannelDetailClient";

export default async function ChannelDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: channel } = await supabase
    .from("channels")
    .select("id, name, description, avatar_url, subscriber_count, verified, category, owner_id, is_active")
    .eq("id", params.id)
    .single();

  if (!channel) notFound();

  const { data: posts } = await supabase
    .from("channel_posts")
    .select("id, content, media_urls, created_at, likes_count, comments_count, author:users(display_name, avatar_url)")
    .eq("channel_id", params.id)
    .order("created_at", { ascending: false })
    .limit(30);

  let isSubscribed = false;
  let isOwner = false;
  if (user) {
    const { data: mem } = await supabase
      .from("channel_members")
      .select("id, role")
      .eq("channel_id", params.id)
      .eq("user_id", user.id)
      .single();
    isSubscribed = !!mem;
    isOwner = mem?.role === "owner" || channel.owner_id === user.id;
  }

  return (
    <ChannelDetailClient
      channel={channel as any}
      posts={(posts ?? []) as any}
      currentUserId={user?.id ?? null}
      isSubscribed={isSubscribed}
      isOwner={isOwner}
    />
  );
}
