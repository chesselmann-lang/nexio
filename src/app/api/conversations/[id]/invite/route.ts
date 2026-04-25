import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const convId = params.id;

  // Check that caller is a member (and optionally owner)
  const { data: membership } = await supabase
    .from("conversation_members")
    .select("role")
    .eq("conversation_id", convId)
    .eq("user_id", user.id)
    .single();

  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  // Check existing token first
  const { data: conv } = await supabase
    .from("conversations")
    .select("invite_token, type")
    .eq("id", convId)
    .single();

  if (!conv || conv.type !== "group") {
    return NextResponse.json({ error: "Only group chats support invite links" }, { status: 400 });
  }

  if (conv.invite_token) {
    return NextResponse.json({ token: conv.invite_token });
  }

  // Generate a new token
  const token = randomBytes(12).toString("base64url");
  await supabase.from("conversations").update({ invite_token: token }).eq("id", convId);

  return NextResponse.json({ token });
}
