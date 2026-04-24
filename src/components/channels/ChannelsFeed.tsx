"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Channel {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  subscriber_count: number;
  verified: boolean;
  category?: string;
}

interface ChannelPost {
  id: string;
  channel_id: string;
  content: string;
  media_urls: string[] | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  channel?: Channel;
}

export default function ChannelsFeed({
  following,
  trending,
  currentUserId,
}: {
  following: Channel[];
  trending: Channel[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"feed" | "entdecken">("feed");
  const [followedIds, setFollowedIds] = useState<Set<string>>(
    new Set(following.map((c) => c.id))
  );
  const [posts, setPosts] = useState<ChannelPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const supabase = createClient();

  const loadFeedPosts = useCallback(async () => {
    if (followedIds.size === 0) {
      setPosts([]);
      setLoadingPosts(false);
      return;
    }
    setLoadingPosts(true);
    const { data } = await supabase
      .from("channel_posts")
      .select(`
        id, channel_id, content, media_urls, created_at, likes_count, comments_count,
        channel:channels(id, name, avatar_url, verified)
      `)
      .in("channel_id", Array.from(followedIds))
      .order("created_at", { ascending: false })
      .limit(40);
    setPosts((data as any[]) ?? []);
    setLoadingPosts(false);
  }, [followedIds, supabase]);

  useEffect(() => {
    loadFeedPosts();
  }, [loadFeedPosts]);

  const toggleFollow = async (channelId: string) => {
    const isFollowing = followedIds.has(channelId);
    const newSet = new Set(followedIds);

    if (isFollowing) {
      newSet.delete(channelId);
      await supabase
        .from("channel_members")
        .delete()
        .eq("channel_id", channelId)
        .eq("user_id", currentUserId);
    } else {
      newSet.add(channelId);
      await supabase
        .from("channel_members")
        .insert({ channel_id: channelId, user_id: currentUserId });
    }
    setFollowedIds(newSet);
  };

  const toggleLike = async (postId: string) => {
    const liked = likedPosts.has(postId);
    const newLiked = new Set(likedPosts);
    if (liked) {
      newLiked.delete(postId);
    } else {
      newLiked.add(postId);
    }
    setLikedPosts(newLiked);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likes_count: p.likes_count + (liked ? -1 : 1) }
          : p
      )
    );
  };

  const filteredTrending = trending.filter((c) =>
    searchQuery
      ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      : true
  );

  const categories = Array.from(new Set(trending.map((c) => c.category).filter(Boolean)));

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div
        className="flex-none px-4 pt-safe border-b"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div
          className="flex items-center justify-between"
          style={{ height: "var(--header-height)" }}
        >
          <h1 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
            Kanäle
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/search")}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ color: "var(--foreground-3)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
            <button
              onClick={() => router.push("/channels/new")}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white"
              style={{ background: "var(--nexio-green)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 pb-0">
          {(["feed", "entdecken"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="pb-3 text-sm font-medium relative"
              style={{ color: tab === t ? "var(--nexio-green)" : "var(--foreground-3)" }}
            >
              {t === "feed" ? "Mein Feed" : "Entdecken"}
              {tab === t && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: "var(--nexio-green)" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "feed" ? (
          <FeedTab
            posts={posts}
            loading={loadingPosts}
            followedIds={followedIds}
            likedPosts={likedPosts}
            onLike={toggleLike}
            onToggleFollow={toggleFollow}
            trending={trending.filter((c) => !followedIds.has(c.id)).slice(0, 5)}
          />
        ) : (
          <EntdeckenTab
            channels={filteredTrending}
            followedIds={followedIds}
            onToggleFollow={toggleFollow}
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            categories={categories as string[]}
          />
        )}
      </div>
    </div>
  );
}

/* ─── Feed Tab ─────────────────────────────────────────────────── */
function FeedTab({
  posts,
  loading,
  followedIds,
  likedPosts,
  onLike,
  onToggleFollow,
  trending,
}: {
  posts: ChannelPost[];
  loading: boolean;
  followedIds: Set<string>;
  likedPosts: Set<string>;
  onLike: (id: string) => void;
  onToggleFollow: (id: string) => void;
  trending: Channel[];
}) {
  if (followedIds.size === 0) {
    return (
      <div className="flex flex-col items-center py-16 px-6 gap-4">
        <span className="text-5xl">📡</span>
        <p className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
          Noch keine Kanäle abonniert
        </p>
        <p className="text-sm text-center" style={{ color: "var(--foreground-3)" }}>
          Entdecke und abonniere Kanäle, um hier deinen personalisierten Feed zu sehen.
        </p>

        {trending.length > 0 && (
          <div className="w-full mt-4">
            <p className="text-sm font-semibold mb-3" style={{ color: "var(--foreground-2)" }}>
              Beliebte Kanäle
            </p>
            <div className="flex flex-col gap-2">
              {trending.map((c) => (
                <ChannelRow
                  key={c.id}
                  channel={c}
                  isFollowing={followedIds.has(c.id)}
                  onToggle={() => onToggleFollow(c.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl p-4 animate-pulse"
            style={{ background: "var(--surface)", height: 140 }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 pb-6">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          liked={likedPosts.has(post.id)}
          onLike={() => onLike(post.id)}
        />
      ))}
      {posts.length === 0 && (
        <div className="flex flex-col items-center py-16 gap-3" style={{ color: "var(--foreground-3)" }}>
          <span className="text-4xl">📭</span>
          <p className="text-sm">Noch keine Beiträge</p>
        </div>
      )}
    </div>
  );
}

/* ─── Post Card ─────────────────────────────────────────────────── */
function PostCard({
  post,
  liked,
  onLike,
}: {
  post: ChannelPost;
  liked: boolean;
  onLike: () => void;
}) {
  const channel = post.channel as any;
  const timeAgo = getTimeAgo(post.created_at);

  return (
    <div
      className="border-b px-4 py-4"
      style={{ borderColor: "var(--border)" }}
    >
      {/* Channel header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-base font-bold flex-none"
          style={{ background: "var(--nexio-green)", color: "white" }}
        >
          {channel?.avatar_url ? (
            <img src={channel.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            channel?.name?.[0]?.toUpperCase() ?? "K"
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
              {channel?.name ?? "Kanal"}
            </p>
            {channel?.verified && (
              <span style={{ color: "#1677ff" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: "var(--foreground-3)" }}>{timeAgo}</p>
        </div>
      </div>

      {/* Content */}
      <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--foreground)" }}>
        {post.content}
      </p>

      {/* Media */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div className={`grid gap-1 mb-3 rounded-xl overflow-hidden ${post.media_urls.length > 1 ? "grid-cols-2" : ""}`}>
          {post.media_urls.slice(0, 4).map((url, i) => (
            <img
              key={i}
              src={url}
              alt=""
              className="w-full object-cover rounded-xl"
              style={{ maxHeight: post.media_urls!.length > 1 ? 160 : 280 }}
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-5 mt-2">
        <button
          onClick={onLike}
          className="flex items-center gap-1.5 text-sm"
          style={{ color: liked ? "#ef4444" : "var(--foreground-3)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span>{post.likes_count}</span>
        </button>
        <button className="flex items-center gap-1.5 text-sm" style={{ color: "var(--foreground-3)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>{post.comments_count}</span>
        </button>
        <button className="flex items-center gap-1.5 text-sm ml-auto" style={{ color: "var(--foreground-3)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ─── Entdecken Tab ─────────────────────────────────────────────── */
function EntdeckenTab({
  channels,
  followedIds,
  onToggleFollow,
  searchQuery,
  onSearch,
  categories,
}: {
  channels: Channel[];
  followedIds: Set<string>;
  onToggleFollow: (id: string) => void;
  searchQuery: string;
  onSearch: (q: string) => void;
  categories: string[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filtered = selectedCategory
    ? channels.filter((c) => c.category === selectedCategory)
    : channels;

  return (
    <div className="px-4 pt-4 pb-8">
      {/* Search */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4"
        style={{ background: "var(--surface-2)" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--foreground-3)" }}>
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Kanäle suchen..."
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: "var(--foreground)" }}
        />
        {searchQuery && (
          <button onClick={() => onSearch("")} style={{ color: "var(--foreground-3)" }}>✕</button>
        )}
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex-none px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: !selectedCategory ? "var(--nexio-green)" : "var(--surface-2)",
              color: !selectedCategory ? "white" : "var(--foreground-2)",
            }}
          >
            Alle
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
              className="flex-none px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                background: selectedCategory === cat ? "var(--nexio-green)" : "var(--surface-2)",
                color: selectedCategory === cat ? "white" : "var(--foreground-2)",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Channels list */}
      <div className="flex flex-col gap-2">
        {filtered.map((channel) => (
          <ChannelRow
            key={channel.id}
            channel={channel}
            isFollowing={followedIds.has(channel.id)}
            onToggle={() => onToggleFollow(channel.id)}
            showSubscriberCount
          />
        ))}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-3" style={{ color: "var(--foreground-3)" }}>
            <span className="text-4xl">🔍</span>
            <p className="text-sm">Keine Kanäle gefunden</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Channel Row ───────────────────────────────────────────────── */
function ChannelRow({
  channel,
  isFollowing,
  onToggle,
  showSubscriberCount = false,
}: {
  channel: Channel;
  isFollowing: boolean;
  onToggle: () => void;
  showSubscriberCount?: boolean;
}) {
  const router = useRouter();
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-2xl border cursor-pointer"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      onClick={() => router.push(`/channels/${channel.id}`)}
    >
      {/* Avatar */}
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold flex-none overflow-hidden"
        style={{ background: "var(--nexio-green)", color: "white" }}
      >
        {channel.avatar_url ? (
          <img src={channel.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          channel.name[0]?.toUpperCase()
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
            {channel.name}
          </p>
          {channel.verified && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#1677ff">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        {channel.description && (
          <p className="text-xs truncate" style={{ color: "var(--foreground-3)" }}>
            {channel.description}
          </p>
        )}
        {showSubscriberCount && (
          <p className="text-xs mt-0.5" style={{ color: "var(--foreground-3)" }}>
            {formatCount(channel.subscriber_count)} Abonnenten
          </p>
        )}
      </div>

      {/* Follow button */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="flex-none px-3 py-1.5 rounded-full text-xs font-semibold"
        style={{
          background: isFollowing ? "var(--surface-2)" : "var(--nexio-green)",
          color: isFollowing ? "var(--foreground-2)" : "white",
          border: isFollowing ? "1px solid var(--border)" : "none",
        }}
      >
        {isFollowing ? "Abonniert" : "Abonnieren"}
      </button>
    </div>
  );
}

/* ─── Helpers ───────────────────────────────────────────────────── */
function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Gerade eben";
  if (mins < 60) return `vor ${mins} Min.`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `vor ${hrs} Std.`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `vor ${days} Tagen`;
  return new Date(dateStr).toLocaleDateString("de-DE", { day: "numeric", month: "short" });
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
