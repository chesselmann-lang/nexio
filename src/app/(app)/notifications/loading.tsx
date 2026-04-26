import { NotificationSkeleton } from "@/components/ui/Skeleton";

export default function NotificationsLoading() {
  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h1
          className="text-xl font-bold"
          style={{ color: "var(--foreground)", letterSpacing: "-0.3px" }}
        >
          Benachrichtigungen
        </h1>
        {/* "Mark all read" button placeholder */}
        <div
          className="skeleton"
          style={{ width: 80, height: 28, borderRadius: 14 }}
        />
      </div>

      {/* Filter tabs skeleton */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "10px 16px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {[60, 72, 56].map((w, i) => (
          <div
            key={i}
            className="skeleton"
            style={{ width: w, height: 28, borderRadius: 14 }}
          />
        ))}
      </div>

      {/* Notification rows */}
      <div style={{ flex: 1, overflowY: "hidden" }}>
        <NotificationSkeleton rows={8} />
      </div>
    </div>
  );
}
