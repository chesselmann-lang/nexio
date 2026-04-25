"use client";
import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface Story {
  id: string;
  author_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  likes: string[];
  views: string[];
  comments_count?: number;
  expires_at: string;
  is_permanent?: boolean;
  privacy?: string;
  location_name?: string;
  created_at: string;
  author?: { id: string; display_name: string; avatar_url: string | null; username: string };
}

interface Comment {
  id: string; author_id: string; content: string; created_at: string;
  author?: { display_name: string; avatar_url: string | null };
}

const AVATAR_COLORS = ["#07c160","#1677ff","#ff6b35","#9333ea","#ec4899","#0ea5e9"];
function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold flex-none"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}>
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

const PRIVACY_LABELS: Record<string, string> = {
  public: "🌍 Öffentlich", friends: "👥 Freunde", close_friends: "⭐ Enge Freunde", private: "🔒 Nur ich"
};

function StoryCard({ story, currentUserId, onReport }: {
  story: Story; currentUserId: string; onReport: (id: string) => void;
}) {
  const supabase = createClient();
  const [likes, setLikes] = useState<string[]>(story.likes ?? []);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentCount, setCommentCount] = useState(story.comments_count ?? 0);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const hasLiked = likes.includes(currentUserId);
  const isOwn = story.author_id === currentUserId;

  async function toggleLike() {
    const next = hasLiked ? likes.filter(u => u !== currentUserId) : [...likes, currentUserId];
    setLikes(next);
    await supabase.from("stories").update({ likes: next }).eq("id", story.id);
  }

  async function loadComments() {
    if (loadingComments) return;
    setLoadingComments(true);
    const { data } = await supabase
      .from("story_comments")
      .select("*, author:users!author_id(display_name, avatar_url)")
      .eq("story_id", story.id)
      .order("created_at", { ascending: true });
    setComments((data as Comment[]) ?? []);
    setLoadingComments(false);
  }

  async function toggleComments() {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) await loadComments();
  }

  async function sendComment() {
    if (!commentText.trim()) return;
    const text = commentText.trim();
    setCommentText("");
    const { data } = await supabase
      .from("story_comments")
      .insert({ story_id: story.id, author_id: currentUserId, content: text })
      .select("*, author:users!author_id(display_name, avatar_url)")
      .single();
    if (data) {
      setComments(c => [...c, data as Comment]);
      setCommentCount(n => n + 1);
      await supabase.from("stories").update({ comments_count: commentCount + 1 }).eq("id", story.id);
    }
  }

  return (
    <div className="rounded-2xl overflow-hidden border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      {/* Author row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="relative">
          <Avatar name={story.author?.display_name ?? "?"} size={40} />
          {story.is_permanent && (
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center text-[8px]">📌</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: "var(--foreground)" }}>
            {story.author?.display_name}
          </p>
          <div className="flex items-center gap-1.5">
            <p className="text-xs" style={{ color: "var(--foreground-3)" }}>
              {formatDistanceToNow(new Date(story.created_at), { locale: de, addSuffix: true })}
            </p>
            {story.location_name && (
              <span className="text-xs" style={{ color: "var(--foreground-3)" }}>· 📍 {story.location_name}</span>
            )}
            {story.privacy && story.privacy !== 'friends' && (
              <span className="text-xs" style={{ color: "var(--foreground-3)" }}>
                · {story.privacy === 'public' ? '🌍' : story.privacy === 'close_friends' ? '⭐' : '🔒'}
              </span>
            )}
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setShowOptions(!showOptions)} style={{ color: "var(--foreground-3)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
            </svg>
          </button>
          {showOptions && (
            <div className="absolute right-0 top-6 z-20 rounded-xl shadow-lg border overflow-hidden min-w-[140px]"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              {isOwn ? (
                <button className="w-full px-4 py-2.5 text-sm text-left text-red-500 hover:bg-red-50">
                  Löschen
                </button>
              ) : (
                <>
                  <button className="w-full px-4 py-2.5 text-sm text-left" style={{ color: "var(--foreground)" }}
                    onClick={() => { onReport(story.id); setShowOptions(false); }}>
                    Melden
                  </button>
                  <button className="w-full px-4 py-2.5 text-sm text-left text-red-500">
                    Blockieren
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Media */}
      {story.media_url && story.media_type?.startsWith("image") && (
        <img src={story.media_url} alt="Moment" className="w-full max-h-[480px] object-cover" />
      )}
      {story.media_url && story.media_type?.startsWith("video") && (
        <video src={story.media_url} controls className="w-full max-h-[480px] object-cover" />
      )}

      {/* Text */}
      {story.content && (
        <div className="px-4 py-3">
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--foreground)" }}>
            {story.content}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
        <button onClick={toggleLike}
          className="flex items-center gap-1.5 text-sm font-medium transition-transform active:scale-90"
          style={{ color: hasLiked ? "#ef4444" : "var(--foreground-3)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={hasLiked ? "currentColor" : "none"}
            stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          {likes.length > 0 && <span>{likes.length}</span>}
        </button>
        <button onClick={toggleComments}
          className="flex items-center gap-1.5 text-sm font-medium"
          style={{ color: showComments ? "var(--nexio-green)" : "var(--foreground-3)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {commentCount > 0 ? commentCount : "Kommentieren"}
        </button>
        <div className="ml-auto flex items-center gap-1 text-xs" style={{ color: "var(--foreground-3)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
          {story.views?.length ?? 0}
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t px-4 py-3 space-y-3" style={{ borderColor: "var(--border)" }}>
          {loadingComments ? (
            <div className="flex justify-center py-2">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"/>
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-center py-1" style={{ color: "var(--foreground-3)" }}>
              Noch keine Kommentare
            </p>
          ) : (
            comments.map(c => (
              <div key={c.id} className="flex items-start gap-2">
                <Avatar name={c.author?.display_name ?? "?"} size={28} />
                <div className="flex-1 rounded-xl px-3 py-2" style={{ background: "var(--surface-2, var(--background))" }}>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--foreground)" }}>
                    {c.author?.display_name}
                  </p>
                  <p className="text-sm" style={{ color: "var(--foreground)" }}>{c.content}</p>
                </div>
              </div>
            ))
          )}
          {/* Comment input */}
          <div className="flex items-center gap-2 pt-1">
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendComment()}
              placeholder="Kommentar schreiben…"
              className="flex-1 rounded-full px-4 py-2 text-sm focus:outline-none border"
              style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
            />
            <button onClick={sendComment} disabled={!commentText.trim()}
              className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-40"
              style={{ background: "var(--nexio-green)", color: "white" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Compose Sheet ──────────────────────────────────────────────────────────────
function ComposeSheet({ currentUserId, onPosted, onClose }: {
  currentUserId: string; onPosted: (story: Story) => void; onClose: () => void;
}) {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [privacy, setPrivacy] = useState("friends");
  const [isPermanent, setIsPermanent] = useState(false);
  const [location, setLocation] = useState("");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  }

  async function post() {
    if ((!text.trim() && !mediaFile) || posting) return;
    setPosting(true);

    let mediaUrl: string | null = null;
    let mediaType: string | null = null;

    if (mediaFile) {
      const ext = mediaFile.name.split(".").pop();
      const path = `stories/${currentUserId}/${Date.now()}.${ext}`;
      const { data: up } = await supabase.storage.from("media").upload(path, mediaFile, { upsert: true });
      if (up) {
        const { data: pub } = supabase.storage.from("media").getPublicUrl(path);
        mediaUrl = pub.publicUrl;
        mediaType = mediaFile.type;
      }
    }

    const expiresAt = isPermanent
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from("stories")
      .insert({
        author_id: currentUserId,
        content: text.trim() || null,
        media_url: mediaUrl,
        media_type: mediaType,
        likes: [], views: [],
        expires_at: expiresAt,
        is_permanent: isPermanent,
        privacy,
        location_name: location.trim() || null,
        comments_count: 0,
      })
      .select("*, author:users!author_id(id, display_name, avatar_url, username)")
      .single();

    if (data) onPosted(data as Story);
    setPosting(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "var(--background)" }}>
      <div className="flex-none flex items-center gap-3 px-4 border-b"
        style={{ height: "var(--header-height)", background: "var(--surface)", borderColor: "var(--border)" }}>
        <button onClick={onClose} style={{ color: "var(--foreground-3)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <span className="flex-1 font-semibold" style={{ color: "var(--foreground)" }}>Neuer Moment</span>
        <button onClick={post} disabled={(!text.trim() && !mediaFile) || posting}
          className="px-4 py-1.5 rounded-full text-sm font-semibold disabled:opacity-40"
          style={{ background: "var(--nexio-green)", color: "white" }}>
          {posting ? "Posten…" : "Posten"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Text */}
        <textarea autoFocus value={text} onChange={e => setText(e.target.value)}
          placeholder="Was gibt's Neues?"
          className="w-full h-32 bg-transparent text-base resize-none focus:outline-none"
          style={{ color: "var(--foreground)" }} />

        {/* Media preview */}
        {mediaPreview && (
          <div className="relative rounded-xl overflow-hidden">
            <img src={mediaPreview} alt="Vorschau" className="w-full max-h-64 object-cover" />
            <button onClick={() => { setMediaPreview(null); setMediaFile(null); }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white text-xs">✕</button>
          </div>
        )}

        {/* Media + Location buttons */}
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => cameraRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm border"
            style={{ borderColor: "var(--nexio-green)", color: "var(--nexio-green)", background: "#07c16010" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            Kamera
          </button>
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm border"
            style={{ borderColor: "var(--border)", color: "var(--foreground-2)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            Galerie
          </button>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
          <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFile} className="hidden" />
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 border"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <span className="text-base">📍</span>
          <input value={location} onChange={e => setLocation(e.target.value)}
            placeholder="Ort hinzufügen (optional)"
            className="flex-1 bg-transparent text-sm focus:outline-none"
            style={{ color: "var(--foreground)" }} />
        </div>

        {/* Privacy selector */}
        <div>
          <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--foreground-3)" }}>Sichtbarkeit</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(PRIVACY_LABELS).map(([val, label]) => (
              <button key={val} onClick={() => setPrivacy(val)}
                className="py-2.5 px-3 rounded-xl text-sm font-medium text-left border transition-colors"
                style={{
                  borderColor: privacy === val ? "var(--nexio-green)" : "var(--border)",
                  background: privacy === val ? "#07c16015" : "var(--surface)",
                  color: privacy === val ? "var(--nexio-green)" : "var(--foreground-2)",
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Permanent toggle */}
        <div className="flex items-center justify-between rounded-xl px-4 py-3 border"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Dauerhaft sichtbar</p>
            <p className="text-xs" style={{ color: "var(--foreground-3)" }}>Sonst verschwindet der Moment nach 24h</p>
          </div>
          <button onClick={() => setIsPermanent(!isPermanent)}
            className="w-11 h-6 rounded-full transition-colors flex items-center px-0.5"
            style={{ background: isPermanent ? "var(--nexio-green)" : "var(--border)" }}>
            <div className="w-5 h-5 rounded-full bg-white shadow transition-transform"
              style={{ transform: isPermanent ? "translateX(20px)" : "translateX(0)" }} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Feed ──────────────────────────────────────────────────────────────────
export default function StoriesFeed({ initialStories, currentUserId }: {
  initialStories: Story[]; currentUserId: string;
}) {
  const [stories, setStories] = useState<Story[]>(initialStories);
  const [showCompose, setShowCompose] = useState(false);
  const [reportTarget, setReportTarget] = useState<string | null>(null);

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--background)" }}>
      <div className="flex-none flex items-center justify-between px-4 border-b"
        style={{ height: "var(--header-height)", background: "var(--surface)", borderColor: "var(--border)" }}>
        <h1 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Momente</h1>
        <button onClick={() => setShowCompose(true)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "var(--nexio-green)", color: "white" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {stories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4" style={{ color: "var(--foreground-3)" }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <p className="text-base font-medium">Noch keine Momente</p>
            <p className="text-sm">Teile etwas mit deinen Kontakten!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 p-3">
            {stories.map(s => (
              <StoryCard key={s.id} story={s} currentUserId={currentUserId}
                onReport={setReportTarget} />
            ))}
          </div>
        )}
      </div>

      {showCompose && (
        <ComposeSheet currentUserId={currentUserId}
          onPosted={s => setStories(prev => [s, ...prev])}
          onClose={() => setShowCompose(false)} />
      )}

      {/* Report modal */}
      {reportTarget && (
        <ReportModal targetId={reportTarget} targetType="story"
          reporterId={currentUserId} onClose={() => setReportTarget(null)} />
      )}
    </div>
  );
}

function ReportModal({ targetId, targetType, reporterId, onClose }: {
  targetId: string; targetType: string; reporterId: string; onClose: () => void;
}) {
  const supabase = createClient();
  const [reason, setReason] = useState("spam");
  const [desc, setDesc] = useState("");
  const [sent, setSent] = useState(false);

  async function send() {
    await supabase.from("reports").insert({ reporter_id: reporterId, target_type: targetType, target_id: targetId, reason, description: desc });
    setSent(true);
    setTimeout(onClose, 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-t-3xl p-6 space-y-4" style={{ background: "var(--surface)" }} onClick={e => e.stopPropagation()}>
        {sent ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">✅</div>
            <p className="font-semibold" style={{ color: "var(--foreground)" }}>Meldung eingereicht</p>
          </div>
        ) : (
          <>
            <h3 className="text-base font-bold" style={{ color: "var(--foreground)" }}>Inhalt melden</h3>
            <div className="space-y-2">
              {[["spam","Spam"],["harassment","Belästigung"],["hate_speech","Hassrede"],["misinformation","Falschinformation"],["illegal","Illegaler Inhalt"],["other","Sonstiges"]].map(([val,label]) => (
                <button key={val} onClick={() => setReason(val)}
                  className="w-full py-2.5 px-3 rounded-xl text-sm text-left border"
                  style={{ borderColor: reason === val ? "var(--nexio-green)" : "var(--border)", color: reason === val ? "var(--nexio-green)" : "var(--foreground-2)", background: reason === val ? "#07c16015" : "transparent" }}>
                  {label}
                </button>
              ))}
            </div>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Weitere Details (optional)" rows={2}
              className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none border resize-none"
              style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm border" style={{ borderColor: "var(--border)", color: "var(--foreground-2)" }}>Abbrechen</button>
              <button onClick={send} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: "#ef4444" }}>Melden</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
