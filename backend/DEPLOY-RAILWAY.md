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

## Duas cópias do código do fórum (atenção)

O que roda em produção é `/Users/andrehz/Documents/Githubhz/terra-gentil-app/backend` (repo do Terra Gentil). O
`backend/` deste repo é uma cópia do fórum que ficou PARA TRÁS em funcionalidade (lá já existe editar tópico e
resposta, por exemplo). Só o painel de colaboradores (`app/contrib/`) tem a fonte da verdade aqui e é levado pra lá
por `scripts/contrib/sync-terra-gentil.sh`.

Em 2026-10-03 a vistoria corrigiu aqui, e AINDA PRECISA SER PORTADO pro terra-gentil-app:
- E-mail no perfil público `GET /forum/users/{id}`: só o dono vê (lá: `app/routes/forum.py`, SELECT com `email`).
- `JWT_SECRET` obrigatório (32+ caracteres) em produção (`app/core/config.py`) e `/docs` fechado em produção.
- python-jose (CVEs) trocado por PyJWT; authlib, fastapi/starlette e python-dotenv atualizados (`requirements.txt`).
  O sync do painel recusa rodar enquanto o requirements de lá não tiver `pyjwt`.
- Rate limit pela ÚLTIMA entrada do X-Forwarded-For (a primeira é forjável). Antes de portar, confirmar no Railway
  que o proxy anexa o IP real no fim do cabeçalho (logar `x-forwarded-for` de uma request real).
- Ids de rota validados como UUID (422 em vez de 500), paginação do feed com limites, foto do feed só https,
  rate limit nas rotas de escrita, pool com `command_timeout`, Dockerfile sem root.

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

curl -s -H "Origin: https://somaisumfadepearljam.com.br" "$B/forum/topics"
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
- `JWT_SECRET` (obrigatório, 32+ caracteres: desde 2026-10-03 o app NÃO sobe em produção sem ele)
  (a sessão do OAuth e o JWT do painel de colaboradores derivam dele)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `SITE_ORIGINS=https://somaisumfadepearljam.com.br=pj,https://setlists-pj-ev.pages.dev=pj` (+ a origem do Terra Gentil).
  O pages.dev fica porque os robôs (contrib-curadoria, keep-db-awake, forum-seed) ainda mandam esse Origin.
- `FORUM_CORS_ORIGIN=https://somaisumfadepearljam.com.br,https://setlists-pj-ev.pages.dev`
- `FORUM_BOT_KEY` (pro seeder semanal `forum-seed.yml`; sem ela o endpoint fica off)
- `ADMIN_USER_IDS` (Google sub dos admins)

## Observações

- O código do fórum está 100% no repo (`backend/`), testes passam (`pytest`, 200+, CI em `.github/workflows/backend-ci.yml`).
  Nunca foi perda de código; as quedas foram sempre banco (Supabase pause) ou infra.
- Deploy do app é automático no push do repo conectado no Railway.
