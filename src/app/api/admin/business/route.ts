import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_USER_ID = "152f5271-385e-40f5-8d9e-ecedee59525b";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== ADMIN_USER_ID) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { channelId, action } = await req.json();
  if (!channelId || !["verify", "reject"].includes(action))
    return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const update = action === "verify"
    ? { is_business: true }
    : { is_business: false };

  const { error } = await supabase.from("channels").update(update).eq("id", channelId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, action });
}
