import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChannelsFeed from "@/components/channels/ChannelsFeed";

export default async function ChannelsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load channels the user follows + discover top channels
  const { data: following } = await supabase
    .from("channel_members")
    .select("channel:channels(id, name, description, avatar_url, subscriber_count, verified)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  const { data: trending } = await supabase
    .from("channels")
    .select("id, name, description, avatar_url, subscriber_count, verified, category")
    .eq("is_active", true)
    .order("subscriber_count", { ascending: false })
    .limit(20);

  return (
    <ChannelsFeed
      following={(following ?? []).map((f: any) => f.channel).filter(Boolean)}
      trending={(trending ?? []) as any}
      currentUserId={user.id}
    />
  );
}
