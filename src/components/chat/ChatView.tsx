"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { ConversationWithMembers, MessageWithSender, User } from "@/types/database";
import VoiceRecorder from "./VoiceRecorder";
import ReactionPicker, { ReactionBar } from "./ReactionPicker";
import { useTyping, formatTypingText } from "@/hooks/useTyping";
import CallView from "@/components/calls/CallView";

// ── Media Picker Sheet ────────────────────────────────────────────────────────
function MediaPickerSheet({
  onClose,
  onImage,
  onVideo,
  onFile,
  onLocation,
}: {
  onClose: () => void;
  onImage: () => void;
  onVideo: () => void;
  onFile: () => void;
  onLocation: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div
        className="absolute bottom-0 left-0 right-0 rounded-t-3xl pb-safe"
        style={{ background: "var(--surface)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-4" style={{ background: "var(--border)" }} />
        <p className="text-xs font-semibold uppercase tracking-wider text-center mb-4" style={{ color: "var(--foreground-3)" }}>Medien senden</p>
        <div className="grid grid-cols-4 gap-4 px-6 pb-8">
          {[
            { icon: "🖼", label: "Galerie", action: onImage, bg: "#1677ff20", color: "#1677ff" },
            { icon: "🎥", label: "Video", action: onVideo, bg: "#9333ea20", color: "#9333ea" },
            { icon: "📄", label: "Dokument", action: onFile, bg: "#f59e0b20", color: "#f59e0b" },
            { icon: "📍", label: "Standort", action: onLocation, bg: "#07c16020", color: "#07c160" },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => { item.action(); onClose(); }}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: item.bg }}>
                {item.icon}
              </div>
              <span className="text-xs" style={{ color: "var(--foreground-2)" }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Image Fullscreen Viewer ───────────────────────────────────────────────────
function ImageViewer({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.92)" }}
      onClick={onClose}
    >
      <button className="absolute top-4 right-4 text-white text-3xl opacity-70">✕</button>
      <img
        src={url}
        alt="Vollbild"
        className="max-w-full max-h-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ── Upload Progress Overlay ───────────────────────────────────────────────────
function UploadProgress({ progress }: { progress: number }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <div className="flex-1 rounded-full overflow-hidden h-1" style={{ background: "var(--border)" }}>
        <div className="h-1 rounded-full transition-all" style={{ width: `${progress}%`, background: "var(--nexio-green)" }} />
      </div>
      <span className="text-xs" style={{ color: "var(--foreground-3)" }}>{progress}%</span>
    </div>
  );
}

// ── Media Upload Helper ───────────────────────────────────────────────────────
async function uploadMedia(
  supabase: ReturnType<typeof createClient>,
  file: File,
  conversationId: string
) {
  const ext = file.name.split(".").pop();
  const path = `${conversationId}/${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage
    .from("nexio-media")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from("nexio-media").getPublicUrl(data.path);
  return urlData.publicUrl;
}

function getConversationName(conv: ConversationWithMembers, currentUserId: string): string {
  if (conv.name) return conv.name;
  const other = conv.members?.find((m) => m.user_id !== currentUserId);
  return (other?.user as User)?.display_name ?? "Chat";
}

function shouldShowDate(msgs: MessageWithSender[], idx: number): boolean {
  if (idx === 0) return true;
  const prev = new Date(msgs[idx - 1].created_at);
  const curr = new Date(msgs[idx].created_at);
  return prev.toDateString() !== curr.toDateString();
}

function DateDivider({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-2 my-3 px-4">
      <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      <span
        className="text-xs px-2 py-0.5 rounded-full"
        style={{ background: "var(--surface-2)", color: "var(--foreground-3)" }}
      >
        {format(new Date(date), "d. MMMM yyyy", { locale: de })}
      </span>
      <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-end gap-2 px-3 mb-1">
      <div className="w-8 h-8 flex-none" />
      <div
        className="px-3 py-2 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1"
        style={{ background: "var(--surface-2)" }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: "var(--foreground-3)",
              animation: `typingBounce 1.2s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
        <style>{`
          @keyframes typingBounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-4px); }
          }
        `}</style>
      </div>
    </div>
  );
}

function formatDur(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

const TRANSLATE_LANGS = [
  { code: "de", label: "DE 🇩🇪" }, { code: "en", label: "EN 🇬🇧" },
  { code: "es", label: "ES 🇪🇸" }, { code: "fr", label: "FR 🇫🇷" },
  { code: "zh", label: "ZH 🇨🇳" }, { code: "ja", label: "JA 🇯🇵" },
  { code: "ar", label: "AR 🇸🇦" }, { code: "tr", label: "TR 🇹🇷" },
];

function TranslateButton({ msgId, text }: { msgId: string; text: string }) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("en");
  const [translation, setTranslation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function translate(targetLang: string) {
    setLang(targetLang);
    setLoading(true);
    setTranslation(null);
    try {
      const res = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: msgId, text, targetLang }),
      });
      const data = await res.json();
      setTranslation(data.translation ?? null);
    } catch { setTranslation("Übersetzung fehlgeschlagen"); }
    setLoading(false);
  }

  return (
    <div className="mt-1">
      {!open ? (
        <button
          onClick={() => { setOpen(true); translate(lang); }}
          className="text-[10px] px-2 py-0.5 rounded-full"
          style={{ color: "var(--foreground-3)", background: "var(--surface-2)" }}
        >
          🌐 Übersetzen
        </button>
      ) : (
        <div className="space-y-1">
          {/* Language selector */}
          <div className="flex gap-1 flex-wrap">
            {TRANSLATE_LANGS.map((l) => (
              <button key={l.code} onClick={() => translate(l.code)}
                className="text-[10px] px-1.5 py-0.5 rounded-full transition-colors"
                style={{
                  background: lang === l.code ? "var(--nexio-green)" : "var(--surface-2)",
                  color: lang === l.code ? "white" : "var(--foreground-3)",
                }}>
                {l.label}
              </button>
            ))}
            <button onClick={() => { setOpen(false); setTranslation(null); }}
              className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{ background: "var(--surface-2)", color: "var(--foreground-3)" }}>✕</button>
          </div>
          {/* Translation */}
          {loading && <p className="text-xs italic" style={{ color: "var(--foreground-3)" }}>Übersetze…</p>}
          {translation && !loading && (
            <div className="text-xs px-2 py-1 rounded-xl italic"
              style={{ background: "var(--surface-2)", color: "var(--foreground-2)" }}>
              {translation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MessageBubble({
  msg,
  isOwn,
  showAvatar,
  currentUserId,
  onReact,
  onImageClick,
}: {
  msg: MessageWithSender;
  isOwn: boolean;
  showAvatar: boolean;
  currentUserId: string;
  onReact: (msgId: string, emoji: string) => void;
  onImageClick: (url: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} px-3 mb-1`}>
      <div className={`flex items-end gap-2 w-full ${isOwn ? "flex-row-reverse" : ""}`}>
        {/* Avatar */}
        <div className="w-8 h-8 flex-none">
          {!isOwn && showAvatar && (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
              style={{ background: "#07c160" }}
            >
              {msg.sender?.display_name?.slice(0, 1) ?? "?"}
            </div>
          )}
        </div>

        {/* Bubble + long-press reaction */}
        <div className="relative max-w-[72%]">
          <div
            className={`${isOwn ? "bubble-sent" : "bubble-received"} px-3 py-2 shadow-sm`}
            onDoubleClick={() => setShowPicker((v) => !v)}
          >
            {/* System message */}
            {msg.type === "system" && (
              <p className="text-xs text-center opacity-60">{msg.content}</p>
            )}

            {/* Text */}
            {msg.type === "text" && (
              <>
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {msg.content}
                </p>
                {msg.content && msg.content.length > 5 && !msg.content.startsWith("📍") && (
                  <TranslateButton msgId={msg.id} text={msg.content} />
                )}
              </>
            )}

            {/* Image */}
            {msg.type === "image" && msg.media_url && (
              <img
                src={msg.media_url}
                alt="Bild"
                className="rounded-lg max-w-full max-h-64 object-cover cursor-pointer active:opacity-80"
                onClick={() => onImageClick(msg.media_url!)}
              />
            )}

            {/* Video */}
            {msg.type === "video" && msg.media_url && (
              <video
                src={msg.media_url}
                controls
                className="rounded-lg max-w-full max-h-64"
              />
            )}

            {/* Audio / Voice */}
            {msg.type === "audio" && msg.media_url && (
              <div className="flex items-center gap-2 min-w-[160px]">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-none"
                  style={{ background: isOwn ? "rgba(255,255,255,0.2)" : "var(--nexio-green)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="white" fill="none" strokeWidth="2" />
                  </svg>
                </div>
                <div className="flex-1">
                  <audio src={msg.media_url} controls className="h-7 w-full" style={{ maxWidth: 160 }} />
                  {(msg.media_metadata as any)?.duration && (
                    <p className="text-[10px] mt-0.5 opacity-60">
                      🎙 {formatDur((msg.media_metadata as any).duration)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* File */}
            {msg.type === "file" && (
              <a
                href={msg.media_url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm underline"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                {(msg.media_metadata as any)?.name ?? "Datei"}
              </a>
            )}

            {/* Timestamp + read receipt */}
            <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
              <span className="text-[10px] opacity-50">
                {format(new Date(msg.created_at), "HH:mm")}
              </span>
              {isOwn && (
                <svg
                  width="14"
                  height="8"
                  viewBox="0 0 18 10"
                  fill="none"
                  className="opacity-60"
                >
                  {/* Double check mark */}
                  <path d="M1 5l4 4 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6 5l4 4 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </div>

          {/* Reaction Picker (double-tap) */}
          {showPicker && (
            <div
              className={`absolute z-20 bottom-full mb-1 ${isOwn ? "right-0" : "left-0"}`}
            >
              <ReactionPicker
                onSelect={(emoji) => onReact(msg.id, emoji)}
                onClose={() => setShowPicker(false)}
                currentReactions={(msg.reactions as Record<string, string[]>) ?? {}}
                currentUserId={currentUserId}
              />
            </div>
          )}
        </div>
      </div>

      {/* Reaction Bar below bubble */}
      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
        <div className={`ml-10 mr-0 mt-0.5 ${isOwn ? "mr-10 ml-0" : ""}`}>
          <ReactionBar
            reactions={(msg.reactions as Record<string, string[]>) ?? {}}
            currentUserId={currentUserId}
            onToggle={(emoji) => onReact(msg.id, emoji)}
          />
        </div>
      )}
    </div>
  );
}

// ── Main ChatView ─────────────────────────────────────────────────────────────
export default function ChatView({
  conversation,
  initialMessages,
  currentUserId,
  currentDisplayName,
}: {
  conversation: ConversationWithMembers;
  initialMessages: MessageWithSender[];
  currentUserId: string;
  currentDisplayName?: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ userId: string; displayName: string }[]>([]);
  const [activeCall, setActiveCall] = useState<{ type: "audio" | "video"; roomName: string } | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const name = getConversationName(conversation, currentUserId);

  // Typing indicators via Supabase Presence
  const { sendTyping, clearTyping } = useTyping({
    conversationId: conversation.id,
    currentUserId,
    currentDisplayName: currentDisplayName ?? "Ich",
    onTypingChange: setTypingUsers,
  });

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);

  useEffect(() => { scrollToBottom(false); }, []);
  useEffect(() => { scrollToBottom(true); }, [messages.length, typingUsers.length]);

  // Realtime subscription for new messages + reaction updates
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        async (payload) => {
          if (payload.new.sender_id === currentUserId) return;
          const { data: sender } = await supabase
            .from("users")
            .select("id, display_name, avatar_url")
            .eq("id", payload.new.sender_id)
            .single();
          setMessages((prev) => [...prev, { ...payload.new, sender } as MessageWithSender]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === payload.new.id ? { ...m, ...payload.new } : m
            )
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversation.id, currentUserId]);

  // ── React to message ──────────────────────────────────────────────────────
  async function handleReact(msgId: string, emoji: string) {
    const msg = messages.find((m) => m.id === msgId);
    if (!msg) return;

    const reactions = { ...((msg.reactions as Record<string, string[]>) ?? {}) };
    const users = reactions[emoji] ?? [];
    const hasReacted = users.includes(currentUserId);

    if (hasReacted) {
      reactions[emoji] = users.filter((u) => u !== currentUserId);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      reactions[emoji] = [...users, currentUserId];
    }

    // Optimistic update
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, reactions } : m))
    );

    await supabase.from("messages").update({ reactions }).eq("id", msgId);
  }

  // ── Send voice message ────────────────────────────────────────────────────
  async function handleVoiceSend(blob: Blob, duration: number) {
    setShowVoice(false);
    setSending(true);
    setUploadProgress(10);
    try {
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
      const blobUrl = URL.createObjectURL(blob);

      const optimistic: MessageWithSender = {
        id: `tmp-${Date.now()}`,
        conversation_id: conversation.id,
        sender_id: currentUserId,
        type: "audio",
        content: null,
        media_url: blobUrl,
        media_metadata: { duration } as any,
        reply_to_id: null,
        reactions: {},
        is_deleted: false,
        deleted_at: null,
        edited_at: null,
        created_at: new Date().toISOString(),
        sender: { id: currentUserId } as User,
      };
      setMessages((prev) => [...prev, optimistic]);

      setUploadProgress(40);
      const mediaUrl = await uploadMedia(supabase, file, conversation.id);
      setUploadProgress(80);
      const { data } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversation.id,
          sender_id: currentUserId,
          type: "audio",
          media_url: mediaUrl,
          media_metadata: { duration },
        })
        .select()
        .single();

      URL.revokeObjectURL(blobUrl);
      if (data) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimistic.id ? { ...data, sender: optimistic.sender } as MessageWithSender : m
          )
        );
      }
    } catch (e) {
      console.error("Voice upload failed:", e);
    }
    setSending(false);
    setUploadProgress(null);
  }

  // ── Send media file ───────────────────────────────────────────────────────
  async function sendMediaMessage(file: File) {
    setSending(true);
    setUploadProgress(10);
    try {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const type = isImage ? "image" : isVideo ? "video" : "file";
      const blobUrl = URL.createObjectURL(file);

      const optimistic: MessageWithSender = {
        id: `tmp-${Date.now()}`,
        conversation_id: conversation.id,
        sender_id: currentUserId,
        type,
        content: null,
        media_url: blobUrl,
        media_metadata: { size: file.size, name: file.name, mime_type: file.type } as any,
        reply_to_id: null,
        reactions: {},
        is_deleted: false,
        deleted_at: null,
        edited_at: null,
        created_at: new Date().toISOString(),
        sender: { id: currentUserId } as User,
      };
      setMessages((prev) => [...prev, optimistic]);

      setUploadProgress(40);
      const mediaUrl = await uploadMedia(supabase, file, conversation.id);
      setUploadProgress(80);
      const { data } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversation.id,
          sender_id: currentUserId,
          type,
          media_url: mediaUrl,
          media_metadata: { size: file.size, name: file.name, mime_type: file.type },
        })
        .select()
        .single();

      URL.revokeObjectURL(blobUrl);
      if (data) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimistic.id ? { ...data, sender: optimistic.sender } as MessageWithSender : m
          )
        );
      }
    } catch (e) {
      console.error("Media upload failed:", e);
    }
    setSending(false);
    setUploadProgress(null);
  }

  // ── Send text message ─────────────────────────────────────────────────────
  async function sendMessage() {
    if (!text.trim() || sending) return;
    const content = text.trim();
    setText("");
    clearTyping();
    setSending(true);

    const optimistic: MessageWithSender = {
      id: `tmp-${Date.now()}`,
      conversation_id: conversation.id,
      sender_id: currentUserId,
      type: "text",
      content,
      media_url: null,
      media_metadata: null,
      reply_to_id: null,
      reactions: {},
      is_deleted: false,
      deleted_at: null,
      edited_at: null,
      created_at: new Date().toISOString(),
      sender: { id: currentUserId } as User,
    };
    setMessages((prev) => [...prev, optimistic]);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversation.id,
        sender_id: currentUserId,
        type: "text",
        content,
      })
      .select()
      .single();

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setText(content);
    } else {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimistic.id ? { ...data, sender: optimistic.sender } as MessageWithSender : m
        )
      );
    }
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // ── Share location ────────────────────────────────────────────────────────
  async function shareLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      const content = `📍 Standort geteilt\nhttps://maps.google.com/?q=${lat},${lng}`;
      const { data } = await supabase.from("messages").insert({
        conversation_id: conversation.id,
        sender_id: currentUserId,
        type: "text",
        content,
      }).select().single();
      if (data) setMessages((prev) => [...prev, { ...data, sender: { id: currentUserId } as User } as MessageWithSender]);
    }, () => alert("Standort nicht verfügbar"));
  }

  // ── Start a call ──────────────────────────────────────────────────────────
  async function startCall(callType: "audio" | "video") {
    const roomName = `nexio-${conversation.id}-${Date.now()}`;
    // Insert system message to notify other participants
    await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: currentUserId,
      type: "system",
      content: `📞 ${name} hat einen ${callType === "video" ? "Video" : "Sprach"}anruf gestartet`,
      media_metadata: { callType, roomName },
    });
    setActiveCall({ type: callType, roomName });
  }

  const typingText = formatTypingText(typingUsers);

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div
        className="flex-none flex items-center gap-3 px-4 pt-safe border-b"
        style={{
          height: "var(--header-height)",
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center -ml-1"
          style={{ color: "var(--foreground-2)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button
          className="flex-1 min-w-0 text-left"
          onClick={() => conversation.type === "group" && setShowGroupInfo(true)}
        >
          <p className="font-semibold truncate" style={{ color: "var(--foreground)" }}>
            {name}
          </p>
          {typingText ? (
            <p className="text-xs animate-pulse" style={{ color: "var(--nexio-green)" }}>
              {typingText}
            </p>
          ) : (
            <p className="text-xs" style={{ color: "var(--foreground-3)" }}>
              {conversation.type === "group"
                ? `👥 ${conversation.members?.length ?? 1} Mitglieder — tippen für Details`
                : `${conversation.members?.length ?? 1} Mitglied${(conversation.members?.length ?? 1) !== 1 ? "er" : ""}`
              }
            </p>
          )}
        </button>
        {/* Call buttons */}
        <button
          onClick={() => startCall("audio")}
          className="w-8 h-8 flex items-center justify-center"
          style={{ color: "var(--foreground-2)" }}
          title="Sprachanruf"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6.29 6.29l.87-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </button>
        <button
          onClick={() => startCall("video")}
          className="w-8 h-8 flex items-center justify-center"
          style={{ color: "var(--foreground-2)" }}
          title="Videoanruf"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-2">
        {messages.map((msg, idx) => (
          <div key={msg.id}>
            {shouldShowDate(messages, idx) && <DateDivider date={msg.created_at} />}
            <MessageBubble
              msg={msg}
              isOwn={msg.sender_id === currentUserId}
              showAvatar={idx === 0 || messages[idx - 1].sender_id !== msg.sender_id}
              currentUserId={currentUserId}
              onReact={handleReact}
              onImageClick={setLightboxUrl}
            />
          </div>
        ))}
        {typingUsers.length > 0 && <TypingDots />}
        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Voice Recorder (replaces input bar) */}
      {showVoice ? (
        <div
          className="flex-none border-t pb-safe"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <VoiceRecorder
            onSend={handleVoiceSend}
            onCancel={() => setShowVoice(false)}
          />
        </div>
      ) : (
        /* Input Bar */
        <div
          className="flex-none flex items-end gap-2 px-3 py-2 pb-safe border-t"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          {/* Hidden file inputs */}
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) sendMediaMessage(f); e.target.value = ""; }} />
          <input ref={videoInputRef} type="file" accept="video/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) sendMediaMessage(f); e.target.value = ""; }} />
          <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) sendMediaMessage(f); e.target.value = ""; }} />

          {/* Attachment — opens media picker */}
          <button
            onClick={() => setShowMediaPicker(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full mb-0.5"
            style={{ color: "var(--foreground-3)" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </button>

          {/* Text input */}
          <div
            className="flex-1 rounded-2xl border px-3 py-2"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
          >
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                if (e.target.value.trim()) sendTyping();
              }}
              onKeyDown={handleKeyDown}
              onBlur={clearTyping}
              placeholder="Nachricht schreiben…"
              rows={1}
              className="w-full resize-none bg-transparent text-sm leading-5 focus:outline-none"
              style={{ color: "var(--foreground)", maxHeight: "120px" }}
            />
          </div>

          {/* Send / Voice */}
          {text.trim() ? (
            <button
              onClick={sendMessage}
              disabled={sending}
              className="w-9 h-9 rounded-full flex items-center justify-center flex-none mb-0.5 disabled:opacity-50"
              style={{ background: "var(--nexio-green)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => setShowVoice(true)}
              className="w-9 h-9 flex items-center justify-center mb-0.5"
              style={{ color: "var(--foreground-3)" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Call overlay — full screen modal */}
      {activeCall && (
        <div className="fixed inset-0 z-50" style={{ background: "var(--background)" }}>
          <CallView
            roomName={activeCall.roomName}
            callType={activeCall.type}
            participantName={currentDisplayName ?? "Ich"}
            conversationName={name}
            onLeave={() => setActiveCall(null)}
          />
        </div>
      )}

      {/* Media Picker Sheet */}
      {showMediaPicker && (
        <MediaPickerSheet
          onClose={() => setShowMediaPicker(false)}
          onImage={() => fileInputRef.current?.click()}
          onVideo={() => videoInputRef.current?.click()}
          onFile={() => docInputRef.current?.click()}
          onLocation={shareLocation}
        />
      )}

      {/* Image Lightbox */}
      {lightboxUrl && (
        <ImageViewer url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}

      {/* Group Info Sheet */}
      {showGroupInfo && conversation.type === "group" && (
        <div className="fixed inset-0 z-40" onClick={() => setShowGroupInfo(false)}>
          <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl pb-safe max-h-[70vh] overflow-hidden flex flex-col"
            style={{ background: "var(--surface)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-2" style={{ background: "var(--border)" }} />
            <div className="px-4 pb-2 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold text-base" style={{ color: "var(--foreground)" }}>{name}</h3>
              <p className="text-sm" style={{ color: "var(--foreground-3)" }}>
                {conversation.members?.length ?? 0} Mitglieder · max. 500
              </p>
            </div>
            <div className="overflow-y-auto flex-1">
              {(conversation.members ?? []).map((m: any) => {
                const u: User = m.user as User;
                if (!u) return null;
                return (
                  <div key={m.user_id} className="flex items-center gap-3 px-4 py-3 border-b"
                    style={{ borderColor: "var(--border)" }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-none"
                      style={{ background: "#07c160" }}>
                      {u.display_name?.slice(0, 1) ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                        {u.display_name}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--foreground-3)" }}>
                        @{u.username} {m.role === "owner" ? "· 👑 Admin" : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-4 py-3">
              <button
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.from("conversation_members")
                    .delete().eq("conversation_id", conversation.id).eq("user_id", currentUserId);
                  router.replace("/chats");
                }}
                className="w-full py-3 rounded-2xl text-sm font-semibold text-red-500"
                style={{ background: "var(--surface-2)" }}
              >
                Gruppe verlassen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress Bar */}
      {uploadProgress !== null && (
        <div className="fixed bottom-24 left-4 right-4 z-40 rounded-2xl px-4 py-2"
          style={{ background: "var(--surface)", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--foreground-2)" }}>Hochladen…</p>
          <UploadProgress progress={uploadProgress} />
        </div>
      )}
    </div>
  );
}
