import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { User } from "@/types/database";

export default async function ContactsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: contacts } = await supabase
    .from("contacts")
    .select("*, contact:users!contacts_contact_id_fkey(id, display_name, avatar_url, username, status, bio)")
    .eq("user_id", user!.id)
    .eq("is_blocked", false)
    .order("created_at", { ascending: false });

  const contactUsers = (contacts ?? []).map((c) => c.contact as User).filter(Boolean);

  // Group alphabetically
  const grouped: Record<string, User[]> = {};
  for (const u of contactUsers) {
    const letter = u.display_name[0].toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(u);
  }
  const letters = Object.keys(grouped).sort();

  return (
    <div className="h-full flex flex-col">
      <div className="flex-none flex items-center justify-between px-4 border-b"
        style={{ height: "var(--header-height)", background: "var(--surface)", borderColor: "var(--border)" }}>
        <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Kontakte</h1>
        <Link href="/chats/new" className="text-sm font-semibold" style={{ color: "var(--nexio-green)" }}>
          + Hinzufügen
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* QR-Code eigener Code */}
        <div className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl"
            style={{ background: "var(--nexio-green-light)" }}>
            📷
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Mein QR-Code</p>
            <p className="text-xs" style={{ color: "var(--foreground-3)" }}>Teile deinen Nexio-Code zum Hinzufügen</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ color: "var(--foreground-3)" }}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>

        {contactUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="text-5xl mb-4">👥</div>
            <p className="font-semibold text-lg" style={{ color: "var(--foreground)" }}>Noch keine Kontakte</p>
            <p className="text-sm mt-2" style={{ color: "var(--foreground-3)" }}>
              Füge Freunde und Kollegen hinzu um mit ihnen zu chatten.
            </p>
            <Link href="/chats/new"
              className="mt-4 px-6 py-2.5 rounded-full text-sm font-semibold text-white"
              style={{ background: "var(--nexio-green)" }}>
              Kontakt suchen
            </Link>
          </div>
        ) : (
          letters.map((letter) => (
            <div key={letter}>
              <p className="px-4 py-1.5 text-xs font-semibold sticky top-0"
                style={{ background: "var(--surface-2)", color: "var(--foreground-3)" }}>
                {letter}
              </p>
              {grouped[letter].map((u) => (
                <Link key={u.id} href={`/chats/new?user=${u.id}`}
                  className="flex items-center gap-3 px-4 py-3 border-b"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-none"
                    style={{ background: "#07c160" }}>
                    {u.avatar_url
                      ? <img src={u.avatar_url} className="w-11 h-11 rounded-full object-cover" alt="" />
                      : u.display_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                      {u.display_name}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--foreground-3)" }}>
                      {u.bio || `@${u.username}`}
                    </p>
                  </div>
                  {u.status === "online" && (
                    <div className="w-2 h-2 rounded-full flex-none" style={{ background: "var(--nexio-green)" }} />
                  )}
                </Link>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
