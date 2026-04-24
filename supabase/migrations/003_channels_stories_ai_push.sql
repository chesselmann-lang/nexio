-- ============================================================
-- NEXIO — Extended Schema
-- Migration 003 | 2026-04-24
-- Channels, Stories, AI Sessions, Push Subscriptions, Translations
-- ============================================================

-- ============================================================
-- CHANNELS (Broadcast / Follow model — like Telegram Channels)
-- ============================================================
CREATE TABLE public.channels (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             text NOT NULL,
  description      text,
  avatar_url       text,
  owner_id         uuid REFERENCES public.users(id) ON DELETE SET NULL,
  category         text,
  subscriber_count integer DEFAULT 0,
  verified         boolean DEFAULT false,
  is_active        boolean DEFAULT true,
  created_at       timestamptz DEFAULT NOW()
);

CREATE TABLE public.channel_members (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at  timestamptz DEFAULT NOW(),
  UNIQUE (channel_id, user_id)
);

CREATE TABLE public.channel_posts (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id     uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  content        text,
  media_urls     text[],
  likes_count    integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at     timestamptz DEFAULT NOW()
);

-- ============================================================
-- STORIES / MOMENTE (24h ephemeral content)
-- ============================================================
CREATE TABLE public.stories (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id  uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content    text,
  media_url  text,
  media_type text,
  likes      uuid[] DEFAULT '{}',
  views      uuid[] DEFAULT '{}',
  expires_at timestamptz NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at timestamptz DEFAULT NOW()
);

-- ============================================================
-- AI ASSISTANT (Claude-powered sessions)
-- ============================================================
CREATE TABLE public.ai_sessions (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title            text NOT NULL DEFAULT 'Neues Gespräch',
  system_prompt    text,
  last_message_at  timestamptz DEFAULT NOW(),
  message_count    integer DEFAULT 0,
  created_at       timestamptz DEFAULT NOW()
);

CREATE TABLE public.ai_messages (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL REFERENCES public.ai_sessions(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('user', 'assistant')),
  content    text NOT NULL,
  created_at timestamptz DEFAULT NOW()
);

-- ============================================================
-- WEB PUSH SUBSCRIPTIONS
-- ============================================================
CREATE TABLE public.push_subscriptions (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint   text NOT NULL,
  p256dh     text,
  auth       text,
  updated_at timestamptz DEFAULT NOW(),
  created_at timestamptz DEFAULT NOW(),
  UNIQUE (user_id, endpoint)
);

-- ============================================================
-- MESSAGE TRANSLATION CACHE
-- ============================================================
CREATE TABLE public.message_translations (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id  uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  target_lang text NOT NULL,
  translation text NOT NULL,
  created_at  timestamptz DEFAULT NOW(),
  UNIQUE (message_id, target_lang)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_channel_posts_channel ON public.channel_posts(channel_id, created_at DESC);
CREATE INDEX idx_channel_members_user ON public.channel_members(user_id);
CREATE INDEX idx_stories_expires ON public.stories(expires_at DESC);
CREATE INDEX idx_stories_author ON public.stories(author_id);
CREATE INDEX idx_ai_sessions_user ON public.ai_sessions(user_id, last_message_at DESC);
CREATE INDEX idx_ai_messages_session ON public.ai_messages(session_id, created_at ASC);
CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions(user_id);
CREATE INDEX idx_message_translations_message ON public.message_translations(message_id, target_lang);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_translations ENABLE ROW LEVEL SECURITY;

-- Channels: public read, owner manages
CREATE POLICY "channels_select_active" ON public.channels FOR SELECT USING (is_active = true);
CREATE POLICY "channels_manage_owner" ON public.channels FOR ALL USING (owner_id = auth.uid());

-- Channel members: own subscriptions
CREATE POLICY "channel_members_own" ON public.channel_members FOR ALL USING (user_id = auth.uid());
CREATE POLICY "channel_members_read" ON public.channel_members FOR SELECT USING (true);

-- Channel posts: all can read active channel posts
CREATE POLICY "channel_posts_read" ON public.channel_posts FOR SELECT USING (
  channel_id IN (SELECT id FROM public.channels WHERE is_active = true)
);

-- Stories: author owns, all can read non-expired
CREATE POLICY "stories_read" ON public.stories FOR SELECT USING (expires_at > NOW());
CREATE POLICY "stories_own" ON public.stories FOR ALL USING (author_id = auth.uid());

-- AI sessions/messages: private to owner
CREATE POLICY "ai_sessions_own" ON public.ai_sessions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "ai_messages_own" ON public.ai_messages FOR ALL USING (
  session_id IN (SELECT id FROM public.ai_sessions WHERE user_id = auth.uid())
);

-- Push subscriptions: private
CREATE POLICY "push_subscriptions_own" ON public.push_subscriptions FOR ALL USING (user_id = auth.uid());

-- Message translations: readable by conversation members
CREATE POLICY "translations_read" ON public.message_translations FOR SELECT USING (
  message_id IN (
    SELECT id FROM public.messages WHERE conversation_id IN (
      SELECT conversation_id FROM public.conversation_members WHERE user_id = auth.uid()
    )
  )
);

-- ============================================================
-- REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_posts;
