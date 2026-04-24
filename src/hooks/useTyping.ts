"use client";
import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface TypingUser {
  userId: string;
  displayName: string;
}

interface UseTypingOptions {
  conversationId: string;
  currentUserId: string;
  currentDisplayName: string;
  onTypingChange: (users: TypingUser[]) => void;
}

/**
 * Supabase Presence-based typing indicators.
 * Tracks who is currently typing in a conversation.
 */
export function useTyping({
  conversationId,
  currentUserId,
  currentDisplayName,
  onTypingChange,
}: UseTypingOptions) {
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    const channel = supabase.channel(`typing:${conversationId}`, {
      config: { presence: { key: currentUserId } },
    });
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ displayName: string; typing: boolean }>();
        const typingUsers: TypingUser[] = Object.entries(state)
          .filter(([uid, presenceList]) => {
            const p = (presenceList as Array<{ displayName: string; typing: boolean }>)[0];
            return uid !== currentUserId && p?.typing === true;
          })
          .map(([uid, presenceList]) => ({
            userId: uid,
            displayName: (presenceList as Array<{ displayName: string; typing: boolean }>)[0]?.displayName ?? "Jemand",
          }));
        onTypingChange(typingUsers);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, currentUserId]);

  const sendTyping = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;

    // Broadcast typing = true
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      channel.track({ displayName: currentDisplayName, typing: true });
    }

    // Auto-clear after 2.5s of inactivity
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      channel.track({ displayName: currentDisplayName, typing: false });
    }, 2500);
  }, [currentDisplayName]);

  const clearTyping = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    isTypingRef.current = false;
    channel.track({ displayName: currentDisplayName, typing: false });
  }, [currentDisplayName]);

  return { sendTyping, clearTyping };
}

// ── Typing Indicator UI component ─────────────────────────────────────────────
export function formatTypingText(users: TypingUser[]): string | null {
  if (users.length === 0) return null;
  if (users.length === 1) return `${users[0].displayName} schreibt…`;
  if (users.length === 2) return `${users[0].displayName} und ${users[1].displayName} schreiben…`;
  return `${users[0].displayName} und ${users.length - 1} weitere schreiben…`;
}
