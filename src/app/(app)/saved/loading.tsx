import { ListSkeleton } from "@/components/ui/Skeleton";
import { BookmarkIcon } from "@heroicons/react/24/solid";

export default function SavedLoading() {
  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            background: "var(--nexio-indigo)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BookmarkIcon style={{ width: 18, height: 18, color: "#fff" }} />
        </div>
        <div className="skeleton" style={{ width: 180, height: 16, borderRadius: 6 }} />
      </div>
      <div style={{ flex: 1 }}>
        <ListSkeleton rows={8} />
      </div>
    </div>
  );
}
