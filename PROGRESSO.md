# PROGRESSO, setlists-pj-ev

## Data
2026-05-18

## Estado atual
Fórum da comunidade implementado e no GitHub. Railway ainda não configurado.

## O que foi feito hoje (2026-05-18) — sessao do forum

### Forum implementado (commits 1299d7b e 3f71272)
- `backend/` FastAPI criado dentro do repo setlists-pj-ev
  - Google OAuth 2.0 (authlib + Starlette sessions)
  - JWT HS256 7 dias (python-jose)
  - asyncpg + Supabase PostgreSQL
  - SlowAPI rate limit 1 post/min por IP
  - Isolamento por site: coluna `site` em todas as tabelas, _resolve_site() via Origin header
  - CORS derivado dinamicamente de SITE_ORIGINS env var
  - 12 testes unitarios em tests/test_site_isolation.py
- `forum.html` — lista de topicos, paginacao, categorias, composer modal
- `forum-topic.html` — thread completa, reply, report
- `auth-callback.html` — captura token OAuth e redireciona
- `index.html` — link "Comunidade" no nav
- `FORUM_HANDOFF.md` — SQL atualizado com coluna `site` e indices

### Arquitetura de isolamento
- Um unico servico Railway serve PJ e terra-gentil
- Site derivado do Origin HTTP header (nao do frontend)
- SITE_ORIGINS env var: "https://setlists-pj-ev.pages.dev=pj,https://terra-gentil.pages.dev=terra-gentil"
- Banco tem CHECK constraints impedindo valores invalidos

## Proximo passo concreto — Railway setup (onde paramos)

### Ordem exata a executar:

1. **Supabase** — Andre roda SQL do FORUM_HANDOFF.md (tabelas com coluna site)

2. **Google Cloud Console** — criar credenciais OAuth
   - Acesse console.cloud.google.com → APIs & Services → Credentials
   - Create Credentials → OAuth 2.0 Client ID → Web application
   - Authorized redirect URI: `https://<railway-url>/auth/google/callback`
   - Salva CLIENT_ID e CLIENT_SECRET

3. **Railway**
   - New Project → Deploy from GitHub → andrehz4/setlists-pj-ev
   - Root Directory: `backend`
   - Adicionar variaveis de ambiente:
     ```
     DATABASE_URL        = <Supabase connection string>
     GOOGLE_CLIENT_ID    = <do Google Cloud Console>
     GOOGLE_CLIENT_SECRET= <do Google Cloud Console>
     JWT_SECRET          = <gerar: python -c "import secrets; print(secrets.token_hex(32))">
     FORUM_CORS_ORIGIN   = https://setlists-pj-ev.pages.dev
     SITE_ORIGINS        = https://setlists-pj-ev.pages.dev=pj
     ENVIRONMENT         = production
     ```
   - Copiar a URL gerada pelo Railway (ex: smufdpj-forum.up.railway.app)

4. **Frontend** — substituir placeholder pela URL real do Railway
   - forum.html linha 1 do script: `const API_BASE = "https://SUBSTITUIR..."`
   - forum-topic.html linha 1 do script: idem

5. **Google Cloud Console** — voltar e adicionar a URL do Railway como redirect URI

6. **Testar** — abrir forum.html, clicar "Entrar com Google", verificar fluxo completo

## Estado anterior (sessao de 2026-05-17 — bugs e pipeline)
- Reddit RSS retornando 403 de IPs do GitHub Actions
- Pipeline de news/community funcionando menos Reddit
- Reddit OAuth pendente (CLIENT_ID e CLIENT_SECRET em branco nos secrets)

## Arquivos-chave
- `backend/app/main.py` — entry point FastAPI
- `backend/app/routes/forum.py` — endpoints + _resolve_site()
- `backend/app/core/config.py` — SITE_ORIGINS e site_origin_map
- `backend/tests/test_site_isolation.py` — 12 testes
- `FORUM_HANDOFF.md` — SQL completo para rodar no Supabase
- `forum.html`, `forum-topic.html`, `auth-callback.html` — paginas frontend

## Blockers
- Railway ainda nao configurado (parou aqui)
- Supabase: tabelas ainda nao criadas (Andre faz manualmente)
- Google Cloud Console: credenciais OAuth ainda nao criadas
- forum.html e forum-topic.html: API_BASE ainda com placeholder
