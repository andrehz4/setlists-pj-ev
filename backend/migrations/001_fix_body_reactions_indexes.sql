-- Migracao 001: corrige o 500 ao postar fotos, cria reactions e indices.
-- Rodar no Supabase (SQL Editor) uma unica vez, em ordem.
-- Idempotente: pode rodar de novo sem quebrar.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CAUSA RAIZ DO 500 AO POSTAR FOTO
-- A coluna body provavelmente era VARCHAR(5000). Uma foto em base64 (~30KB)
-- passa na validacao do Pydantic (200000) mas estoura o limite da coluna,
-- e o Postgres lanca "value too long" -> 500. TEXT nao tem esse limite.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE forum_topics ALTER COLUMN body TYPE text;
ALTER TABLE forum_posts  ALTER COLUMN body TYPE text;

-- Garante que topico recem-criado nunca fique com last_post_at nulo.
ALTER TABLE forum_topics ALTER COLUMN last_post_at SET DEFAULT now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TABELA DE REACTIONS (necessaria para o endpoint POST /forum/reactions)
-- Tipos: tava_la, mata, curtir, salvar. target_type: topic | post.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_reactions (
    id          uuid PRIMARY KEY,
    target_id   uuid NOT NULL,
    target_type text NOT NULL CHECK (target_type IN ('topic', 'post')),
    type        text NOT NULL CHECK (type IN ('tava_la', 'mata', 'curtir', 'salvar')),
    user_id     uuid NOT NULL REFERENCES forum_users(id) ON DELETE CASCADE,
    site        text NOT NULL CHECK (site IN ('pj', 'terra-gentil')),
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, target_id, target_type, type)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. INDICES (resolvem N+1 e aceleram filtros por site/categoria)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_forum_posts_topic_id   ON forum_posts (topic_id);
CREATE INDEX IF NOT EXISTS idx_forum_topics_site_cat   ON forum_topics (site, category);
CREATE INDEX IF NOT EXISTS idx_forum_topics_last_post  ON forum_topics (site, last_post_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_reactions_target  ON forum_reactions (target_id, target_type, type);
CREATE INDEX IF NOT EXISTS idx_forum_reactions_user    ON forum_reactions (user_id, target_id, target_type);
