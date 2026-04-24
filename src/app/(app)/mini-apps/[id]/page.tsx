import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import MiniAppViewer from "./MiniAppViewer";

export default async function MiniAppPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: program } = await supabase
    .from("mini_programs")
    .select("*")
    .eq("id", params.id)
    .eq("is_active", true)
    .single();

  if (!program) notFound();

  // Increment usage
  await supabase
    .from("mini_programs")
    .update({ usage_count: (program.usage_count ?? 0) + 1 })
    .eq("id", params.id);

  // Log history
  if (user) {
    await supabase
      .from("mini_program_history")
      .upsert({ user_id: user.id, mini_program_id: params.id }, { onConflict: "user_id,mini_program_id" });
  }

  return <MiniAppViewer program={program} userId={user?.id} />;
}
