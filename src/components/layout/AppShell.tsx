"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@/types/database";

const NAV = [
  {
    href: "/chats",
    label: "Chats",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24"
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
      <svg width="24" height="24" viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    href: "/channels",
    label: "Kanäle",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24"
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
      <svg width="24" height="24" viewBox="0 0 24 24"
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
      <svg width="24" height="24" viewBox="0 0 24 24"
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

  // Helper: check if path is active (exact or prefix match)
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--background)" }}>
      {/* Main content */}
      <main className="flex-1 overflow-hidden relative">{children}</main>

      {/* Bottom Navigation — WeChat style */}
      <nav
        className="flex-none border-t pb-safe"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          height: "var(--nav-height)",
        }}
      >
        <div className="flex h-full">
          {NAV.map(({ href, label, icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 select-none"
                style={{
                  color: active ? "var(--nexio-green)" : "var(--foreground-3)",
                  transition: "color 0.15s",
                }}
              >
                <span className="w-6 h-6 flex items-center justify-center">
                  {icon(active)}
                </span>
                <span
                  className="text-[10px] font-medium"
                  style={{ letterSpacing: "0.01em" }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
