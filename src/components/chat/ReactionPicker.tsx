"use client";
import { useState } from "react";

const EMOJI_GROUPS = [
  ["❤️", "😂", "😮", "😢", "🙏", "👍"],
  ["🔥", "🎉", "💯", "⭐", "👏", "🤝"],
];
const ALL_QUICK = EMOJI_GROUPS.flat();

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  currentReactions?: Record<string, string[]>;
  currentUserId: string;
}

export default function ReactionPicker({ onSelect, onClose, currentReactions = {}, currentUserId }: ReactionPickerProps) {
  return (
    <div
      className="rounded-2xl shadow-lg border p-2 flex items-center gap-1"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      onClick={(e) => e.stopPropagation()}
    >
      {ALL_QUICK.map((emoji) => {
        const users = currentReactions[emoji] ?? [];
        const hasReacted = users.includes(currentUserId);
        return (
          <button
            key={emoji}
            onClick={() => { onSelect(emoji); onClose(); }}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-xl transition-transform active:scale-90"
            style={{ background: hasReacted ? "var(--nexio-green-light)" : "transparent" }}
            title={users.length > 0 ? `${users.length} Reaktion${users.length > 1 ? "en" : ""}` : undefined}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
}

// ── Inline Reaction Bar (shown below a message) ──────────────────────────────

interface ReactionBarProps {
  reactions: Record<string, string[]>;
  currentUserId: string;
  onToggle: (emoji: string) => void;
}

export function ReactionBar({ reactions, currentUserId, onToggle }: ReactionBarProps) {
  const entries = Object.entries(reactions).filter(([, users]) => users.length > 0);
  if (!entries.length) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1 px-1">
      {entries.map(([emoji, users]) => {
        const hasReacted = users.includes(currentUserId);
        return (
          <button
            key={emoji}
            onClick={() => onToggle(emoji)}
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border transition-colors"
            style={{
              background: hasReacted ? "var(--nexio-green-light)" : "var(--surface-2)",
              borderColor: hasReacted ? "var(--nexio-green)" : "var(--border)",
              color: hasReacted ? "var(--nexio-green)" : "var(--foreground-2)",
            }}
          >
            <span>{emoji}</span>
            <span className="font-semibold">{users.length}</span>
          </button>
        );
      })}
    </div>
  );
}
