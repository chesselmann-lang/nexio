import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function JoinPage({ params }: { params: { token: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/join/${params.token}`);
  }

  // Look up conversation by token
  const { data: conv } = await supabase
    .from("conversations")
    .select("id, name, type, members:conversation_members(count)")
    .eq("invite_token", params.token)
    .eq("type", "group")
    .single();

  if (!conv) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ background: "var(--background)" }}>
        <div className="text-4xl mb-4">🔗</div>
        <h1 className="text-xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
          Link nicht gefunden
        </h1>
        <p className="text-sm text-center" style={{ color: "var(--foreground-3)" }}>
          Dieser Einladungslink ist ungültig oder abgelaufen.
        </p>
        <a href="/chats" className="mt-6 text-sm font-semibold" style={{ color: "var(--nexio-green)" }}>
          Zurück zu Chats
        </a>
      </div>
    );
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from("conversation_members")
    .select("user_id")
    .eq("conversation_id", conv.id)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    redirect(`/chats/${conv.id}`);
  }

  // Add as member
  await supabase.from("conversation_members").insert({
    conversation_id: conv.id,
    user_id: user.id,
    role: "member",
    joined_at: new Date().toISOString(),
  });

  // Add system message
  const { data: profile } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", user.id)
    .single();

  await supabase.from("messages").insert({
    conversation_id: conv.id,
    sender_id: user.id,
    type: "system",
    content: `${profile?.display_name ?? "Jemand"} ist der Gruppe beigetreten 👋`,
  });

  redirect(`/chats/${conv.id}`);
}
