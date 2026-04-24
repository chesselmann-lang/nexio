import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PaymentsClient from "./PaymentsClient";

export default async function PaymentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("display_name, username")
    .eq("id", user.id)
    .single();

  const { data: transactions } = await supabase
    .from("payments")
    .select(`
      id, amount_cents, currency, note, status, created_at,
      sender:users!sender_id(id, display_name),
      receiver:users!receiver_id(id, display_name)
    `)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <PaymentsClient
      currentUserId={user.id}
      displayName={profile?.display_name ?? ""}
      transactions={(transactions ?? []) as any}
    />
  );
}
