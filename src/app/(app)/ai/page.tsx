import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AIAssistantClient from "./AIAssistantClient";

export default async function AIPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load existing sessions
  const { data: sessions } = await supabase
    .from("ai_sessions")
    .select("id, title, last_message_at, message_count")
    .eq("user_id", user.id)
    .order("last_message_at", { ascending: false })
    .limit(20);

  return <AIAssistantClient sessions={sessions ?? []} userId={user.id} />;
}
