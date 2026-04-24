"use client";
import { useEffect, useRef } from "react";

export interface ContextMenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

interface MessageContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export default function MessageContextMenu({ x, y, items, onClose }: MessageContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    function handle(e: MouseEvent | KeyboardEvent) {
      if (e instanceof KeyboardEvent && e.key !== "Escape") return;
      if (e instanceof MouseEvent && ref.current?.contains(e.target as Node)) return;
      onClose();
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", handle);
    };
  }, [onClose]);

  // Keep menu inside viewport
  const viewW = typeof window !== "undefined" ? window.innerWidth : 400;
  const viewH = typeof window !== "undefined" ? window.innerHeight : 800;
  const menuW = 200;
  const menuH = items.length * 44 + 8;
  const left = Math.min(x, viewW - menuW - 8);
  const top  = Math.min(y, viewH - menuH - 8);

  return (
    <div
      ref={ref}
      className="fixed z-50 rounded-2xl shadow-xl border overflow-hidden"
      style={{
        left,
        top,
        width: menuW,
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => { item.onClick(); onClose(); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors hover:opacity-80 active:opacity-60"
          style={{
            color: item.danger ? "#ef4444" : "var(--foreground)",
            borderBottom: i < items.length - 1 ? "1px solid var(--border)" : "none",
          }}
        >
          <span className="w-4 h-4 flex-none opacity-70">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
}
