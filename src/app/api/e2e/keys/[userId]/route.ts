import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/e2e/keys/[userId] — fetch any user's public key (they're public by design)
export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("user_public_keys")
    .select("public_key_b64, algorithm, created_at")
    .eq("user_id", params.userId)
    .single();

  if (!data) return NextResponse.json({ publicKey: null });
  return NextResponse.json({ publicKey: data.public_key_b64, algorithm: data.algorithm });
}
