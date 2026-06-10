# CLAUDE.md, setlists-pj-ev

Mapa do projeto pra agentes (Claude Code, routines). Fontes da verdade: este arquivo (estrutura) + `PROGRESSO.md` (estado/sessões) + `PIPELINE.md` (fluxo detalhado de notícias). `HANDOFF.md` está defasado, não confiar.

## O que é

Site fan-to-fan de Pearl Jam + Eddie Vedder (https://setlists-pj-ev.pages.dev, Cloudflare Pages, deploy automático no push da main) + pipeline autônomo de notícias que coleta (RSS/scrape), cura (routine Claude remota) e publica no Instagram @smufdpj. Fórum com backend FastAPI no Railway (`backend/`). Tudo PT-BR, sem travessão em texto.

## Comandos essenciais

```
npm test                 # suite completa (node --test), SEMPRE rodar antes de push de scripts
npm run mock:server      # IG fake local na :8788 (deixar rodando)
npm run mock:reset       # zera o store do mock
node mock-ig/run.mjs feed   # roda o run-publish REAL contra o mock (--no-git automático)
npm run publish:dry      # dry-run do publish (não chama IG, não commita)
node scripts/news/build-news-stubs.mjs  # regenera stubs n/<id>.html + sitemap
```

Validar mudança no pipeline = `npm test` + `node mock-ig/run.mjs feed` com itens maduros (editar `publishAt` na fila local e `git restore media/news/` depois).

## Arquivos de estado (media/news/), todos versionados no git

| Arquivo | Papel | Quem escreve |
|---|---|---|
| `_pending.json` | coletados aguardando curadoria | news.yml (cron) |
| `index.json` | notícias publicadas no site | routine de curadoria |
| `_publish-queue.json` | fila de publicação IG (postedAt/postId/erro/backoff) | publish-instagram.yml |
| `seen.json` | dedupe da coleta | news.yml |
| `_deleted-from-ig.json` | denylist perpétua (posts apagados do IG) | publish + /ban Telegram |
| `_ig-cooldown.json` | cooldown global pós rate-limit | publish |
| `_skipped-stale.json` | tombstone de pendentes expirados | publish |
| `_health-stamp.json` | stamp do alerta de feed parado | publish |
| `archive/AAAA-MM.json` | overflow do index | news.yml |

Regras: NUNCA editar a fila sem entender `markPosted`/`mergeQueueStates` (`scripts/publish/queue.mjs`). JSON de estado corrompido derruba a run de propósito (não silenciar). A routine de curadoria só pode tocar `media/news/` (validador do auto-merge rejeita o resto).

## Fluxo dos crons (GitHub Actions)

1. `news.yml` coleta de ~38 fontes pra `_pending.json` (teto `MAX_NEW_PER_RUN`).
2. Routine Claude remota cura `_pending` -> `index.json` + `items/<id>.json` + enfileira na `_publish-queue` (commita em branch `claude/news-routine-*`, PR auto-merged pelo passo `auto-merge-routine.mjs` do publish).
3. `publish-instagram.yml` publica carrossel/single via Graph API, marca `postedAt`, notifica Telegram. `publish-story.yml` gera story diário em vídeo.
4. `test.yml` roda a suíte em todo push/PR de `scripts/`/`mock-ig/`.

## Gotchas conhecidos (não redescobrir)

- **Falso-erro 2207051**: `media_publish` devolve `code 4 subcode 2207051` MAS publica. Tratado em 2 camadas: `recoverPublishedPost` (poll 5x10s) + guarda cross-run (`_lastAttemptCaption`). NÃO tratar como rate limit puro. Origem: conta MEDIA_CREATOR flagada, conversão pra BUSINESS pendente.
- **Conflito de rebase no commit de estado**: `commitAndPush` reconcilia via `mergeQueueStates` (postado > backoff > pendente). Não trocar por push forçado.
- `GET /<uid>/media` tem consistência eventual (post recém-criado demora a aparecer).
- `billboard-br` devolve XML malformado intermitente; `reddit-pj` dá 403 sem proxy.
- Site é SPA com deep-link `#news/<id>`; os stubs estáticos `n/<id>.html` (gerados pelo publish) existem só pra OG/social e redirecionam pro hash.
- Mock IG (`mock-ig/`) cobre feed, story, falhas injetáveis (`ghostpublish`, `ratelimit`, `mediaHideCalls`). Sempre validar nele antes de produção.

## Convenções

- Commits em PT-BR descritivo, sem travessão. Nunca commitar segredo (tudo em GitHub Secrets).
- Antes de mexer em >5 arquivos, propor plano.
- Fim de sessão: atualizar `PROGRESSO.md` + pipeline de commit completo.
