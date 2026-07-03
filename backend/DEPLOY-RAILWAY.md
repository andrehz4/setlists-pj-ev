# Deploy do backend do fórum (Railway + Supabase)

Doc de referência pro backend FastAPI do fórum. Fonte da verdade sobre onde e como o
fórum roda e como diagnosticar "fórum caiu". Ler isto antes de mexer em infra do fórum.

## Arquitetura real (IMPORTANTE, não é óbvia)

O fórum do PJ e o app **Terra Gentil** compartilham a MESMA base de código de backend e
o MESMO banco Supabase. O deploy no Railway que atende o fórum PJ roda, na prática, o
backend do Terra Gentil (que é um superset: tem `/v1/diagnostico` + todas as rotas de
fórum `/forum`, `/auth`, `/feed`). Os dois "apps" são o mesmo servidor, multi-tenant
pela coluna `site` do banco (`pj` vs `terra-gentil`), resolvida pelo header `Origin`
da request (`resolve_site` em `dependencies.py` / `SITE_ORIGINS`).

Consequência prática:
- `GET /` responde `{"app":"Terra Gentil API"}` mesmo servindo o fórum PJ. Isso é
  ESPERADO, não é bug. Não confiar no título do `/` pra dizer se o fórum está no ar.
- `GET /health/db` pode dar 404 (a variante Terra Gentil pode não expor essa rota).
- O teste de vida REAL do fórum é `GET /forum/topics` com o Origin do site (abaixo).
- Como o banco é compartilhado, se ele cair, os DOIS apps caem juntos; se for
  mantido vivo, os dois ficam vivos.

## Onde roda

- **Plataforma app:** Railway (conta do Andre, eng.andrehz@gmail.com).
- **URL de produção:** `https://perpetual-energy-production-1a69.up.railway.app`
  (referenciada em `forum.html`, `forum-topic.html`, `forum-profile.html`,
  `scripts/news/forum-seed.mjs`).
- **Código:** repo `github.com/andrehz4/setlists-pj-ev` (`backend/`) OU o repo do
  Terra Gentil (`terra-gentil/terra-gentil-app`, `backend/`) - são equivalentes nas
  rotas de fórum. O deploy vigente roda o do Terra Gentil.
- **Banco:** Postgres no **Supabase (free tier)**, via `DATABASE_URL` (asyncpg),
  compartilhado com o Terra Gentil.

## Incidente conhecido: fórum "cai" = Supabase pausou (causa mais comum)

**Sintoma:** o front do fórum trava em "Carregando..." ou dá erro; `GET /forum/topics`
com Origin devolve **500 InternalServerError** (falha de conexão com o banco), enquanto
`GET /` e `/health` seguem 200 (o app está de pé, o banco é que não responde).

**Causa raiz:** o **free tier do Supabase pausa o projeto após ~7 dias sem atividade**
no banco. Pausado, toda query falha e o fórum morre. Ao despausar (manual no painel do
Supabase, ou por atividade), volta sozinho. Foi o que aconteceu em 2026-07-03.

**Conserto imediato:** entrar no painel do Supabase e dar "Restore/Resume" no projeto.
Em ~1 min o fórum volta. Confirmar com o curl de `/forum/topics` abaixo (200 com dados).

**Solução definitiva grátis:** ver seção "Manter o Supabase acordado" abaixo.

### (Histórico) confusão de repo no Railway
Já houve suspeita de que o serviço Railway estava com a Source no repo errado. Na
verdade, por causa da arquitetura compartilhada acima, o `/` dizer "Terra Gentil API"
é NORMAL. Só tratar como troca-de-repo se `/forum/topics` (com Origin) parar de existir
(404 na rota inteira), o que é diferente de 500 (banco fora).

## Diagnóstico (por fora, sem painel)

```
B=https://perpetual-energy-production-1a69.up.railway.app

curl -s "$B/health"
# 200 {"status":"ok",...} = app de pé. (Não diz nada sobre o banco.)

curl -s -H "Origin: https://setlists-pj-ev.pages.dev" "$B/forum/topics"
# 200 com {"items":[...]}  = fórum OK (app + banco).
# 500 "InternalServerError" = banco fora -> Supabase provavelmente pausou.
# 403 "Origem não autorizada" = faltou o header Origin (normal via curl sem ele).
# 404 na rota = aí sim o deploy não tem o código de fórum (raro).
```

## Manter o Supabase acordado (solução grátis, sem migração)

Qualquer query no banco zera o contador de inatividade do Supabase. Um cron simples que
bate no banco 1x por dia mantém o projeto (e os dois apps) vivos de graça, sem tocar em
nada de infra. Implementado como workflow `keep-db-awake.yml` (GitHub Actions):
`curl` diário em `/forum/topics` com o Origin do site. Ver esse workflow.

Alternativa robusta (se o pause voltar a incomodar): migrar o banco pro **Neon** (free
tier que auto-resume na conexão, não precisa despausar na mão). `pg_dump` do Supabase ->
restore no Neon -> trocar `DATABASE_URL`. Com o pooler do Neon (PgBouncer transaction
mode), passar `statement_cache_size=0` no asyncpg (`db.py`). Decidir antes se migra os
dois apps (banco compartilhado) ou separa.

## Envs do serviço (Railway) - obrigatórias em produção

- `ENVIRONMENT=production`
- `DATABASE_URL` (Postgres do Supabase)
- `JWT_SECRET` (se vazio, o app assina JWT com string vazia = tokens forjáveis)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `SITE_ORIGINS=https://setlists-pj-ev.pages.dev=pj` (+ a origem do Terra Gentil)
- `FORUM_CORS_ORIGIN=https://setlists-pj-ev.pages.dev`
- `FORUM_BOT_KEY` (pro seeder semanal `forum-seed.yml`; sem ela o endpoint fica off)
- `ADMIN_USER_IDS` (Google sub dos admins)

## Observações

- O código do fórum está 100% no repo (`backend/`), testes passam (`pytest`, 84+).
  Nunca foi perda de código; as quedas foram sempre banco (Supabase pause) ou infra.
- Deploy do app é automático no push do repo conectado no Railway.
