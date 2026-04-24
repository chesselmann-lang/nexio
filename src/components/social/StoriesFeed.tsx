"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface Story {
  id: string;
  author_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  likes: string[];
  views: string[];
  expires_at: string;
  created_at: string;
  author?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    username: string;
  };
}

interface StoriesFeedProps {
  initialStories: Story[];
  currentUserId: string;
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const colors = ["#07c160", "#1677ff", "#ff6b35", "#9333ea", "#ec4899", "#0ea5e9"];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-none"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function StoryCard({ story, currentUserId }: { story: Story; currentUserId: string }) {
  const supabase = createClient();
  const [likes, setLikes] = useState<string[]>(story.likes ?? []);
  const hasLiked = likes.includes(currentUserId);

  async function toggleLike() {
    const newLikes = hasLiked
      ? likes.filter((u) => u !== currentUserId)
      : [...likes, currentUserId];
    setLikes(newLikes);
    await supabase.from("stories").update({ likes: newLikes }).eq("id", story.id);
  }

  return (
    <div
      className="rounded-2xl overflow-hidden border"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      {/* Author row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar name={story.author?.display_name ?? "?"} size={40} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: "var(--foreground)" }}>
            {story.author?.display_name}
          </p>
          <p className="text-xs" style={{ color: "var(--foreground-3)" }}>
            {formatDistanceToNow(new Date(story.created_at), { locale: de, addSuffix: true })}
          </p>
        </div>
        {/* More options */}
        <button style={{ color: "var(--foreground-3)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
          </svg>
        </button>
      </div>

      {/* Media */}
      {story.media_url && story.media_type?.startsWith("image") && (
        <img
          src={story.media_url}
          alt="Story"
          className="w-full max-h-96 object-cover"
        />
      )}
      {story.media_url && story.media_type?.startsWith("video") && (
        <video src={story.media_url} controls className="w-full max-h-96 object-cover" />
      )}

      {/* Text content */}
      {story.content && (
        <div className="px-4 py-3">
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--foreground)" }}>
            {story.content}
          </p>
        </div>
      )}

      {/* Actions */}
      <div
        className="flex items-center gap-4 px-4 py-3 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        {/* Like */}
        <button
          onClick={toggleLike}
          className="flex items-center gap-1.5 text-sm font-medium transition-transform active:scale-90"
          style={{ color: hasLiked ? "#ef4444" : "var(--foreground-3)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={hasLiked ? "currentColor" : "none"}
            stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {likes.length > 0 && <span>{likes.length}</span>}
        </button>

        {/* Comment */}
        <button
          className="flex items-center gap-1.5 text-sm font-medium"
          style={{ color: "var(--foreground-3)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Kommentieren
        </button>

        {/* Views */}
        <div className="ml-auto flex items-center gap-1 text-xs" style={{ color: "var(--foreground-3)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {story.views?.length ?? 0}
        </div>
      </div>
    </div>
  );
}

export default function StoriesFeed({ initialStories, currentUserId }: StoriesFeedProps) {
  const supabase = createClient();
  const [stories, setStories] = useState<Story[]>(initialStories);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [showCompose, setShowCompose] = useState(false);

  async function post() {
    if (!newPost.trim() || posting) return;
    setPosting(true);

    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("stories")
      .insert({
        author_id: currentUserId,
        content: newPost.trim(),
        likes: [],
        views: [],
        expires_at: expires,
      })
      .select("*, author:users!author_id(id, display_name, avatar_url, username)")
      .single();

    if (data) setStories((prev) => [data as Story, ...prev]);
    setNewPost("");
    setShowCompose(false);
    setPosting(false);
  }

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div
        className="flex-none flex items-center justify-between px-4 pt-safe border-b"
        style={{ height: "var(--header-height)", background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <h1 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Momente</h1>
        <button
          onClick={() => setShowCompose(true)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "var(--nexio-green)", color: "white" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* Compose overlay */}
      {showCompose && (
        <div className="absolute inset-0 z-40 flex flex-col" style={{ background: "var(--background)" }}>
          <div
            className="flex-none flex items-center gap-3 px-4 border-b"
            style={{ height: "var(--header-height)", background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <button onClick={() => setShowCompose(false)} style={{ color: "var(--foreground-3)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <span className="flex-1 font-semibold" style={{ color: "var(--foreground)" }}>Neuer Moment</span>
            <button
              onClick={post}
              disabled={!newPost.trim() || posting}
              className="px-4 py-1.5 rounded-full text-sm font-semibold disabled:opacity-40"
              style={{ background: "var(--nexio-green)", color: "white" }}
            >
              Posten
            </button>
          </div>
          <div className="flex-1 p-4">
            <textarea
              autoFocus
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Was gibt's Neues?"
              className="w-full h-40 bg-transparent text-base resize-none focus:outline-none"
              style={{ color: "var(--foreground)" }}
            />
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="flex-1 overflow-y-auto">
        {stories.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4"
            style={{ color: "var(--foreground-3)" }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p className="text-base font-medium">Noch keine Momente</p>
            <p className="text-sm">Teile etwas mit deinen Kontakten!</p>
          </div>
        )}
        <div className="flex flex-col gap-3 p-3">
          {stories.map((s) => (
            <StoryCard key={s.id} story={s} currentUserId={currentUserId} />
          ))}
        </div>
      </div>
    </div>
  );
}
