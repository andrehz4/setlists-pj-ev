-- Migração 004: envios de colaboradores (módulo backend/app/contrib).
-- Só cria tabela e índices NOVOS; não altera nenhuma tabela do fórum.
-- Rodar no Supabase SQL Editor. Idempotente.

CREATE TABLE IF NOT EXISTS contrib_submissions (
  id              uuid PRIMARY KEY,
  site            text NOT NULL,
  user_id         uuid NOT NULL REFERENCES forum_users(id) ON DELETE CASCADE,
  status          text NOT NULL DEFAULT 'enviado',
  title           text NOT NULL,
  body            text NOT NULL,
  media           jsonb NOT NULL DEFAULT '[]'::jsonb,
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

-- Quem pode postar (acesso só por convite, aprovado pelo Andre).
CREATE TABLE IF NOT EXISTS contrib_membros (
  email       text PRIMARY KEY,
  user_id     uuid UNIQUE REFERENCES forum_users(id) ON DELETE SET NULL,
  nome        text,
  status      text NOT NULL DEFAULT 'pendente',
  pedido_em   timestamptz NOT NULL DEFAULT now(),
  decidido_em timestamptz,
  CONSTRAINT contrib_membros_status_chk CHECK (status IN ('pendente', 'aprovado', 'bloqueado'))
);
