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
import UserActionsMenu from "@/components/UserActionsMenu";
import { useE2E } from "@/lib/e2e/useE2E";

// ── Media Picker Sheet ────────────────────────────────────────────────────────
function MediaPickerSheet({
  onClose,
  onImage,
  onVideo,
  onFile,
  onLocation,
  onPoll,
}: {
  onClose: () => void;
  onImage: () => void;
  onVideo: () => void;
  onFile: () => void;
  onLocation: () => void;
  onPoll: () => void;
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
            { icon: "📊", label: "Umfrage", action: onPoll, bg: "#ef444420", color: "#ef4444" },
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
  onLongPress,
  quotedMsg,
  isRead,
}: {
  msg: MessageWithSender;
  isOwn: boolean;
  showAvatar: boolean;
  currentUserId: string;
  onReact: (msgId: string, emoji: string) => void;
  onImageClick: (url: string) => void;
  onLongPress: (msg: MessageWithSender, y: number) => void;
  quotedMsg?: { content: string | null; senderName?: string } | null;
  isRead?: boolean;
  poll?: PollData | null;
  onVote?: (pollId: string, optionIdx: number) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [imgDescription, setImgDescription] = useState<string | null>(null);
  const [descLoading, setDescLoading] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0];
    const y = touch.clientY;
    longPressTimer.current = setTimeout(() => onLongPress(msg, y), 500);
  }
  function handleTouchEnd() {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  }

  async function describeImage() {
    if (!msg.media_url) return;
    setDescLoading(true);
    try {
      const res = await fetch("/api/ai/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: msg.media_url }),
      });
      const data = await res.json();
      setImgDescription(data.description ?? "Keine Beschreibung verfügbar");
    } catch { setImgDescription("Fehler beim Laden"); }
    setDescLoading(false);
  }

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
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchEnd}
            onContextMenu={(e) => { e.preventDefault(); onLongPress(msg, e.clientY); }}
          >
            {/* Quoted reply */}
            {quotedMsg && <QuotedMsg content={quotedMsg.content} senderName={quotedMsg.senderName} />}

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
              <div>
                <img
                  src={msg.media_url}
                  alt="Bild"
                  className="rounded-lg max-w-full max-h-64 object-cover cursor-pointer active:opacity-80"
                  onClick={() => onImageClick(msg.media_url!)}
                />
                {imgDescription ? (
                  <p className="text-xs mt-1 opacity-80 italic">{imgDescription}</p>
                ) : (
                  <button onClick={describeImage} disabled={descLoading}
                    className="text-[10px] mt-1 px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(0,0,0,0.15)", color: "inherit", opacity: descLoading ? 0.5 : 1 }}>
                    {descLoading ? "✨ Beschreibe…" : "✨ KI-Beschreibung"}
                  </button>
                )}
              </div>
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

            {/* Poll */}
            {msg.type === "poll" && poll && onVote && (
              <PollMessage poll={poll} currentUserId={currentUserId} onVote={onVote} />
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
              {msg.edited_at && (
                <span className="text-[9px] opacity-40 italic">bearbeitet</span>
              )}
              <span className="text-[10px] opacity-50">
                {format(new Date(msg.created_at), "HH:mm")}
              </span>
              {isOwn && (
                <svg
                  width="14"
                  height="8"
                  viewBox="0 0 18 10"
                  fill="none"
                  style={{ color: isRead ? "#07c160" : "currentColor", opacity: isRead ? 1 : 0.6 }}
                >
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

// ── Reply Preview Bar ─────────────────────────────────────────────────────────
function ReplyPreviewBar({ msg, onCancel }: { msg: MessageWithSender; onCancel: () => void }) {
  const preview = msg.content
    ? msg.content.slice(0, 60) + (msg.content.length > 60 ? "…" : "")
    : msg.type === "image" ? "📷 Bild"
    : msg.type === "audio" ? "🎙 Sprachnachricht"
    : msg.type === "video" ? "🎥 Video"
    : "Medieninhalt";
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-t"
      style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
      <div className="w-1 self-stretch rounded-full flex-none" style={{ background: "var(--nexio-green)" }} />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold" style={{ color: "var(--nexio-green)" }}>
          {msg.sender?.display_name ?? "Nachricht"}
        </p>
        <p className="text-xs truncate" style={{ color: "var(--foreground-3)" }}>{preview}</p>
      </div>
      <button onClick={onCancel} className="flex-none text-lg leading-none" style={{ color: "var(--foreground-3)" }}>✕</button>
    </div>
  );
}

// ── Quoted Message Snippet ────────────────────────────────────────────────────
function QuotedMsg({ content, senderName }: { content: string | null; senderName?: string }) {
  return (
    <div className="flex gap-1.5 mb-1.5 rounded-xl overflow-hidden"
      style={{ background: "rgba(0,0,0,0.08)" }}>
      <div className="w-0.5 flex-none" style={{ background: "var(--nexio-green)" }} />
      <div className="flex-1 min-w-0 py-1.5 pr-2">
        {senderName && <p className="text-[10px] font-semibold" style={{ color: "var(--nexio-green)" }}>{senderName}</p>}
        <p className="text-xs truncate opacity-70">{content ?? "🖼 Medieninhalt"}</p>
      </div>
    </div>
  );
}

// ── Message Context Menu ──────────────────────────────────────────────────────
function MsgContextMenu({
  msg,
  isOwn,
  posY,
  onClose,
  onPin,
  onForward,
  onCopy,
  onDelete,
  onReply,
  onEdit,
}: {
  msg: MessageWithSender;
  isOwn: boolean;
  posY: number;
  onClose: () => void;
  onPin: () => void;
  onForward: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onReply: () => void;
  onEdit: () => void;
}) {
  const items = [
    { label: "Antworten", icon: "↩️", action: onReply, danger: false },
    { label: "Kopieren", icon: "📋", action: onCopy, danger: false },
    { label: "Weiterleiten", icon: "↪️", action: onForward, danger: false },
    { label: "Anpinnen", icon: "📌", action: onPin, danger: false },
    ...(isOwn && msg.type === "text" ? [{ label: "Bearbeiten", icon: "✏️", action: onEdit, danger: false }] : []),
    ...(isOwn ? [{ label: "Löschen", icon: "🗑️", action: onDelete, danger: true }] : []),
  ];
  const showAbove = typeof window !== "undefined" && posY > window.innerHeight * 0.55;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}
      style={{ background: "rgba(0,0,0,0.25)" }}>
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-2xl shadow-2xl overflow-hidden w-52"
        style={{
          background: "var(--surface)",
          ...(showAbove
            ? { bottom: typeof window !== "undefined" ? window.innerHeight - posY + 8 : "40%" }
            : { top: posY + 8 }),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {items.map((item, i) => (
          <button key={item.label}
            onClick={() => { item.action(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-left"
            style={{
              borderBottom: i < items.length - 1 ? "1px solid var(--border)" : "none",
              color: item.danger ? "#ef4444" : "var(--foreground)",
              background: "var(--surface)",
            }}>
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Forward Sheet ─────────────────────────────────────────────────────────────
function ForwardSheet({
  conversations,
  currentUserId,
  onForward,
  onClose,
}: {
  conversations: any[];
  currentUserId: string;
  onForward: (convId: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        className="absolute bottom-0 left-0 right-0 rounded-t-3xl pb-safe max-h-[70vh] flex flex-col"
        style={{ background: "var(--surface)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-2" style={{ background: "var(--border)" }} />
        <p className="px-4 pb-3 text-base font-semibold" style={{ color: "var(--foreground)" }}>
          Weiterleiten an…
        </p>
        <div className="overflow-y-auto flex-1">
          {conversations.length === 0 && (
            <p className="px-4 py-8 text-sm text-center" style={{ color: "var(--foreground-3)" }}>
              Keine Chats gefunden
            </p>
          )}
          {conversations.map((conv: any) => {
            const otherMember = conv.type === "direct"
              ? (conv.members ?? []).find((m: any) => m.user_id !== currentUserId)?.user
              : null;
            const displayName = conv.name ?? (otherMember as any)?.display_name ?? "Chat";
            return (
              <button key={conv.id}
                onClick={() => { onForward(conv.id); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 border-b text-left"
                style={{ borderColor: "var(--border)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-none"
                  style={{ background: "var(--nexio-green)" }}>
                  {conv.type === "group" ? "👥" : ((displayName as string)?.[0]?.toUpperCase() ?? "?")}
                </div>
                <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  {displayName}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Group Info + Admin Sheet ──────────────────────────────────────────────────
function GroupInfoSheet({
  conversation,
  currentUserId,
  name,
  onClose,
  onLeft,
}: {
  conversation: ConversationWithMembers;
  currentUserId: string;
  name: string;
  onClose: () => void;
  onLeft: () => void;
}) {
  const supabase = createClient();
  const [groupName, setGroupName] = useState(name);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  async function generateInviteLink() {
    const res = await fetch(`/api/conversations/${conversation.id}/invite`, { method: "POST" });
    const data = await res.json();
    if (data.token) {
      const link = `${window.location.origin}/join/${data.token}`;
      setInviteLink(link);
    }
  }

  async function copyInviteLink() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  }

  const myRole = (conversation.members ?? []).find((m: any) => m.user_id === currentUserId)?.role;
  const isOwner = myRole === "owner";

  async function renameGroup() {
    if (!groupName.trim()) return;
    setSaving(true);
    await supabase.from("conversations").update({ name: groupName.trim() }).eq("id", conversation.id);
    setSaving(false);
    setEditing(false);
  }

  async function kickMember(userId: string) {
    if (!isOwner || userId === currentUserId) return;
    await supabase.from("conversation_members")
      .delete()
      .eq("conversation_id", conversation.id)
      .eq("user_id", userId);
    // Optimistically remove from local list (full refetch happens on next page load)
    onClose();
  }

  async function leaveGroup() {
    await supabase.from("conversation_members")
      .delete()
      .eq("conversation_id", conversation.id)
      .eq("user_id", currentUserId);
    onLeft();
  }

  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl pb-safe max-h-[80vh] overflow-hidden flex flex-col"
        style={{ background: "var(--surface)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-2" style={{ background: "var(--border)" }} />

        {/* Header */}
        <div className="px-4 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="flex-1 text-base font-bold bg-transparent focus:outline-none border-b"
                style={{ color: "var(--foreground)", borderColor: "var(--nexio-green)" }}
                onKeyDown={(e) => e.key === "Enter" && renameGroup()}
              />
              <button onClick={renameGroup} disabled={saving}
                className="text-sm font-semibold px-3 py-1 rounded-full text-white"
                style={{ background: "var(--nexio-green)" }}>
                {saving ? "…" : "OK"}
              </button>
              <button onClick={() => { setEditing(false); setGroupName(name); }}
                className="text-sm px-2" style={{ color: "var(--foreground-3)" }}>✕</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base flex-1" style={{ color: "var(--foreground)" }}>{groupName}</h3>
              {isOwner && (
                <button onClick={() => setEditing(true)}
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: "var(--background)", color: "var(--foreground-3)" }}>
                  ✏️ Umbenennen
                </button>
              )}
            </div>
          )}
          <p className="text-sm mt-0.5" style={{ color: "var(--foreground-3)" }}>
            {conversation.members?.length ?? 0} Mitglieder · max. 500
            {isOwner && <span className="ml-2 text-xs font-semibold" style={{ color: "var(--nexio-green)" }}>👑 Du bist Admin</span>}
          </p>
        </div>

        {/* Member list */}
        <div className="overflow-y-auto flex-1">
          {(conversation.members ?? []).map((m: any) => {
            const u: User = m.user as User;
            if (!u) return null;
            const isSelf = m.user_id === currentUserId;
            return (
              <div key={m.user_id} className="flex items-center gap-3 px-4 py-3 border-b"
                style={{ borderColor: "var(--border)" }}>
                <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white text-sm font-bold flex-none"
                  style={{ background: "#07c160" }}>
                  {u.avatar_url
                    ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                    : (u.display_name?.slice(0, 1) ?? "?")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                    {u.display_name} {isSelf && <span style={{ color: "var(--foreground-3)" }}>(Du)</span>}
                  </p>
                  <p className="text-xs truncate" style={{ color: "var(--foreground-3)" }}>
                    @{u.username} {m.role === "owner" ? "· 👑 Admin" : ""}
                  </p>
                </div>
                {isOwner && !isSelf && (
                  <button onClick={() => kickMember(m.user_id)}
                    className="text-xs px-2 py-1 rounded-full text-red-500"
                    style={{ background: "rgba(239,68,68,0.1)" }}>
                    Entfernen
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Invite Link */}
        <div className="px-4 py-3 border-t space-y-2" style={{ borderColor: "var(--border)" }}>
          {!inviteLink ? (
            <button onClick={generateInviteLink}
              className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: "var(--surface-2)", color: "var(--nexio-green)" }}>
              🔗 Einladungslink erstellen
            </button>
          ) : (
            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
              <div className="px-3 py-2" style={{ background: "var(--surface-2)" }}>
                <p className="text-[10px] font-semibold mb-0.5" style={{ color: "var(--nexio-green)" }}>Einladungslink</p>
                <p className="text-xs truncate" style={{ color: "var(--foreground-3)" }}>{inviteLink}</p>
              </div>
              <button onClick={copyInviteLink}
                className="w-full py-2.5 text-sm font-semibold border-t"
                style={{ borderColor: "var(--border)", color: copySuccess ? "#07c160" : "var(--foreground)" }}>
                {copySuccess ? "✓ Kopiert!" : "📋 Kopieren"}
              </button>
            </div>
          )}
        </div>

        {/* Leave button */}
        <div className="px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
          <button onClick={leaveGroup}
            className="w-full py-3 rounded-2xl text-sm font-semibold text-red-500"
            style={{ background: "rgba(239,68,68,0.08)" }}>
            Gruppe verlassen
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Poll Message Component ────────────────────────────────────────────────────
interface PollOption { text: string; votes: string[] }
interface PollData {
  id: string;
  question: string;
  options: PollOption[];
  is_multiple_choice: boolean;
  created_by: string;
}

function PollMessage({ poll, currentUserId, onVote }: {
  poll: PollData;
  currentUserId: string;
  onVote: (pollId: string, optionIdx: number) => void;
}) {
  const totalVotes = poll.options.reduce((s, o) => s + o.votes.length, 0);
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold leading-snug">{poll.question}</p>
      {poll.options.map((opt, idx) => {
        const voted = opt.votes.includes(currentUserId);
        const pct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
        return (
          <button key={idx} onClick={() => onVote(poll.id, idx)}
            className="w-full text-left rounded-xl overflow-hidden border transition-all"
            style={{
              borderColor: voted ? "var(--nexio-green)" : "rgba(255,255,255,0.2)",
              background: "rgba(0,0,0,0.08)",
            }}>
            <div className="relative px-3 py-2">
              <div className="absolute inset-0 rounded-xl transition-all"
                style={{ width: `${pct}%`, background: voted ? "#07c16030" : "rgba(255,255,255,0.08)" }} />
              <div className="relative flex items-center justify-between gap-2">
                <span className="text-xs font-medium">{opt.text}</span>
                <span className="text-[10px] opacity-60">{pct}%</span>
              </div>
            </div>
          </button>
        );
      })}
      <p className="text-[10px] opacity-50">{totalVotes} Stimme{totalVotes !== 1 ? "n" : ""} · {poll.is_multiple_choice ? "Mehrfachauswahl" : "Einzelauswahl"}</p>
    </div>
  );
}

// ── Create Poll Sheet ──────────────────────────────────────────────────────────
function CreatePollSheet({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (question: string, options: string[], isMultiple: boolean) => void;
}) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isMultiple, setIsMultiple] = useState(false);

  function addOption() { if (options.length < 10) setOptions([...options, ""]); }
  function removeOption(i: number) { if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i)); }
  function updateOption(i: number, v: string) { setOptions(options.map((o, idx) => idx === i ? v : o)); }

  function submit() {
    const validOpts = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim() || validOpts.length < 2) return;
    onSubmit(question.trim(), validOpts, isMultiple);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl pb-safe max-h-[80vh] overflow-y-auto"
        style={{ background: "var(--surface)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-4" style={{ background: "var(--border)" }} />
        <div className="px-4 pb-4 space-y-4">
          <h3 className="text-base font-bold" style={{ color: "var(--foreground)" }}>📊 Umfrage erstellen</h3>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Frage eingeben…"
            className="w-full rounded-2xl px-4 py-3 text-sm border focus:outline-none"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)" }}
          />
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 rounded-2xl px-4 py-2.5 text-sm border focus:outline-none"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)" }}
                />
                {options.length > 2 && (
                  <button onClick={() => removeOption(i)} className="text-red-500 text-lg">✕</button>
                )}
              </div>
            ))}
            {options.length < 10 && (
              <button onClick={addOption} className="text-sm font-medium"
                style={{ color: "var(--nexio-green)" }}>+ Option hinzufügen</button>
            )}
          </div>
          <label className="flex items-center gap-3">
            <div
              onClick={() => setIsMultiple((v) => !v)}
              className="w-10 h-6 rounded-full flex items-center transition-all cursor-pointer relative"
              style={{ background: isMultiple ? "var(--nexio-green)" : "var(--border)" }}>
              <div className="w-5 h-5 rounded-full bg-white shadow-sm absolute transition-all"
                style={{ left: isMultiple ? 20 : 2 }} />
            </div>
            <span className="text-sm" style={{ color: "var(--foreground)" }}>Mehrfachauswahl erlauben</span>
          </label>
          <button onClick={submit}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white"
            style={{ background: "var(--nexio-green)" }}>
            Umfrage senden
          </button>
        </div>
      </div>
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
  const [decryptedContents, setDecryptedContents] = useState<Map<string, string>>(new Map());
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [pinnedMsg, setPinnedMsg] = useState<MessageWithSender | null>(null);
  const [contextMenu, setContextMenu] = useState<{ msg: MessageWithSender; y: number } | null>(null);
  const [forwardingMsg, setForwardingMsg] = useState<MessageWithSender | null>(null);
  const [forwardConvs, setForwardConvs] = useState<any[]>([]);
  const [replyingTo, setReplyingTo] = useState<MessageWithSender | null>(null);
  const [editingMsg, setEditingMsg] = useState<MessageWithSender | null>(null);
  const [editText, setEditText] = useState("");
  const [readMsgIds, setReadMsgIds] = useState<Set<string>>(new Set());
  const [polls, setPolls] = useState<Map<string, PollData>>(new Map());
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchIdx, setSearchIdx] = useState(0);
  // Mute state (loaded from conversation membership)
  const myMembership = conversation.members?.find((m: any) => m.user_id === currentUserId);
  const [isMuted, setIsMuted] = useState<boolean>((myMembership as any)?.is_muted ?? false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const msgItemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const speechRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // E2E — only for direct (1:1) conversations
  const peerUserId = conversation.type === "direct"
    ? conversation.members?.find((m: any) => m.user_id !== currentUserId)?.user_id ?? null
    : null;
  const e2e = useE2E(currentUserId, peerUserId);
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

  // Decrypt E2E messages whenever e2e becomes ready or messages change
  useEffect(() => {
    if (!e2e.ready) return;
    const e2eMsgs = messages.filter((m) => (m as any).is_e2e && !(decryptedContents.has(m.id)));
    if (e2eMsgs.length === 0) return;
    Promise.all(
      e2eMsgs.map(async (m) => {
        try {
          const plain = await e2e.decrypt(m.content ?? "");
          return [m.id, plain] as [string, string];
        } catch {
          return [m.id, "🔒 [Verschlüsselt]"] as [string, string];
        }
      })
    ).then((pairs) => {
      setDecryptedContents((prev) => {
        const next = new Map(prev);
        pairs.forEach(([id, plain]) => next.set(id, plain));
        return next;
      });
    });
  }, [e2e.ready, messages]);

  // ── Load pinned message ───────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from("pinned_messages")
      .select("message_id")
      .eq("conversation_id", conversation.id)
      .order("pinned_at", { ascending: false })
      .limit(1)
      .single()
      .then(async ({ data }) => {
        if (!data?.message_id) return;
        const { data: msg } = await supabase.from("messages").select("*").eq("id", data.message_id).single();
        if (msg) setPinnedMsg(msg as MessageWithSender);
      });
  }, [conversation.id]);

  // ── Pin / Forward / Delete ────────────────────────────────────────────────
  async function handlePinMessage(msg: MessageWithSender) {
    await supabase.from("pinned_messages").upsert({
      conversation_id: conversation.id,
      message_id: msg.id,
      pinned_by: currentUserId,
    }, { onConflict: "conversation_id,message_id" });
    setPinnedMsg(msg);
  }

  async function handleDeleteMessage(msg: MessageWithSender) {
    if (msg.sender_id !== currentUserId) return;
    await supabase.from("messages").update({ is_deleted: true, content: null }).eq("id", msg.id);
    setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, is_deleted: true, content: "Diese Nachricht wurde gelöscht." } : m));
  }

  async function handleForwardMessage(msg: MessageWithSender) {
    setForwardingMsg(msg);
    const { data } = await supabase
      .from("conversation_members")
      .select("conversation:conversations(id, name, type, members:conversation_members(user_id, user:users(display_name, avatar_url)))")
      .eq("user_id", currentUserId)
      .limit(30);
    setForwardConvs((data ?? []).map((d: any) => d.conversation).filter(Boolean).filter((c: any) => c.id !== conversation.id));
  }

  async function sendForward(targetConvId: string) {
    if (!forwardingMsg) return;
    await supabase.from("messages").insert({
      conversation_id: targetConvId,
      sender_id: currentUserId,
      type: forwardingMsg.type,
      content: forwardingMsg.content,
      media_url: forwardingMsg.media_url,
      media_metadata: forwardingMsg.media_metadata,
      forwarded_from: forwardingMsg.id,
    });
    setForwardingMsg(null);
  }

  // ── Read receipts via IntersectionObserver ────────────────────────────────
  const msgListRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = msgListRef.current;
    if (!container) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const msgId = (entry.target as HTMLElement).dataset.msgId;
        if (!msgId) return;
        // Mark as read in DB (ignore duplicates via ON CONFLICT DO NOTHING)
        supabase.from("message_reads").upsert(
          { message_id: msgId, user_id: currentUserId },
          { onConflict: "message_id,user_id", ignoreDuplicates: true }
        ).then(() => {});
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    // Observe all incoming (non-own) message bubbles
    container.querySelectorAll("[data-msg-id]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [messages.length]);

  // Subscribe to message_reads to update blue ticks on own messages
  useEffect(() => {
    const channel = supabase
      .channel(`reads:${conversation.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "message_reads",
      }, (payload) => {
        if (payload.new.user_id !== currentUserId) {
          setReadMsgIds((prev) => new Set([...prev, payload.new.message_id]));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversation.id, currentUserId]);

  // ── Polls: load + realtime subscription ──────────────────────────────────
  useEffect(() => {
    supabase
      .from("polls")
      .select("*")
      .eq("conversation_id", conversation.id)
      .then(({ data }) => {
        if (!data) return;
        const map = new Map<string, PollData>();
        data.forEach((p) => map.set(p.message_id, p as PollData));
        setPolls(map);
      });
    const ch = supabase
      .channel(`polls:${conversation.id}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "polls",
        filter: `conversation_id=eq.${conversation.id}`,
      }, (payload) => {
        setPolls((prev) => {
          const next = new Map(prev);
          next.set(payload.new.message_id, payload.new as PollData);
          return next;
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [conversation.id]);

  async function handleVote(pollId: string, optionIdx: number) {
    const poll = [...polls.values()].find((p) => p.id === pollId);
    if (!poll) return;
    const newOptions = poll.options.map((opt, idx) => {
      let votes = [...opt.votes];
      if (idx === optionIdx) {
        if (votes.includes(currentUserId)) {
          votes = votes.filter((v) => v !== currentUserId);
        } else {
          if (!poll.is_multiple_choice) {
            // Remove vote from other options first (done below)
          }
          votes = [...votes, currentUserId];
        }
      } else if (!poll.is_multiple_choice) {
        // Remove vote from all other options
        votes = votes.filter((v) => v !== currentUserId);
      }
      return { ...opt, votes };
    });
    // Optimistic update
    setPolls((prev) => {
      const next = new Map(prev);
      next.set(poll.message_id ?? "", { ...poll, options: newOptions });
      return next;
    });
    await supabase.from("polls").update({ options: newOptions }).eq("id", pollId);
  }

  async function sendPoll(question: string, optionTexts: string[], isMultiple: boolean) {
    // Create message of type "poll"
    const { data: msg } = await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: currentUserId,
      type: "poll",
      content: question,
    }).select().single();

    if (!msg) return;

    const options: PollOption[] = optionTexts.map((text) => ({ text, votes: [] }));
    await supabase.from("polls").insert({
      message_id: msg.id,
      conversation_id: conversation.id,
      question,
      options,
      created_by: currentUserId,
      is_multiple_choice: isMultiple,
    });

    setMessages((prev) => [...prev, { ...msg, sender: { id: currentUserId } as User } as MessageWithSender]);
  }

  // ── Reply handler ─────────────────────────────────────────────────────────
  function handleReply(msg: MessageWithSender) {
    setReplyingTo(msg);
    setEditingMsg(null);
  }

  // ── Edit handlers ─────────────────────────────────────────────────────────
  function handleStartEdit(msg: MessageWithSender) {
    setEditingMsg(msg);
    setEditText(msg.content ?? "");
    setReplyingTo(null);
  }

  async function handleSaveEdit() {
    if (!editingMsg || !editText.trim()) return;
    const newContent = editText.trim();
    setEditingMsg(null);
    setEditText("");
    setMessages((prev) =>
      prev.map((m) => m.id === editingMsg.id
        ? { ...m, content: newContent, edited_at: new Date().toISOString() }
        : m)
    );
    await supabase.from("messages").update({
      content: newContent,
      edited_at: new Date().toISOString(),
    }).eq("id", editingMsg.id);
  }

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
    // If editing, save edit instead
    if (editingMsg) { await handleSaveEdit(); return; }

    if (!text.trim() || sending) return;
    const plainContent = text.trim();
    const replyId = replyingTo?.id ?? null;
    setText("");
    clearTyping();
    setReplyingTo(null);
    setSending(true);

    // E2E: encrypt if both parties have keys
    const isE2E = e2e.enabled && e2e.ready;
    let storedContent = plainContent;
    if (isE2E) {
      try { storedContent = await e2e.encrypt(plainContent); } catch { /* fall through unencrypted */ }
    }

    const optimistic: MessageWithSender = {
      id: `tmp-${Date.now()}`,
      conversation_id: conversation.id,
      sender_id: currentUserId,
      type: "text",
      content: plainContent, // show plaintext optimistically
      media_url: null,
      media_metadata: null,
      reply_to_id: replyId,
      reactions: {},
      is_deleted: false,
      deleted_at: null,
      edited_at: null,
      created_at: new Date().toISOString(),
      sender: { id: currentUserId } as User,
    };
    setMessages((prev) => [...prev, optimistic]);
    if (isE2E) {
      setDecryptedContents((prev) => new Map(prev).set(optimistic.id, plainContent));
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversation.id,
        sender_id: currentUserId,
        type: "text",
        content: storedContent,
        reply_to_id: replyId,
        ...(isE2E ? { is_e2e: true } : {}),
      })
      .select()
      .single();

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setText(plainContent);
    } else {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimistic.id ? { ...data, sender: optimistic.sender } as MessageWithSender : m
        )
      );
      if (isE2E && data) {
        setDecryptedContents((prev) => {
          const next = new Map(prev);
          next.delete(optimistic.id);
          next.set(data.id, plainContent);
          return next;
        });
      }
    }
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    if (e.key === "Escape") {
      setReplyingTo(null);
      setEditingMsg(null);
      setEditText("");
    }
  }

  // ── Chat Summary ──────────────────────────────────────────────────────────
  async function summarizeChat() {
    if (summarizing) { setSummary(null); return; }
    setSummarizing(true);
    setSummary(null);
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: conversation.id }),
      });
      const data = await res.json();
      setSummary(data.summary ?? "Keine Zusammenfassung verfügbar.");
    } catch {
      setSummary("Zusammenfassung fehlgeschlagen.");
    }
    setSummarizing(false);
  }

  // ── Voice-to-text (Web Speech API) ───────────────────────────────────────
  function toggleSpeechInput() {
    if (typeof window === "undefined") return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) { alert("Spracheingabe wird von diesem Browser nicht unterstützt."); return; }

    if (isListening) {
      speechRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRec();
    speechRef.current = recognition;
    recognition.lang = "de-DE";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e: any) => {
      const transcript = e.results[0]?.[0]?.transcript ?? "";
      setText((prev) => prev + (prev ? " " : "") + transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
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

  // ── In-chat search ────────────────────────────────────────────────────────────
  const searchResults = searchQuery.trim().length >= 2
    ? messages.filter(m =>
        m.content?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  function openSearch() {
    setShowSearch(true);
    setSearchQuery("");
    setSearchIdx(0);
    setTimeout(() => searchInputRef.current?.focus(), 60);
  }

  function closeSearch() {
    setShowSearch(false);
    setSearchQuery("");
    setSearchIdx(0);
  }

  function scrollToSearchResult(idx: number) {
    if (searchResults.length === 0) return;
    const safeIdx = ((idx % searchResults.length) + searchResults.length) % searchResults.length;
    setSearchIdx(safeIdx);
    const msgId = searchResults[safeIdx].id;
    const el = msgItemRefs.current.get(msgId);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

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
            <p className="text-xs flex items-center gap-1" style={{ color: "var(--foreground-3)" }}>
              {e2e.enabled && <span title="Ende-zu-Ende verschlüsselt">🔒</span>}
              {conversation.type === "group"
                ? `👥 ${conversation.members?.length ?? 1} Mitglieder — tippen für Details`
                : e2e.enabled ? "Ende-zu-Ende verschlüsselt" : `${conversation.members?.length ?? 1} Mitglied${(conversation.members?.length ?? 1) !== 1 ? "er" : ""}`
              }
            </p>
          )}
        </button>
        {/* Search toggle */}
        <button
          onClick={openSearch}
          className="w-8 h-8 flex items-center justify-center"
          style={{ color: "var(--foreground-2)" }}
          title="Suche"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
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
        {/* KI Chat-Zusammenfassung */}
        <button onClick={summarizeChat}
          className="w-8 h-8 flex items-center justify-center rounded-full"
          style={{ color: summarizing ? "var(--nexio-green)" : "var(--foreground-2)" }}
          title="Chat zusammenfassen (KI)">
          {summarizing
            ? <span className="text-sm animate-spin">⏳</span>
            : <span className="text-sm">✨</span>}
        </button>
        {/* Mute toggle */}
        <button
          onClick={async () => {
            const next = !isMuted;
            setIsMuted(next);
            await supabase.from("conversation_members")
              .update({ is_muted: next })
              .eq("conversation_id", conversation.id)
              .eq("user_id", currentUserId);
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full"
          style={{ color: isMuted ? "var(--nexio-green)" : "var(--foreground-2)" }}
          title={isMuted ? "Stummschaltung aufheben" : "Stumm schalten"}
        >
          <span className="text-sm">{isMuted ? "🔕" : "🔔"}</span>
        </button>
        {/* Block/Report (only for direct chats) */}
        {conversation.type === "direct" && (() => {
          const other = conversation.members?.find((m: any) => m.user_id !== currentUserId);
          return other ? (
            <UserActionsMenu
              targetUserId={other.user_id}
              targetName={name}
              currentUserId={currentUserId}
            />
          ) : null;
        })()}
      </div>

      {/* In-Chat Search Bar */}
      {showSearch && (
        <div className="flex-none flex items-center gap-2 px-3 py-2 border-b"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-1.5 border"
            style={{ background: "var(--background)", borderColor: "var(--border)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ color: "var(--foreground-3)", flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setSearchIdx(0); }}
              onKeyDown={e => {
                if (e.key === "Enter") scrollToSearchResult(searchIdx + 1);
                if (e.key === "Escape") closeSearch();
              }}
              placeholder="Nachrichten durchsuchen…"
              className="flex-1 bg-transparent text-sm focus:outline-none"
              style={{ color: "var(--foreground)" }}
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setSearchIdx(0); }}
                style={{ color: "var(--foreground-3)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
          {searchResults.length > 0 && (
            <>
              <span className="text-xs whitespace-nowrap" style={{ color: "var(--foreground-3)" }}>
                {searchIdx + 1}/{searchResults.length}
              </span>
              <button onClick={() => scrollToSearchResult(searchIdx - 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg"
                style={{ color: "var(--foreground-2)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="18 15 12 9 6 15"/>
                </svg>
              </button>
              <button onClick={() => scrollToSearchResult(searchIdx + 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg"
                style={{ color: "var(--foreground-2)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
            </>
          )}
          {searchQuery.trim().length >= 2 && searchResults.length === 0 && (
            <span className="text-xs" style={{ color: "var(--foreground-3)" }}>Keine Treffer</span>
          )}
          <button onClick={closeSearch} className="text-sm px-2 py-1 rounded-lg"
            style={{ color: "var(--foreground-3)" }}>
            Fertig
          </button>
        </div>
      )}

      {/* Pinned Message Banner */}
      {pinnedMsg && (
        <div className="flex items-center gap-2 px-4 py-2 border-b"
          style={{ background: "#07c16010", borderColor: "#07c16030" }}>
          <span className="text-sm flex-none">📌</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold" style={{ color: "#07c160" }}>Angepinnte Nachricht</p>
            <p className="text-xs truncate" style={{ color: "var(--foreground-2)" }}>
              {pinnedMsg.content ?? (pinnedMsg.type === "image" ? "📷 Bild" : pinnedMsg.type === "audio" ? "🎙 Sprachnachricht" : "Medieninhalt")}
            </p>
          </div>
          <button onClick={() => setPinnedMsg(null)}
            className="text-xs flex-none" style={{ color: "var(--foreground-3)" }}>✕</button>
        </div>
      )}

      {/* KI Summary Panel */}
      {summary && (
        <div className="mx-3 my-2 rounded-2xl px-4 py-3 border"
          style={{ background: "#07c16010", borderColor: "#07c16030" }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold" style={{ color: "#07c160" }}>✨ KI-Zusammenfassung</span>
            <button onClick={() => setSummary(null)} style={{ color: "var(--foreground-3)", fontSize: 12 }}>✕</button>
          </div>
          <p className="text-xs whitespace-pre-line" style={{ color: "var(--foreground)" }}>{summary}</p>
        </div>
      )}

      {/* Messages */}
      <div ref={msgListRef} className="flex-1 overflow-y-auto py-2">
        {messages.map((msg, idx) => {
          // Substitute decrypted content for E2E messages
          const displayMsg = (msg as any).is_e2e
            ? { ...msg, content: decryptedContents.get(msg.id) ?? "🔒 Entschlüssele…" }
            : msg;
          const isOwn = msg.sender_id === currentUserId;
          // Build quoted message preview
          let quotedMsg: { content: string | null; senderName?: string } | null = null;
          if (msg.reply_to_id) {
            const quoted = messages.find((m) => m.id === msg.reply_to_id);
            if (quoted) {
              quotedMsg = {
                content: quoted.content ?? null,
                senderName: quoted.sender?.display_name ?? undefined,
              };
            }
          }
          const isSearchHit = searchQuery.trim().length >= 2 &&
            msg.content?.toLowerCase().includes(searchQuery.toLowerCase());
          const isActiveHit = isSearchHit &&
            searchResults[searchIdx]?.id === msg.id;

          return (
          <div
            key={msg.id}
            ref={el => { if (el) msgItemRefs.current.set(msg.id, el); else msgItemRefs.current.delete(msg.id); }}
            style={isActiveHit
              ? { background: "rgba(7,193,96,0.12)", borderRadius: 12, transition: "background 0.3s" }
              : isSearchHit
                ? { background: "rgba(7,193,96,0.05)", borderRadius: 12 }
                : undefined}
          >
            {shouldShowDate(messages, idx) && <DateDivider date={msg.created_at} />}
            <div data-msg-id={!isOwn ? msg.id : undefined}>
              <MessageBubble
                msg={displayMsg}
                isOwn={isOwn}
                showAvatar={idx === 0 || messages[idx - 1].sender_id !== msg.sender_id}
                currentUserId={currentUserId}
                onReact={handleReact}
                onImageClick={setLightboxUrl}
                onLongPress={(m, y) => setContextMenu({ msg: m, y })}
                quotedMsg={quotedMsg}
                isRead={readMsgIds.has(msg.id)}
                poll={msg.type === "poll" ? polls.get(msg.id) ?? null : null}
                onVote={handleVote}
              />
            </div>
          </div>
        );
        })}
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
        <div className="flex-none" style={{ background: "var(--surface)" }}>
          {/* Reply Preview */}
          {replyingTo && (
            <ReplyPreviewBar msg={replyingTo} onCancel={() => setReplyingTo(null)} />
          )}
          {/* Edit Mode Banner */}
          {editingMsg && (
            <div className="flex items-center gap-2 px-3 py-2 border-t"
              style={{ background: "#07c16015", borderColor: "var(--border)" }}>
              <span className="text-sm flex-none">✏️</span>
              <p className="flex-1 text-xs" style={{ color: "var(--nexio-green)" }}>Nachricht bearbeiten</p>
              <button onClick={() => { setEditingMsg(null); setEditText(""); setText(""); }}
                className="flex-none text-xs" style={{ color: "var(--foreground-3)" }}>Abbrechen</button>
            </div>
          )}
        <div
          className="flex items-end gap-2 px-3 py-2 pb-safe border-t"
          style={{ borderColor: "var(--border)" }}
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
              value={editingMsg ? editText : text}
              onChange={(e) => {
                if (editingMsg) {
                  setEditText(e.target.value);
                } else {
                  setText(e.target.value);
                  if (e.target.value.trim()) sendTyping();
                }
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={handleKeyDown}
              onBlur={clearTyping}
              placeholder={editingMsg ? "Nachricht bearbeiten…" : "Nachricht schreiben…"}
              rows={1}
              className="w-full resize-none bg-transparent text-sm leading-5 focus:outline-none"
              style={{ color: "var(--foreground)", maxHeight: "120px" }}
            />
          </div>

          {/* Voice-to-text (speech recognition) */}
          <button
            onClick={toggleSpeechInput}
            className="w-8 h-8 flex items-center justify-center mb-0.5 flex-none rounded-full"
            style={{
              color: isListening ? "white" : "var(--foreground-3)",
              background: isListening ? "#ef4444" : "transparent",
            }}
            title={isListening ? "Aufnahme stoppen" : "Spracheingabe"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
            </svg>
          </button>

          {/* Send / Voice record */}
          {(text.trim() || (editingMsg && editText.trim())) ? (
            <button
              onClick={sendMessage}
              disabled={sending}
              className="w-9 h-9 rounded-full flex items-center justify-center flex-none mb-0.5 disabled:opacity-50"
              style={{ background: "var(--nexio-green)" }}
            >
              {editingMsg ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
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
          onPoll={() => setShowCreatePoll(true)}
        />
      )}

      {/* Create Poll Sheet */}
      {showCreatePoll && (
        <CreatePollSheet
          onClose={() => setShowCreatePoll(false)}
          onSubmit={sendPoll}
        />
      )}

      {/* Image Lightbox */}
      {lightboxUrl && (
        <ImageViewer url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}

      {/* Group Info Sheet */}
      {showGroupInfo && conversation.type === "group" && (
        <GroupInfoSheet
          conversation={conversation}
          currentUserId={currentUserId}
          name={name}
          onClose={() => setShowGroupInfo(false)}
          onLeft={() => router.replace("/chats")}
        />
      )}

      {/* Upload Progress Bar */}
      {uploadProgress !== null && (
        <div className="fixed bottom-24 left-4 right-4 z-40 rounded-2xl px-4 py-2"
          style={{ background: "var(--surface)", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--foreground-2)" }}>Hochladen…</p>
          <UploadProgress progress={uploadProgress} />
        </div>
      )}

      {/* Message Context Menu */}
      {contextMenu && (
        <MsgContextMenu
          msg={contextMenu.msg}
          isOwn={contextMenu.msg.sender_id === currentUserId}
          posY={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onCopy={() => { navigator.clipboard.writeText(contextMenu.msg.content ?? ""); }}
          onPin={() => handlePinMessage(contextMenu.msg)}
          onForward={() => handleForwardMessage(contextMenu.msg)}
          onDelete={() => handleDeleteMessage(contextMenu.msg)}
          onReply={() => handleReply(contextMenu.msg)}
          onEdit={() => handleStartEdit(contextMenu.msg)}
        />
      )}

      {/* Forward Sheet */}
      {forwardingMsg && (
        <ForwardSheet
          conversations={forwardConvs}
          currentUserId={currentUserId}
          onForward={sendForward}
          onClose={() => setForwardingMsg(null)}
        />
      )}
    </div>
  );
}
