import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// POST /api/e2e/keys — publish own public key
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { publicKey } = await req.json();
  if (!publicKey || typeof publicKey !== "string") {
    return NextResponse.json({ error: "Invalid public key" }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_public_keys")
    .upsert({ user_id: user.id, public_key_b64: publicKey, algorithm: "ECDH-P256" }, {
      onConflict: "user_id",
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// GET /api/e2e/keys — get own key status
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("user_public_keys")
    .select("public_key_b64, algorithm, created_at")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({ hasKey: !!data, key: data });
}

// DELETE /api/e2e/keys — remove own public key (disables E2E)
export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase.from("user_public_keys").delete().eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
