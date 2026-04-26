"use client";
import Link from "next/link";

interface StoryUser {
  id: string;
  display_name: string;
  avatar_url: string | null;
  hasStory: boolean;
  seen: boolean;
  isOwn?: boolean;
}

function StoryRing({ user, size = 56 }: { user: StoryUser; size?: number }) {
  const initials = user.display_name.slice(0, 2).toUpperCase();
  const colors = ["#7c5cfc", "#07c160", "#1677ff", "#f59e0b", "#ef4444"];
  const color = colors[user.display_name.charCodeAt(0) % colors.length];

  const avatar = user.avatar_url ? (
    <img src={user.avatar_url} alt={user.display_name} width={size} height={size}
      className="rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <div className="rounded-full flex items-center justify-center text-white font-semibold"
      style={{ width: size, height: size, background: color, fontSize: size * 0.3, flexShrink: 0 }}>
      {initials}
    </div>
  );

  const ringStyle = user.hasStory && !user.seen
    ? "linear-gradient(135deg, #7c5cfc 0%, #07c160 100%)"
    : user.hasStory && user.seen
    ? "linear-gradient(135deg, #50546a 0%, #282d3c 100%)"
    : "none";

  return (
    <div className="flex flex-col items-center gap-1.5 flex-none">
      <div style={{ padding: user.hasStory ? 2 : 0, borderRadius: "50%", background: ringStyle, display: "inline-flex" }}>
        <div style={{ background: "var(--background)", borderRadius: "50%", padding: user.hasStory ? 2 : 0, display: "inline-flex" }}>
          {avatar}
        </div>
      </div>
      <span className="text-[10px] truncate max-w-[60px] text-center" style={{ color: "var(--foreground-3)" }}>
        {user.isOwn ? "Meine Story" : user.display_name.split(" ")[0]}
      </span>
    </div>
  );
}

export default function StoryBar({ users }: { users: StoryUser[] }) {
  if (!users.length) return null;
  return (
    <div className="flex-none border-b" style={{ borderColor: "var(--border)", background: "var(--background)" }}>
      <div className="flex gap-4 overflow-x-auto px-4 py-3" style={{ scrollbarWidth: "none" }}>
        {users.map((u) => (
          <Link key={u.id} href={u.isOwn ? "/social/create" : `/social/story/${u.id}`}
            className="flex-none active:opacity-70 transition-opacity">
            <StoryRing user={u} />
          </Link>
        ))}
      </div>
    </div>
  );
}
