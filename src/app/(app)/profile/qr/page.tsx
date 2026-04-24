"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import QRCode from "@/components/QRCode";

export default function ProfileQRPage() {
  const router = useRouter();
  const supabase = createClient();

  const [username, setUsername] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return router.push("/login");
      const { data: profile } = await supabase
        .from("users")
        .select("username, display_name, avatar_url")
        .eq("id", data.user.id)
        .single();
      if (profile) {
        setUsername(profile.username);
        setDisplayName(profile.display_name);
        setAvatarUrl(profile.avatar_url ?? null);
      }
    });
  }, []);

  const nexioLink = username ? `nexio://add/${username}` : "";
  const webLink = username ? `https://nexio-jet.vercel.app/u/${username}` : "";

  async function copyLink() {
    if (!webLink) return;
    await navigator.clipboard.writeText(webLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const initials = displayName?.slice(0, 2).toUpperCase() ?? "?";

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <header className="sticky top-0 z-10 px-4 py-3 border-b flex items-center gap-3"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <button onClick={() => router.back()} style={{ color: "var(--foreground-3)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-base font-semibold flex-1" style={{ color: "var(--foreground)" }}>Mein QR-Code</h1>
      </header>

      <div className="max-w-sm mx-auto px-4 py-8 flex flex-col items-center gap-6">
        {/* Profile mini */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-2xl font-bold text-white flex-none"
            style={{ background: "var(--nexio-green)" }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              : initials}
          </div>
          <p className="font-bold text-lg" style={{ color: "var(--foreground)" }}>{displayName ?? "…"}</p>
          <p className="text-sm" style={{ color: "var(--foreground-3)" }}>@{username ?? "…"}</p>
        </div>

        {/* QR Card */}
        <div className="rounded-3xl p-6 shadow-sm flex flex-col items-center gap-4"
          style={{ background: "var(--surface)" }}>
          {nexioLink ? (
            <QRCode value={nexioLink} size={220} color="#07c160" />
          ) : (
            <div className="w-[220px] h-[220px] rounded-xl flex items-center justify-center"
              style={{ background: "var(--background)" }}>
              <span className="text-3xl">⏳</span>
            </div>
          )}
          <p className="text-xs text-center" style={{ color: "var(--foreground-3)" }}>
            Zum Hinzufügen als Kontakt scannen
          </p>
        </div>

        {/* Actions */}
        <div className="w-full space-y-3">
          <button onClick={copyLink}
            className="w-full py-3 rounded-2xl text-sm font-semibold"
            style={{ background: "var(--nexio-green)", color: "#fff" }}>
            {copied ? "✅ Link kopiert!" : "🔗 Profil-Link kopieren"}
          </button>
        </div>

        {/* Links */}
        {webLink && (
          <div className="w-full px-4 py-3 rounded-2xl text-xs text-center break-all"
            style={{ background: "var(--surface)", color: "var(--foreground-3)" }}>
            {webLink}
          </div>
        )}

        {nexioLink && (
          <p className="text-xs text-center font-mono" style={{ color: "var(--foreground-3)" }}>
            {nexioLink}
          </p>
        )}
      </div>
    </div>
  );
}
