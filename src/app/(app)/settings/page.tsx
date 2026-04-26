"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

interface UserProfile {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

interface SettingsItem {
  icon: string;
  label: string;
  description?: string;
  href?: string;
  action?: () => void;
  badge?: string;
  chevron?: boolean;
  danger?: boolean;
  toggle?: React.ReactNode;
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState<string>("");
  const [signingOut, setSigningOut] = useState(false);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");
      const { data } = await supabase.from("users").select("display_name, username, avatar_url, bio").eq("id", user.id).maybeSingle();
      if (data) setProfile(data);
    }
    load();
    if (typeof Notification !== "undefined") {
      setNotifPerm(Notification.permission);
    } else {
      setNotifPerm("unsupported");
    }
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function requestNotifPermission() {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setNotifPerm(result);
  }

  const notifBadge =
    notifPerm === "granted" ? "Aktiviert" :
    notifPerm === "denied" ? "Blockiert" :
    notifPerm === "unsupported" ? "N/A" : "Anfragen";

  const sections: SettingsSection[] = [
    {
      title: "Benachrichtigungen",
      items: [
        {
          icon: "🔔",
          label: "Benachrichtigungen",
          description: "Push, Töne, Vorschau",
          href: "/settings/notifications",
          badge: notifBadge,
          chevron: true,
        },
      ],
    },
    {
      title: "Datenschutz & Sicherheit",
      items: [
        {
          icon: "🔒",
          label: "Datenschutz & 2FA",
          description: "Online-Status, Jugendschutz, Zwei-Faktor",
          href: "/settings/privacy",
          chevron: true,
        },
        {
          icon: "🔑",
          label: "Ende-zu-Ende Verschlüsselung",
          description: "Schlüsselverwaltung, Sicherheitsnummer",
          href: "/settings/e2e",
          chevron: true,
        },
        {
          icon: "🚫",
          label: "Blockierte Nutzer",
          description: "Verwalte blockierte Kontakte",
          href: "/settings/blocked",
          chevron: true,
        },
      ],
    },
    {
      title: "Erscheinungsbild",
      items: [
        {
          icon: "🎨",
          label: "Erscheinungsbild",
          description: "Theme, Schriftgröße, Farbschema",
          href: "/settings/appearance",
          chevron: true,
          toggle: <ThemeToggle />,
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          icon: "✏️",
          label: "Profil bearbeiten",
          description: "Name, Foto, Bio, Benutzername",
          href: "/profile/edit",
          chevron: true,
        },
        {
          icon: "📧",
          label: "E-Mail-Adresse",
          description: email || "Wird geladen…",
          chevron: false,
        },
        {
          icon: "🛡️",
          label: "DSGVO & meine Daten",
          description: "Datenauskunft und Löschung",
          href: "/datenschutz",
          chevron: true,
        },
      ],
    },
    {
      title: "Über Nexio",
      items: [
        {
          icon: "📄",
          label: "Impressum",
          href: "/impressum",
          chevron: true,
        },
        {
          icon: "🔏",
          label: "Datenschutzerklärung",
          href: "/datenschutz",
          chevron: true,
        },
        {
          icon: "📋",
          label: "AGB",
          href: "/agb",
          chevron: true,
        },
        {
          icon: "⚖️",
          label: "DSA Transparenz",
          href: "/transparenz",
          chevron: true,
        },
        {
          icon: "ℹ️",
          label: "Version",
          description: "Nexio 1.0 · Made in Germany",
          chevron: false,
        },
      ],
    },
    {
      title: "",
      items: [
        {
          icon: "🚪",
          label: "Abmelden",
          action: handleSignOut,
          danger: true,
        },
      ],
    },
  ];

  const displayName = profile?.display_name ?? profile?.username ?? "Profil";
  const avatarUrl = profile?.avatar_url;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "var(--background)", overflowY: "auto" }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          backdropFilter: "blur(12px)",
          background: "var(--background)",
          zIndex: 10,
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--nexio-indigo)",
            padding: "4px 8px 4px 0",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
          </svg>
        </button>
        <h1
          className="text-xl font-bold"
          style={{ color: "var(--foreground)", letterSpacing: "-0.3px" }}
        >
          Einstellungen
        </h1>
      </div>

      {/* Profile card */}
      <Link
        href="/profile"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "18px 16px",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          textDecoration: "none",
          margin: "12px 16px",
          borderRadius: 16,
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            overflow: "hidden",
            background: "var(--nexio-indigo)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: 22,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} style={{ width: 56, height: 56, objectFit: "cover" }} />
          ) : (
            initials
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            className="font-semibold text-base"
            style={{ color: "var(--foreground)", letterSpacing: "-0.2px" }}
          >
            {displayName}
          </p>
          <p
            className="text-sm"
            style={{
              color: "var(--foreground-3)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {profile?.bio ?? email ?? "Profil anzeigen →"}
          </p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ color: "var(--foreground-3)", flexShrink: 0 }}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      </Link>

      {/* Sections */}
      <div style={{ padding: "0 0 80px" }}>
        {sections.map((section, si) => (
          <div key={si} style={{ marginBottom: 8 }}>
            {section.title && (
              <p
                className="text-xs font-semibold uppercase"
                style={{
                  color: "var(--foreground-3)",
                  padding: "10px 16px 6px",
                  letterSpacing: "0.8px",
                }}
              >
                {section.title}
              </p>
            )}
            <div
              style={{
                margin: "0 16px",
                background: "var(--surface)",
                borderRadius: 14,
                overflow: "hidden",
                border: "1px solid var(--border)",
              }}
            >
              {section.items.map((item, ii) => {
                const isLast = ii === section.items.length - 1;
                const inner = (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "13px 14px",
                      borderBottom: isLast ? "none" : "1px solid var(--border)",
                      cursor: (item.href || item.action) ? "pointer" : "default",
                    }}
                  >
                    <span style={{ fontSize: 20, flexShrink: 0, width: 28, textAlign: "center" }}>{item.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        className="text-sm font-medium"
                        style={{ color: item.danger ? "#ef4444" : "var(--foreground)" }}
                      >
                        {item.label}
                      </p>
                      {item.description && (
                        <p
                          className="text-xs"
                          style={{
                            color: "var(--foreground-3)",
                            marginTop: 2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.description}
                        </p>
                      )}
                    </div>
                    {item.toggle && (
                      <div onClick={(e) => e.preventDefault()}>
                        {item.toggle}
                      </div>
                    )}
                    {item.badge && !item.toggle && (
                      <span
                        className="text-xs font-medium"
                        style={{
                          color:
                            item.badge === "Aktiviert" ? "var(--nexio-green)" :
                            item.badge === "Blockiert" ? "#ef4444" :
                            "var(--foreground-3)",
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                    {item.chevron && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                        style={{ color: "var(--foreground-3)", flexShrink: 0 }}>
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    )}
                  </div>
                );

                if (item.href) {
                  return <Link key={item.label} href={item.href} style={{ textDecoration: "none" }}>{inner}</Link>;
                }
                if (item.action) {
                  return (
                    <button
                      key={item.label}
                      onClick={item.action}
                      disabled={signingOut && item.danger}
                      style={{ width: "100%", background: "transparent", border: "none", padding: 0, textAlign: "left" }}
                    >
                      {inner}
                    </button>
                  );
                }
                return <div key={item.label}>{inner}</div>;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
