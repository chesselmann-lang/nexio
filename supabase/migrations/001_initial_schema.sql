-- ============================================================
-- SUPERCHAT — Initial Database Schema
-- Migration 001 | 2026-04-23
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_crypto";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE public.users (
  id                uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username          text UNIQUE NOT NULL,
  display_name      text NOT NULL,
  avatar_url        text,
  phone             text UNIQUE, -- E.164 format (+49...)
  public_key        text,        -- NaCl public key (base64) für E2E
  bio               text DEFAULT '',
  status            text DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline')),
  last_seen         timestamptz DEFAULT NOW(),
  privacy_settings  jsonb DEFAULT '{
    "last_seen": "contacts",
    "avatar": "everyone",
    "status": "contacts",
    "phone": "nobody"
  }'::jsonb,
  gdpr_consented_at timestamptz, -- DSGVO-Einwilligung
  created_at        timestamptz DEFAULT NOW(),
  updated_at        timestamptz DEFAULT NOW()
);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
CREATE TABLE public.conversations (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type            text NOT NULL CHECK (type IN ('direct', 'group', 'channel', 'mini_app')),
  name            text,           -- nur für group/channel
  avatar_url      text,
  description     text,
  created_by      uuid REFERENCES public.users(id) ON DELETE SET NULL,
  encrypted_key   text,           -- symmetrischer Key, E2E-verschlüsselt
  is_archived     boolean DEFAULT false,
  last_message_at timestamptz DEFAULT NOW(),
  created_at      timestamptz DEFAULT NOW(),
  updated_at      timestamptz DEFAULT NOW()
);

-- ============================================================
-- CONVERSATION MEMBERS
-- ============================================================
CREATE TABLE public.conversation_members (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role            text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  last_read_at    timestamptz DEFAULT NOW(),
  joined_at       timestamptz DEFAULT NOW(),
  is_muted        boolean DEFAULT false,
  is_pinned       boolean DEFAULT false,
  UNIQUE (conversation_id, user_id)
);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE public.messages (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type            text NOT NULL DEFAULT 'text' CHECK (type IN (
    'text', 'image', 'video', 'audio', 'file', 'payment', 'location', 'system', 'sticker'
  )),
  content         text,           -- E2E-verschlüsselt (Ciphertext, base64)
  media_url       text,
  media_metadata  jsonb,          -- {size, duration, width, height, mime_type}
  reply_to_id     uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  reactions       jsonb DEFAULT '{}'::jsonb,  -- {"❤️": ["uid1", "uid2"], ...}
  is_deleted      boolean DEFAULT false,
  deleted_at      timestamptz,
  edited_at       timestamptz,
  created_at      timestamptz DEFAULT NOW()
);

-- ============================================================
-- CONTACTS
-- ============================================================
CREATE TABLE public.contacts (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  contact_id  uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nickname    text,
  is_blocked  boolean DEFAULT false,
  created_at  timestamptz DEFAULT NOW(),
  UNIQUE (user_id, contact_id)
);

-- ============================================================
-- PAYMENTS (Phase 2 — Schema schon angelegt)
-- ============================================================
CREATE TABLE public.payments (
  id                        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id                 uuid NOT NULL REFERENCES public.users(id),
  receiver_id               uuid NOT NULL REFERENCES public.users(id),
  conversation_id           uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  amount_cents              integer NOT NULL CHECK (amount_cents > 0),
  currency                  text NOT NULL DEFAULT 'EUR',
  note                      text,
  status                    text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'
  )),
  stripe_payment_intent_id  text UNIQUE,
  created_at                timestamptz DEFAULT NOW(),
  updated_at                timestamptz DEFAULT NOW()
);

-- ============================================================
-- MINI APPS (Phase 2 — Schema schon angelegt)
-- ============================================================
CREATE TABLE public.mini_apps (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug          text UNIQUE NOT NULL,
  name          text NOT NULL,
  description   text,
  icon_url      text,
  developer_id  uuid REFERENCES public.users(id) ON DELETE SET NULL,
  entry_url     text NOT NULL,
  permissions   jsonb DEFAULT '[]'::jsonb,
  is_verified   boolean DEFAULT false,
  is_active     boolean DEFAULT true,
  install_count integer DEFAULT 0,
  created_at    timestamptz DEFAULT NOW()
);

-- ============================================================
-- INDEXES für Performance
-- ============================================================
CREATE INDEX idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_conversation_members_user ON public.conversation_members(user_id);
CREATE INDEX idx_conversation_members_conv ON public.conversation_members(conversation_id);
CREATE INDEX idx_contacts_user ON public.contacts(user_id);
CREATE INDEX idx_conversations_last_message ON public.conversations(last_message_at DESC);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_phone ON public.users(phone);

-- ============================================================
-- UPDATED_AT Trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FUNCTION: Auto-Update last_message_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_update_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- ============================================================
-- FUNCTION: Auto-Create User Profile nach Auth-Signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, display_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Neuer Nutzer'),
    NEW.phone
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mini_apps ENABLE ROW LEVEL SECURITY;

-- USERS: Eigenes Profil vollständig, andere nur öffentliche Felder
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_select_others" ON public.users
  FOR SELECT USING (true); -- Basis-Profil sichtbar; privacy_settings werden im Client geprüft

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- CONVERSATIONS: Nur sehen wenn Mitglied
CREATE POLICY "conversations_select_member" ON public.conversations
  FOR SELECT USING (
    id IN (
      SELECT conversation_id FROM public.conversation_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "conversations_insert_authenticated" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "conversations_update_member" ON public.conversations
  FOR UPDATE USING (
    id IN (
      SELECT conversation_id FROM public.conversation_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- CONVERSATION_MEMBERS: Nur eigene oder Mitglieder der gleichen Conversation
CREATE POLICY "conv_members_select" ON public.conversation_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR conversation_id IN (
      SELECT conversation_id FROM public.conversation_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "conv_members_insert" ON public.conversation_members
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.conversation_members
      WHERE conversation_id = conversation_members.conversation_id AND role IN ('owner', 'admin')
    )
    OR user_id = auth.uid() -- Selbst beitreten (öffentliche Gruppen)
  );

CREATE POLICY "conv_members_update_own" ON public.conversation_members
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "conv_members_delete_own" ON public.conversation_members
  FOR DELETE USING (user_id = auth.uid());

-- MESSAGES: Nur lesen wenn Mitglied der Conversation
CREATE POLICY "messages_select_member" ON public.messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM public.conversation_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "messages_insert_member" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT conversation_id FROM public.conversation_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "messages_update_own" ON public.messages
  FOR UPDATE USING (sender_id = auth.uid());

-- CONTACTS: Nur eigene Kontakte
CREATE POLICY "contacts_own" ON public.contacts
  FOR ALL USING (user_id = auth.uid());

-- PAYMENTS: Sender und Empfänger
CREATE POLICY "payments_participant" ON public.payments
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "payments_insert_sender" ON public.payments
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- MINI_APPS: Alle aktiven sehen, eigene verwalten
CREATE POLICY "mini_apps_select_active" ON public.mini_apps
  FOR SELECT USING (is_active = true);

CREATE POLICY "mini_apps_manage_own" ON public.mini_apps
  FOR ALL USING (developer_id = auth.uid());

-- ============================================================
-- REALTIME: Tabellen für Realtime aktivieren
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
