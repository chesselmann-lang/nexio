"use client";

import React, { CSSProperties } from "react";

/* ─── Base ─────────────────────────────────────────────────────────────── */
function Bone({
  w,
  h,
  r = 6,
  style,
}: {
  w: string | number;
  h: string | number;
  r?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      className="skeleton"
      style={{ width: w, height: h, borderRadius: r, flexShrink: 0, ...style }}
    />
  );
}

/* ─── Conversation row ─────────────────────────────────────────────────── */
function ConversationRow() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 16px",
      }}
    >
      {/* avatar */}
      <Bone w={54} h={54} r={27} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Bone w="55%" h={14} />
          <Bone w={36} h={11} />
        </div>
        <Bone w="80%" h={12} />
      </div>
    </div>
  );
}

export function ConversationSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <ConversationRow key={i} />
      ))}
    </div>
  );
}

/* ─── Chat message bubbles ─────────────────────────────────────────────── */
function BubbleRow({ own }: { own: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: own ? "flex-end" : "flex-start",
        padding: "6px 16px",
        gap: 8,
        alignItems: "flex-end",
      }}
    >
      {!own && <Bone w={32} h={32} r={16} />}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: "60%" }}>
        <Bone w={own ? "100%" : "80%"} h={36} r={16} />
        {Math.random() > 0.5 && <Bone w="60%" h={32} r={16} />}
      </div>
    </div>
  );
}

export function ChatSkeleton({ bubbles = 10 }: { bubbles?: number }) {
  const pattern = [false, true, false, false, true, true, false, true, false, true];
  return (
    <div style={{ display: "flex", flexDirection: "column", paddingTop: 8 }}>
      {Array.from({ length: bubbles }).map((_, i) => (
        <BubbleRow key={i} own={pattern[i % pattern.length]} />
      ))}
    </div>
  );
}

/* ─── Notification item ────────────────────────────────────────────────── */
function NotifRow() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
      }}
    >
      <Bone w={40} h={40} r={20} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
        <Bone w="70%" h={13} />
        <Bone w="45%" h={11} />
      </div>
    </div>
  );
}

export function NotificationSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <NotifRow key={i} />
      ))}
    </div>
  );
}

/* ─── Story bar ────────────────────────────────────────────────────────── */
export function StoryBarSkeleton({ items = 6 }: { items?: number }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: "10px 16px",
        overflowX: "hidden",
      }}
    >
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
          }}
        >
          <Bone w={54} h={54} r={27} />
          <Bone w={44} h={10} />
        </div>
      ))}
    </div>
  );
}

/* ─── Profile page ─────────────────────────────────────────────────────── */
export function ProfileSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: 24 }}>
      <Bone w={88} h={88} r={44} />
      <Bone w={140} h={18} />
      <Bone w={100} h={13} />
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0" }}>
            <Bone w={20} h={20} r={4} />
            <Bone w="60%" h={14} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Generic list (settings, search results) ──────────────────────────── */
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
          <Bone w={20} h={20} r={4} />
          <Bone w={`${45 + (i * 13) % 35}%`} h={14} />
        </div>
      ))}
    </div>
  );
}
