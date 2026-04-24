-- ============================================================
-- NEXIO — Storage & Additional Functions
-- Migration 002
-- ============================================================

-- Storage Bucket für Media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'nexio-media',
  'nexio-media',
  true,
  52428800, -- 50 MB
  ARRAY['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/webm','audio/mpeg','audio/ogg','application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Nur Mitglieder der Conversation dürfen hochladen
CREATE POLICY "nexio_media_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'nexio-media'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "nexio_media_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'nexio-media');

-- ============================================================
-- FUNCTION: Unread Count pro Conversation
-- ============================================================
CREATE OR REPLACE FUNCTION get_unread_count(p_conversation_id uuid, p_user_id uuid)
RETURNS integer AS $$
DECLARE
  v_last_read timestamptz;
  v_count integer;
BEGIN
  SELECT last_read_at INTO v_last_read
  FROM public.conversation_members
  WHERE conversation_id = p_conversation_id AND user_id = p_user_id;

  SELECT COUNT(*) INTO v_count
  FROM public.messages
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND created_at > COALESCE(v_last_read, '1970-01-01'::timestamptz)
    AND is_deleted = false;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: Direct Conversation zwischen zwei Usern finden/erstellen
-- ============================================================
CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(
  p_user_a uuid,
  p_user_b uuid
)
RETURNS uuid AS $$
DECLARE
  v_conv_id uuid;
BEGIN
  -- Suche bestehende direkte Conversation
  SELECT cm1.conversation_id INTO v_conv_id
  FROM public.conversation_members cm1
  JOIN public.conversation_members cm2 ON cm1.conversation_id = cm2.conversation_id
  JOIN public.conversations c ON c.id = cm1.conversation_id
  WHERE cm1.user_id = p_user_a
    AND cm2.user_id = p_user_b
    AND c.type = 'direct'
  LIMIT 1;

  -- Falls nicht vorhanden: erstellen
  IF v_conv_id IS NULL THEN
    INSERT INTO public.conversations (type, created_by)
    VALUES ('direct', p_user_a)
    RETURNING id INTO v_conv_id;

    INSERT INTO public.conversation_members (conversation_id, user_id, role) VALUES
      (v_conv_id, p_user_a, 'owner'),
      (v_conv_id, p_user_b, 'member');
  END IF;

  RETURN v_conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STATUS Update (Presence)
-- ============================================================
CREATE OR REPLACE FUNCTION update_user_status(p_status text)
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET status = p_status, last_seen = NOW()
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Index für Presence-Queries
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON public.users(last_seen DESC);
