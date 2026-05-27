-- Migração 002: ancoragem de tópicos a shows da Timeline.
-- Permite filtrar conversas do fórum atreladas a um show específico
-- (ex: drawer da Timeline ganha aba "Conversa" daquele show).
-- Rodar no Supabase SQL Editor uma única vez. Idempotente.

ALTER TABLE forum_topics
  ADD COLUMN IF NOT EXISTS anchor_show_id text;

CREATE INDEX IF NOT EXISTS idx_forum_topics_anchor_show
  ON forum_topics (anchor_show_id)
  WHERE anchor_show_id IS NOT NULL;
