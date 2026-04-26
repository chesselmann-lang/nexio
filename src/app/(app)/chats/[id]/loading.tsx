import { ChatSkeleton } from "@/components/ui/Skeleton";
import { ArrowLeftIcon, EllipsisVerticalIcon, PhoneIcon, VideoCameraIcon } from "@heroicons/react/24/outline";

export default function ChatLoading() {
  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "var(--background)" }}
    >
      {/* Chat header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(12px)",
          background: "var(--background)",
        }}
      >
        <button style={{ color: "var(--nexio-indigo)" }}>
          <ArrowLeftIcon style={{ width: 22, height: 22 }} />
        </button>

        {/* Avatar skeleton */}
        <div
          className="skeleton"
          style={{ width: 40, height: 40, borderRadius: 20, flexShrink: 0 }}
        />

        {/* Name + status skeletons */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
          <div className="skeleton" style={{ width: "45%", height: 14, borderRadius: 6 }} />
          <div className="skeleton" style={{ width: "28%", height: 11, borderRadius: 6 }} />
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 4 }}>
          <button style={{ padding: 6 }}>
            <PhoneIcon style={{ width: 22, height: 22, color: "var(--foreground-2)" }} />
          </button>
          <button style={{ padding: 6 }}>
            <VideoCameraIcon style={{ width: 22, height: 22, color: "var(--foreground-2)" }} />
          </button>
          <button style={{ padding: 6 }}>
            <EllipsisVerticalIcon style={{ width: 22, height: 22, color: "var(--foreground-2)" }} />
          </button>
        </div>
      </div>

      {/* Messages skeleton — fills remaining height */}
      <div style={{ flex: 1, overflowY: "hidden", paddingTop: 12 }}>
        <ChatSkeleton bubbles={12} />
      </div>

      {/* Input bar skeleton */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div
          className="skeleton"
          style={{ flex: 1, height: 42, borderRadius: 21 }}
        />
        <div
          className="skeleton"
          style={{ width: 42, height: 42, borderRadius: 21, flexShrink: 0 }}
        />
      </div>
    </div>
  );
}
