# Deploy do backend do fórum (Railway)

Doc de referência pro fluxo de deploy do backend FastAPI do fórum. Fonte da verdade
sobre onde e como o fórum roda. Ler isto antes de mexer em qualquer coisa de infra do
fórum ou diagnosticar "fórum caiu".

## Onde o fórum roda

- **Plataforma:** Railway (conta/assinatura paga do Andre, eng.andrehz@gmail.com).
- **Repo conectado:** `github.com/andrehz4/setlists-pj-ev`
- **Root directory do serviço:** `backend/`
- **Build:** Dockerfile (ver `backend/railway.json` + `backend/Dockerfile`).
- **Healthcheck:** `GET /health` (liveness leve, não toca o banco).
- **URL de produção:** `https://perpetual-energy-production-1a69.up.railway.app`
  (a mesma referenciada em `forum.html`, `forum-topic.html`, `forum-profile.html`,
  `scripts/news/forum-seed.mjs`).
- **Banco:** Postgres no Supabase, via `DATABASE_URL` (asyncpg).

## Conta vs Projeto vs Serviço (a confusão que derruba o fórum)

No Railway a hierarquia é:

- **Conta** = a assinatura. Uma só (o que o Andre paga).
- **Projeto** = uma caixa que agrupa serviços dentro da conta.
- **Serviço** = UM app rodando. Cada serviço roda um único app.

Regra que importa: **vários serviços na mesma conta NÃO custam a mais por serviço.**
O Railway cobra por uso de recurso (CPU/RAM/rede), não por número de serviços. Então
dá pra ter o fórum e outros apps (ex: Terra Gentil) na mesma conta/assinatura, cada um
no SEU serviço, sem sacrificar nenhum. O que NÃO funciona é um serviço servir dois
apps: cada `main.py`/repo precisa do seu serviço.

## Incidente conhecido: fórum servindo o app errado

**Sintoma:** o fórum some do ar; o front mostra "Carregando..." eterno ou erro de rede.

**Causa raiz (ocorreu em ~2026-06/07):** o serviço do fórum
(`perpetual-energy-production-1a69`) teve a FONTE (Source / repo GitHub) trocada, e
passou a buildar o repo do Terra Gentil (`github.com/terra-gentil/terra-gentil-app`)
em vez do `andrehz4/setlists-pj-ev`. Resultado: a URL do fórum passou a responder a
"Terra Gentil API". O backend do fórum ficou sem serviço rodando. Acontece fácil na
UI do Railway ao conectar um repo novo reusando um serviço existente em vez de criar
um novo.

## Como diagnosticar (sem acesso ao painel)

O vínculo serviço-repo NÃO está em nenhum arquivo do código (mora no banco do Railway).
Então lendo o repo não dá pra saber pra onde o serviço aponta. Diagnostica por fora,
batendo na URL:

```
curl -s https://perpetual-energy-production-1a69.up.railway.app/
# ESPERADO (fórum ok):   {"app":"SMUFDPJ Forum API","version":"1.0.0","docs":"/docs"}
# PROBLEMA (app errado): {"app":"Terra Gentil API","version":"0.1.0","docs":"/docs"}

curl -s https://perpetual-energy-production-1a69.up.railway.app/openapi.json | head -c 300
# ok = rotas /forum, /auth, /feed. Errado = /v1/diagnostico (Terra Gentil).

# 403 em /forum/topics SEM header Origin é NORMAL (resolve_site exige Origin conhecida).
# Testar com o Origin real do site:
curl -s -H "Origin: https://setlists-pj-ev.pages.dev" \
  https://perpetual-energy-production-1a69.up.railway.app/forum/topics
# ok = JSON de tópicos. 500 "InternalServerError" = app do fórum não está rodando ali.
```

## Como consertar (só no painel do Railway, precisa do Andre logado)

1. Abrir `railway.com` -> projeto do fórum.
2. Achar o serviço com a URL `perpetual-energy-production-1a69` (ou o que estiver com a
   URL do fórum).
3. Settings -> **Source**: garantir que o repo é `andrehz4/setlists-pj-ev` e o
   **Root Directory** é `backend/`. Se estiver no repo do Terra Gentil, trocar de volta.
   - Alternativa limpa: criar um serviço NOVO no mesmo projeto apontando pro repo/root
     certo (sem custo extra) e atualizar a URL no front se o domínio mudar.
4. Conferir as **Variables** (envs) do serviço, todas obrigatórias em produção:
   - `ENVIRONMENT=production`
   - `DATABASE_URL` (Postgres do Supabase)
   - `JWT_SECRET` (se vazio, o app assina JWT com string vazia = tokens forjáveis; ver
     finding de segurança da vistoria)
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - `SITE_ORIGINS=https://setlists-pj-ev.pages.dev=pj`
   - `FORUM_CORS_ORIGIN=https://setlists-pj-ev.pages.dev`
   - `FORUM_BOT_KEY` (pro seeder semanal `forum-seed.yml`; sem ela o endpoint fica off)
   - `ADMIN_USER_IDS` (Google sub dos admins)
5. Redeploy. Validar com os curls acima ("SMUFDPJ Forum API" no `/`).

## Observações

- O código do fórum está 100% no repo (`backend/`), testes passam (`pytest`, 84+).
  Nunca foi perda de código, sempre foi configuração de infra.
- O deploy é automático no push que o Railway detecta no repo conectado (branch
  padrão), desde que a Source esteja apontando pro repo certo.
- Terra Gentil tem o serviço PRÓPRIO dele (`terra-gentil-app-production`), repo
  `terra-gentil/terra-gentil-app`. Não confundir os dois.
