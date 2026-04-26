"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/types/database";
import IncomingCallBanner from "@/components/calls/IncomingCallBanner";

const NAV = [
  {
    href: "/chats",
    label: "Chats",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: "/social",
    label: "Momente",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    href: "/channels",
    label: "Kanäle",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        <path d="M14.05 2a9 9 0 0 1 8 7.94" />
        <path d="M14.05 6A5 5 0 0 1 18 10" />
      </svg>
    ),
  },
  {
    href: "/ai",
    label: "KI",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3h1V6a4 4 0 0 1 4-4z" />
        <circle cx="9" cy="13" r="1" fill="currentColor" />
        <circle cx="15" cy="13" r="1" fill="currentColor" />
        <path d="M9 17c.83.83 2.17 1 3 1s2.17-.17 3-1" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Ich",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function AppShell({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: User | null;
}) {
  const pathname = usePathname();
  const supabase = createClient();
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  useEffect(() => {
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false)
      .then(({ count }) => setUnreadNotifs(count ?? 0));

    const channel = supabase
      .channel("appshell-notifs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" },
        () => setUnreadNotifs((n) => n + 1))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications" },
        () => supabase.from("notifications").select("id", { count: "exact", head: true })
          .eq("is_read", false).then(({ count }) => setUnreadNotifs(count ?? 0)))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--background)" }}>
      {profile?.id && (
        <IncomingCallBanner
          currentUserId={profile.id}
          displayName={profile.display_name ?? "Ich"}
        />
      )}

      <main className="flex-1 overflow-hidden relative">{children}</main>

      {/* Bottom Navigation — Glassmorphism */}
      <nav
        className="flex-none pb-safe glass-nav"
        style={{
          height: "var(--nav-height)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div className="flex h-full items-center">
          {NAV.map(({ href, label, icon }) => {
            const active = isActive(href);
            const isProfile = href === "/profile";
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center h-full select-none"
                style={{ color: active ? "var(--nav-active)" : "var(--nav-inactive)", transition: "color 0.15s" }}
              >
                <div className={`nav-pill${active ? " active" : ""} flex flex-col items-center gap-0.5`}>
                  <span className="w-6 h-6 flex items-center justify-center relative">
                    {icon(active)}
                    {isProfile && unreadNotifs > 0 && (
                      <span
                        className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold px-0.5"
                        style={{ background: "#ef4444" }}
                      >
                        {unreadNotifs > 99 ? "99+" : unreadNotifs}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] font-medium" style={{ letterSpacing: "0.01em" }}>
                    {label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
