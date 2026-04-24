import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PublicProfileClient from "./PublicProfileClient";

export async function generateMetadata({ params }: { params: { username: string } }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("display_name, username, bio, avatar_url")
    .eq("username", params.username)
    .single();

  if (!data) return { title: "Nutzer nicht gefunden | Nexio" };
  return {
    title: `${data.display_name} (@${data.username}) | Nexio`,
    description: data.bio ?? `Schaue dir das Nexio-Profil von ${data.display_name} an.`,
    openGraph: {
      images: data.avatar_url ? [data.avatar_url] : [],
    },
  };
}

export default async function PublicProfilePage({ params }: { params: { username: string } }) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("users")
    .select("id, display_name, username, bio, avatar_url, created_at")
    .eq("username", params.username)
    .single();

  if (!profile) notFound();

  const { data: { user: me } } = await supabase.auth.getUser();

  // Check if already a contact
  let isContact = false;
  if (me && me.id !== profile.id) {
    const { data: existing } = await supabase
      .from("contacts")
      .select("id")
      .eq("user_id", me.id)
      .eq("contact_id", profile.id)
      .single();
    isContact = !!existing;
  }

  return (
    <PublicProfileClient
      profile={profile}
      currentUserId={me?.id ?? null}
      isContact={isContact}
    />
  );
}
