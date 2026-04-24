"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/types/database";

const MENU_SECTIONS = [
  {
    items: [
      { icon: "👤", label: "Profil bearbeiten", href: "/profile/edit" },
      { icon: "👥", label: "Kontakte", href: "/contacts" },
      { icon: "💳", label: "Nexio Pay", href: "/payments" },
      { icon: "🔔", label: "Benachrichtigungen", href: "/settings/notifications" },
      { icon: "🔒", label: "Datenschutz & Sicherheit", href: "/settings/privacy" },
    ],
  },
  {
    items: [
      { icon: "🎨", label: "Erscheinungsbild", href: "/settings/appearance" },
      { icon: "🌍", label: "Sprache", href: "/settings/language" },
      { icon: "📱", label: "Geräteverwaltung", href: "/settings/devices" },
    ],
  },
  {
    items: [
      { icon: "🧩", label: "Mini-Programme", href: "/mini-apps", badge: "NEU" },
      { icon: "💼", label: "Business-Modus", href: "/business" },
      { icon: "💰", label: "Preise & Pläne", href: "/pricing" },
      { icon: "🔗", label: "Verbundene Apps", href: "/settings/integrations" },
      { icon: "🛡️", label: "DSGVO & meine Daten", href: "/settings/gdpr" },
    ],
  },
  {
    items: [
      { icon: "❓", label: "Hilfe & Support", href: "/support" },
      { icon: "⭐", label: "Nexio bewerten", href: "/rate" },
      { icon: "ℹ️", label: "Über Nexio", href: "/about" },
    ],
  },
];

const ADMIN_USER_ID = "152f5271-385e-40f5-8d9e-ecedee59525b";

export default function ProfileClient({ profile, userId }: { profile: User | null; userId?: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const initials = profile?.display_name?.slice(0, 2).toUpperCase() ?? "?";

  return (
    <div className="h-full flex flex-col">
      <div className="flex-none px-4 flex items-center border-b"
        style={{ height: "var(--header-height)", background: "var(--surface)", borderColor: "var(--border)" }}>
        <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Ich</h1>
        <button className="ml-auto" style={{ color: "var(--foreground-2)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile Card */}
        <div className="flex items-center gap-4 px-4 py-5 border-b"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-none"
            style={{ background: "var(--nexio-green)" }}
          >
            {profile?.avatar_url
              ? <img src={profile.avatar_url} className="w-16 h-16 rounded-full object-cover" alt="" />
              : initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg truncate" style={{ color: "var(--foreground)" }}>
              {profile?.display_name ?? "Unbekannt"}
            </p>
            <p className="text-sm truncate" style={{ color: "var(--foreground-3)" }}>
              @{profile?.username ?? "—"}
            </p>
            <p className="text-sm mt-0.5 truncate" style={{ color: "var(--foreground-3)" }}>
              {profile?.bio || "Kein Status gesetzt"}
            </p>
          </div>
          <button style={{ color: "var(--foreground-3)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Nexio ID / QR */}
        <div className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <span className="text-lg">📷</span>
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Mein QR-Code</p>
            <p className="text-xs" style={{ color: "var(--foreground-3)" }}>
              Kontakte hinzufügen per Scan
            </p>
          </div>
        </div>

        {/* Settings Sections */}
        {MENU_SECTIONS.map((section, si) => (
          <div key={si} className="mt-3">
            {section.items.map((item) => (
              <button
                key={item.label}
                onClick={() => router.push(item.href)}
                className="w-full flex items-center gap-3 px-4 py-3.5 border-b text-left"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <span className="text-xl w-7 text-center">{item.icon}</span>
                <span className="flex-1 text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  {item.label}
                </span>
                {"badge" in item && item.badge && (
                  <span className="text-xs px-2 py-0.5 rounded-full text-white"
                    style={{ background: "var(--nexio-green)" }}>
                    {item.badge}
                  </span>
                )}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ color: "var(--foreground-3)" }}>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            ))}
          </div>
        ))}

        {/* Admin link — only for admin user */}
        {userId === ADMIN_USER_ID && (
          <div className="mt-3">
            <button
              onClick={() => router.push("/admin")}
              className="w-full py-3.5 text-center font-semibold flex items-center justify-center gap-2"
              style={{ background: "var(--surface)", color: "var(--nexio-green)" }}
            >
              <span>⚙️</span> Admin Dashboard
            </button>
          </div>
        )}

        {/* Logout */}
        <div className="mt-3 mb-6">
          <button
            onClick={signOut}
            className="w-full py-3.5 text-center font-semibold text-red-500"
            style={{ background: "var(--surface)" }}
          >
            Abmelden
          </button>
        </div>

        <p className="text-center text-xs pb-6" style={{ color: "var(--foreground-3)" }}>
          Nexio v0.1 · Made in Germany · DSGVO-konform
        </p>
      </div>
    </div>
  );
}
