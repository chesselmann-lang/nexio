import { ConversationSkeleton, StoryBarSkeleton } from "@/components/ui/Skeleton";
import ThemeToggle from "@/components/ThemeToggle";
import { BellIcon, MagnifyingGlassIcon, PencilSquareIcon } from "@heroicons/react/24/outline";

export default function ChatsLoading() {
  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 pt-safe"
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(12px)",
          background: "var(--background)",
        }}
      >
        <h1
          className="text-xl font-bold"
          style={{ color: "var(--foreground)", letterSpacing: "-0.3px" }}
        >
          Chats
        </h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
            }}
          >
            <BellIcon style={{ width: 22, height: 22, color: "var(--foreground-2)" }} />
          </button>
          <button
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
            }}
          >
            <MagnifyingGlassIcon
              style={{ width: 22, height: 22, color: "var(--foreground-2)" }}
            />
          </button>
          <button
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
            }}
          >
            <PencilSquareIcon
              style={{ width: 22, height: 22, color: "var(--nexio-indigo)" }}
            />
          </button>
        </div>
      </div>

      {/* Story bar skeleton */}
      <StoryBarSkeleton items={7} />

      {/* Search bar skeleton */}
      <div style={{ padding: "0 16px 10px" }}>
        <div
          className="skeleton"
          style={{ width: "100%", height: 38, borderRadius: 20 }}
        />
      </div>

      {/* Conversation list skeleton */}
      <div style={{ flex: 1, overflowY: "hidden" }}>
        <ConversationSkeleton rows={9} />
      </div>
    </div>
  );
}
