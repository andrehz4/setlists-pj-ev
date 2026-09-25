-- Migração 004: envios de colaboradores (módulo backend/app/contrib).
-- Só cria tabelas e índices NOVOS; não altera nem referencia tabela do fórum.
-- Rodar no Supabase SQL Editor. Idempotente.

-- Quem pode postar (acesso só por convite, aprovado pelo Andre).
-- Identidade própria do painel (login Google direto), independente do fórum.
CREATE TABLE IF NOT EXISTS contrib_membros (
  id          uuid PRIMARY KEY,
  email       text NOT NULL UNIQUE,
  google_sub  text UNIQUE,
  nome        text,
  avatar      text,
  status      text NOT NULL DEFAULT 'pendente',
  pedido_em   timestamptz NOT NULL DEFAULT now(),
  decidido_em timestamptz,
  avisado_em  timestamptz,
  CONSTRAINT contrib_membros_status_chk CHECK (status IN ('pendente', 'aprovado', 'bloqueado'))
);

CREATE TABLE IF NOT EXISTS contrib_submissions (
  id              uuid PRIMARY KEY,
  site            text NOT NULL,
  user_id         uuid NOT NULL REFERENCES contrib_membros(id) ON UPDATE CASCADE ON DELETE CASCADE,
  status          text NOT NULL DEFAULT 'enviado',
  title           text NOT NULL,
  body            text NOT NULL,
  media           jsonb NOT NULL DEFAULT '[]'::jsonb,
  video_opts      jsonb,
  agreed_rules_at timestamptz NOT NULL,
  scheduled_at    timestamptz NOT NULL,
  reason          text,
  ai_verdict      jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contrib_status_chk CHECK (
    status IN ('enviado', 'aprovado', 'ajustado', 'recusado', 'publicado', 'cancelado')
  ),
  CONSTRAINT contrib_title_len_chk CHECK (char_length(title) BETWEEN 3 AND 120),
  CONSTRAINT contrib_body_len_chk CHECK (char_length(body) BETWEEN 20 AND 5000)
);

-- 1 post de colaborador por slot (:30). Recusado/cancelado libera o horário.
CREATE UNIQUE INDEX IF NOT EXISTS contrib_slot_unico
  ON contrib_submissions (site, scheduled_at)
  WHERE status NOT IN ('recusado', 'cancelado');

-- Limite diário e "Meus envios".
CREATE INDEX IF NOT EXISTS contrib_user_created
  ON contrib_submissions (user_id, created_at DESC);

-- Fila da curadoria (fase 3).
CREATE INDEX IF NOT EXISTS contrib_status_scheduled
  ON contrib_submissions (status, scheduled_at);
