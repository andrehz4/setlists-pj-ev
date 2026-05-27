-- Migração 003: campos editáveis no perfil de fórum.
-- Permite o usuário editar bio, email, ano de nascimento e shows que esteve.
-- Rodar no Supabase SQL Editor. Idempotente.

ALTER TABLE forum_users
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS birth_year int,
  ADD COLUMN IF NOT EXISTS shows_attended text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS city text;

-- Constraints suaves: limite de tamanho
ALTER TABLE forum_users
  DROP CONSTRAINT IF EXISTS forum_users_bio_len_chk;
ALTER TABLE forum_users
  ADD CONSTRAINT forum_users_bio_len_chk CHECK (bio IS NULL OR char_length(bio) <= 500);

ALTER TABLE forum_users
  DROP CONSTRAINT IF EXISTS forum_users_email_len_chk;
ALTER TABLE forum_users
  ADD CONSTRAINT forum_users_email_len_chk CHECK (email IS NULL OR char_length(email) <= 200);

ALTER TABLE forum_users
  DROP CONSTRAINT IF EXISTS forum_users_birth_year_chk;
ALTER TABLE forum_users
  ADD CONSTRAINT forum_users_birth_year_chk CHECK (birth_year IS NULL OR (birth_year >= 1900 AND birth_year <= 2100));

ALTER TABLE forum_users
  DROP CONSTRAINT IF EXISTS forum_users_city_len_chk;
ALTER TABLE forum_users
  ADD CONSTRAINT forum_users_city_len_chk CHECK (city IS NULL OR char_length(city) <= 80);
