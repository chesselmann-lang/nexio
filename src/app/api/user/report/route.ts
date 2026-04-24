import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const VALID_REASONS = ["spam", "harassment", "fake_account", "inappropriate_content", "scam", "other"];
const VALID_TARGET_TYPES = ["user", "message", "story", "channel_post"];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { targetType, targetId, reason, detail } = await req.json();

  if (!VALID_TARGET_TYPES.includes(targetType))
    return NextResponse.json({ error: "Invalid targetType" }, { status: 400 });
  if (!VALID_REASONS.includes(reason))
    return NextResponse.json({ error: "Invalid reason" }, { status: 400 });

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    reason,
    detail: detail ?? null,
    status: "pending",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
