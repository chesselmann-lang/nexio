import { createClient } from "@/lib/supabase/server";
import StoriesFeed from "@/components/social/StoriesFeed";
import { redirect } from "next/navigation";

export default async function SocialPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── Get accepted contacts (both directions) ──────────────────────────────────
  const [{ data: sent }, { data: received }] = await Promise.all([
    supabase
      .from("contact_requests")
      .select("receiver_id")
      .eq("sender_id", user.id)
      .eq("status", "accepted"),
    supabase
      .from("contact_requests")
      .select("sender_id")
      .eq("receiver_id", user.id)
      .eq("status", "accepted"),
  ]);

  const contactIds: string[] = [
    ...(sent?.map((c) => c.receiver_id) ?? []),
    ...(received?.map((c) => c.sender_id) ?? []),
  ];

  // ── Privacy-aware stories query ───────────────────────────────────────────────
  // Show: own stories + public + friends/close_friends from contacts
  const now = new Date().toISOString();

  // Build OR filter:
  //  - author_id = me  (own stories — regardless of privacy)
  //  - privacy = public
  //  - privacy in (friends, close_friends) AND author_id in (contactIds)  [only if we have contacts]
  const orParts = [`author_id.eq.${user.id}`, `privacy.eq.public`];
  if (contactIds.length > 0) {
    orParts.push(
      `and(privacy.in.(friends,close_friends),author_id.in.(${contactIds.join(",")}))`
    );
  }

  const { data: stories } = await supabase
    .from("stories")
    .select("*, author:users!author_id(id, display_name, avatar_url, username)")
    .gte("expires_at", now)
    .or(orParts.join(","))
    .order("created_at", { ascending: false })
    .limit(50);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <StoriesFeed initialStories={(stories ?? []) as any} currentUserId={user.id} />;
}
