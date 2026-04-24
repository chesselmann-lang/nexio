-- ============================================================
-- NEXIO — Komplettes Setup (Migration 001 + 002 zusammen)
-- Diesen Inhalt in Supabase Dashboard → SQL Editor einfügen
-- und ausführen (Run)
-- ============================================================

-- Führe in dieser Reihenfolge aus:
-- 1. Dieses Script im Supabase SQL Editor ausführen
-- 2. Authentication → Providers → Phone → Enable
-- 3. Storage → nexio-media Bucket wird automatisch angelegt

\i migrations/001_initial_schema.sql
\i migrations/002_storage_and_functions.sql
