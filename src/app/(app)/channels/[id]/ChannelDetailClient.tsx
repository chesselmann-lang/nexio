"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface Channel {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  subscriber_count: number;
  verified: boolean;
  category: string | null;
  owner_id: string | null;
}

interface Post {
  id: string;
  content: string;
  media_urls: string[] | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  author: { display_name: string; avatar_url: string | null } | null;
}

export default function ChannelDetailClient({
  channel: initialChannel,
  posts: initialPosts,
  currentUserId,
  isSubscribed: initialSub,
  isOwner,
}: {
  channel: Channel;
  posts: Post[];
  currentUserId: string | null;
  isSubscribed: boolean;
  isOwner: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [channel, setChannel] = useState(initialChannel);
  const [posts, setPosts] = useState(initialPosts);
  const [isSubscribed, setIsSubscribed] = useState(initialSub);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [subCount, setSubCount] = useState(initialChannel.subscriber_count);

  // Compose state (owner only)
  const [composing, setComposing] = useState(false);
  const [postText, setPostText] = useState("");
  const [posting, setPosting] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  async function toggleSubscribe() {
    if (!currentUserId) { router.push("/login"); return; }
    if (isSubscribed) {
      await supabase.from("channel_members")
        .delete().eq("channel_id", channel.id).eq("user_id", currentUserId);
      await supabase.from("channels").update({ subscriber_count: Math.max(0, subCount - 1) }).eq("id", channel.id);
      setSubCount((n) => Math.max(0, n - 1));
      setIsSubscribed(false);
    } else {
      await supabase.from("channel_members").insert({ channel_id: channel.id, user_id: currentUserId });
      await supabase.from("channels").update({ subscriber_count: subCount + 1 }).eq("id", channel.id);
      setSubCount((n) => n + 1);
      setIsSubscribed(true);
    }
  }

  async function toggleLike(postId: string) {
    const liked = likedPosts.has(postId);
    setLikedPosts((s) => { const n = new Set(s); liked ? n.delete(postId) : n.add(postId); return n; });
    setPosts((arr) => arr.map((p) =>
      p.id === postId ? { ...p, likes_count: p.likes_count + (liked ? -1 : 1) } : p
    ));
    if (liked) {
      await supabase.from("channel_post_likes").delete()
        .eq("post_id", postId).eq("user_id", currentUserId ?? "");
    } else {
      await supabase.from("channel_post_likes").insert({ post_id: postId, user_id: currentUserId });
    }
  }

  async function handleMediaPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !currentUserId) return;
    setMediaPreview(URL.createObjectURL(file));
    const ext = file.name.split(".").pop();
    const path = `channel-media/${channel.id}/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from("nexio-media").upload(path, file);
    if (!error && data) {
      const { data: urlData } = supabase.storage.from("nexio-media").getPublicUrl(data.path);
      setMediaUrl(urlData.publicUrl);
    }
  }

  async function publishPost() {
    if (!postText.trim() && !mediaUrl) return;
    if (!currentUserId) return;
    setPosting(true);
    const { data: newPost } = await supabase
      .from("channel_posts")
      .insert({
        channel_id: channel.id,
        author_id: currentUserId,
        content: postText.trim(),
        media_urls: mediaUrl ? [mediaUrl] : null,
        likes_count: 0,
        comments_count: 0,
      })
      .select("id, content, media_urls, created_at, likes_count, comments_count, author:users(display_name, avatar_url)")
      .single();
    if (newPost) setPosts((arr) => [newPost as Post, ...arr]);
    setPostText(""); setMediaUrl(null); setMediaPreview(null);
    setComposing(false); setPosting(false);
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <header className="sticky top-0 z-10 px-4 py-3 border-b flex items-center gap-3"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <button onClick={() => router.back()} style={{ color: "var(--foreground-3)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-base font-semibold flex-1 truncate" style={{ color: "var(--foreground)" }}>
          {channel.name} {channel.verified && <span style={{ color: "var(--nexio-green)" }}>✓</span>}
        </h1>
        {isOwner && (
          <button onClick={() => setComposing(true)}
            className="text-sm font-semibold px-3 py-1.5 rounded-full text-white"
            style={{ background: "var(--nexio-green)" }}>
            ＋ Post
          </button>
        )}
      </header>

      {/* Channel Info */}
      <div className="px-4 py-5 border-b flex items-start gap-4"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center text-3xl flex-none"
          style={{ background: "var(--background)" }}>
          {channel.avatar_url
            ? <img src={channel.avatar_url} alt="" className="w-full h-full object-cover" />
            : "📢"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="font-bold text-lg" style={{ color: "var(--foreground)" }}>{channel.name}</h2>
            {channel.verified && <span className="text-sm" style={{ color: "var(--nexio-green)" }}>✓</span>}
          </div>
          {channel.category && (
            <p className="text-xs" style={{ color: "var(--nexio-green)" }}>{channel.category}</p>
          )}
          {channel.description && (
            <p className="text-sm mt-1" style={{ color: "var(--foreground-2)" }}>{channel.description}</p>
          )}
          <p className="text-xs mt-1.5" style={{ color: "var(--foreground-3)" }}>
            {subCount.toLocaleString("de-DE")} Abonnenten
          </p>
        </div>
      </div>

      {/* Subscribe button */}
      <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
        <button onClick={toggleSubscribe}
          className="w-full py-2.5 rounded-2xl text-sm font-semibold"
          style={{
            background: isSubscribed ? "var(--surface)" : "var(--nexio-green)",
            color: isSubscribed ? "var(--foreground)" : "#fff",
            border: isSubscribed ? "1px solid var(--border)" : "none",
          }}>
          {isSubscribed ? "✓ Abonniert" : "➕ Abonnieren"}
        </button>
      </div>

      {/* Compose sheet */}
      {composing && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "var(--background)" }}>
          <header className="px-4 py-3 border-b flex items-center gap-3"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <button onClick={() => { setComposing(false); setPostText(""); setMediaUrl(null); setMediaPreview(null); }}
              style={{ color: "var(--foreground-3)" }}>Abbrechen</button>
            <span className="flex-1 text-base font-semibold text-center" style={{ color: "var(--foreground)" }}>
              Neuer Post
            </span>
            <button onClick={publishPost} disabled={posting || (!postText.trim() && !mediaUrl)}
              className="text-sm font-semibold px-4 py-1.5 rounded-full text-white"
              style={{ background: posting || (!postText.trim() && !mediaUrl) ? "#9ca3af" : "var(--nexio-green)" }}>
              {posting ? "Poste…" : "Posten"}
            </button>
          </header>
          <div className="flex-1 px-4 py-4 flex flex-col gap-3">
            <textarea
              autoFocus
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="Was möchtest du teilen?"
              maxLength={1000}
              rows={6}
              className="w-full bg-transparent text-base focus:outline-none resize-none"
              style={{ color: "var(--foreground)" }}
            />
            {mediaPreview && (
              <div className="relative">
                <img src={mediaPreview} alt="" className="rounded-2xl max-h-48 object-cover" />
                <button onClick={() => { setMediaPreview(null); setMediaUrl(null); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm"
                  style={{ background: "rgba(0,0,0,0.6)" }}>✕</button>
              </div>
            )}
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-2xl self-start"
              style={{ background: "var(--surface)", color: "var(--foreground-2)" }}>
              📷 Bild hinzufügen
            </button>
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaPick} />
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {posts.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-2">
            <span className="text-3xl">📢</span>
            <p className="text-sm" style={{ color: "var(--foreground-3)" }}>Noch keine Posts</p>
            {isOwner && (
              <button onClick={() => setComposing(true)}
                className="mt-2 px-4 py-2 rounded-2xl text-sm font-semibold text-white"
                style={{ background: "var(--nexio-green)" }}>
                Ersten Post erstellen
              </button>
            )}
          </div>
        )}

        {posts.map((post) => {
          const liked = likedPosts.has(post.id);
          const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: de });
          return (
            <article key={post.id} className="px-4 py-4" style={{ background: "var(--surface)" }}>
              {/* Author */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-white text-xs font-bold flex-none"
                  style={{ background: "var(--nexio-green)" }}>
                  {post.author?.avatar_url
                    ? <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" />
                    : post.author?.display_name?.slice(0, 1) ?? "?"}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    {post.author?.display_name ?? channel.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--foreground-3)" }}>{timeAgo}</p>
                </div>
              </div>

              {/* Content */}
              {post.content && (
                <p className="text-sm whitespace-pre-wrap mb-3" style={{ color: "var(--foreground)" }}>
                  {post.content}
                </p>
              )}

              {/* Media */}
              {post.media_urls?.map((url, i) => (
                <img key={i} src={url} alt="" className="rounded-2xl w-full object-cover max-h-80 mb-3" />
              ))}

              {/* Actions */}
              <div className="flex items-center gap-4">
                <button onClick={() => currentUserId && toggleLike(post.id)}
                  className="flex items-center gap-1.5 text-sm"
                  style={{ color: liked ? "#ef4444" : "var(--foreground-3)" }}>
                  <span className="text-lg">{liked ? "❤️" : "🤍"}</span>
                  <span>{post.likes_count}</span>
                </button>
                <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--foreground-3)" }}>
                  <span className="text-lg">💬</span>
                  <span>{post.comments_count}</span>
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
