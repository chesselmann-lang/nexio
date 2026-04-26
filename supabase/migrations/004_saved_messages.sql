-- ============================================================
-- NEXIO Migration 004 — Saved Messages
-- Führe diesen SQL im Supabase Dashboard → SQL Editor aus
-- ============================================================

-- Table: saved_messages
-- Each row = one bookmarked message for a user
CREATE TABLE IF NOT EXISTS public.saved_messages (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message_id      uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  note            text,                             -- optional personal note
  saved_at        timestamptz DEFAULT NOW(),
  UNIQUE (user_id, message_id)                      -- no duplicates
);

-- RLS
ALTER TABLE public.saved_messages ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own saved messages
CREATE POLICY "saved_messages_own" ON public.saved_messages
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Index for fast lookup by user, ordered by save time
CREATE INDEX IF NOT EXISTS idx_saved_messages_user_saved_at
  ON public.saved_messages (user_id, saved_at DESC);
