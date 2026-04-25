"use client";
/**
 * IncomingCallBanner — listens for call-system messages in all conversations
 * the user is part of, shows a ringing overlay.
 */
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import CallView from "./CallView";

interface IncomingCall {
  roomName: string;
  callType: "audio" | "video";
  callerName: string;
  conversationName: string;
  messageId: string;
}

export default function IncomingCallBanner({
  currentUserId,
  displayName,
}: {
  currentUserId: string;
  displayName: string;
}) {
  const supabase = createClient();
  const [incoming, setIncoming] = useState<IncomingCall | null>(null);
  const [activeCall, setActiveCall] = useState<IncomingCall | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play a simple ring tone using Web Audio API
  function startRing() {
    if (typeof window === "undefined") return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ring = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 440;
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      };
      ring();
      const id = setInterval(ring, 1200);
      audioRef.current = { stop: () => clearInterval(id) } as any;
    } catch { /* ignore */ }
  }

  function stopRing() {
    if (audioRef.current) {
      (audioRef.current as any).stop?.();
      audioRef.current = null;
    }
  }

  useEffect(() => {
    // Subscribe to system messages across all conversations the user is in
    const channel = supabase
      .channel(`incoming-calls:${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `type=eq.system`,
        },
        async (payload) => {
          const msg = payload.new;
          const meta = msg.media_metadata as any;
          if (!meta?.callType || !meta?.roomName) return;
          if (msg.sender_id === currentUserId) return; // don't ring for own calls

          // Check if this user is a member of the conversation
          const { data: membership } = await supabase
            .from("conversation_members")
            .select("user_id")
            .eq("conversation_id", msg.conversation_id)
            .eq("user_id", currentUserId)
            .single();

          if (!membership) return;

          // Fetch conversation name + caller name
          const { data: conv } = await supabase
            .from("conversations")
            .select("name, members:conversation_members(user_id, user:users(display_name))")
            .eq("id", msg.conversation_id)
            .single();

          const callerMember = (conv?.members as any[])?.find((m: any) => m.user_id === msg.sender_id);
          const callerName = callerMember?.user?.display_name ?? "Jemand";
          const convName = conv?.name ?? callerName;

          setIncoming({
            roomName: meta.roomName,
            callType: meta.callType,
            callerName,
            conversationName: convName,
            messageId: msg.id,
          });
          startRing();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId]);

  // Auto-dismiss after 30s
  useEffect(() => {
    if (!incoming) return;
    const t = setTimeout(() => { setIncoming(null); stopRing(); }, 30000);
    return () => clearTimeout(t);
  }, [incoming]);

  function accept() {
    stopRing();
    setActiveCall(incoming);
    setIncoming(null);
  }

  function decline() {
    stopRing();
    setIncoming(null);
  }

  if (activeCall) {
    return (
      <div className="fixed inset-0 z-50">
        <CallView
          roomName={activeCall.roomName}
          callType={activeCall.callType}
          participantName={displayName}
          conversationName={activeCall.conversationName}
          onLeave={() => setActiveCall(null)}
        />
      </div>
    );
  }

  if (!incoming) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 px-4 pt-safe pb-2" style={{ paddingTop: "env(safe-area-inset-top, 16px)" }}>
      <div className="rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: "rgba(20,20,30,0.96)", backdropFilter: "blur(20px)" }}>
        <div className="px-5 py-4">
          {/* Pulse ring */}
          <div className="flex items-center gap-4">
            <div className="relative flex-none">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                style={{ background: "#07c160" }}>
                {incoming.callType === "video" ? "📹" : "📞"}
              </div>
              <div className="absolute inset-0 rounded-full animate-ping opacity-30"
                style={{ background: "#07c160" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-base leading-tight">{incoming.callerName}</p>
              <p className="text-white/60 text-sm">
                Eingehender {incoming.callType === "video" ? "Video" : "Sprach"}anruf
              </p>
              {incoming.conversationName !== incoming.callerName && (
                <p className="text-white/40 text-xs mt-0.5">aus: {incoming.conversationName}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            <button onClick={decline}
              className="flex-1 py-3 rounded-2xl text-sm font-bold text-white"
              style={{ background: "#ef4444" }}>
              📵 Ablehnen
            </button>
            <button onClick={accept}
              className="flex-1 py-3 rounded-2xl text-sm font-bold text-white"
              style={{ background: "#07c160" }}>
              {incoming.callType === "video" ? "📹" : "📞"} Annehmen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
