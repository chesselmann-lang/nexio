import { createClient } from "@/lib/supabase/server";
import StoriesFeed from "@/components/social/StoriesFeed";
import { redirect } from "next/navigation";

export default async function SocialPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Stories = posts not yet expired
  const { data: stories } = await supabase
    .from("stories")
    .select("*, author:users!author_id(id, display_name, avatar_url, username)")
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(50);

  return <StoriesFeed initialStories={stories ?? []} currentUserId={user.id} />;
}
