# CLAUDE.md, setlists-pj-ev

Mapa do projeto pra agentes (Claude Code, routines). Fontes da verdade: este arquivo (estrutura) + `PROGRESSO.md` (estado/sessões) + `PIPELINE.md` (fluxo detalhado de notícias) + `backend/DEPLOY-RAILWAY.md` (deploy/infra do fórum). `HANDOFF.md` está defasado, não confiar.

> **Fórum caiu?** Ver `backend/DEPLOY-RAILWAY.md`. Causa recorrente: o serviço Railway do fórum teve a Source trocada e passou a servir OUTRO app (ex: Terra Gentil). Diagnóstico rápido: `curl -s https://perpetual-energy-production-1a69.up.railway.app/` deve devolver `SMUFDPJ Forum API`; se devolver `Terra Gentil API`, a Source do serviço está no repo errado. Conserto é no painel do Railway (Andre logado), o código do fórum está intacto no repo.

## O que é

Site fan-to-fan de Pearl Jam + Eddie Vedder (https://setlists-pj-ev.pages.dev, Cloudflare Pages, deploy automático no push da main) + pipeline autônomo de notícias que coleta (RSS/scrape), cura (routine Claude remota) e publica no Instagram @smufdpj. Fórum com backend FastAPI no Railway (`backend/`). Tudo PT-BR, sem travessão em texto.

## Comandos essenciais

```
npm test                 # suite completa (node --test), SEMPRE rodar antes de push de scripts
npm run mock:server      # IG fake local na :8788 (deixar rodando)
npm run mock:reset       # zera o store do mock
node mock-ig/run.mjs feed   # roda o run-publish REAL contra o mock (--no-git automático)
node mock-ig/run.mjs reel   # roda o run-publish-reel REAL contra o mock (precisa ffmpeg)
npm run publish:dry      # dry-run do publish (não chama IG, não commita)
npm run publish:reel:dry # dry-run do reel semanal (gera o MP4, não chama IG)
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
| `instagram-reels/<AAAA-Www>.mp4` | reel semanal renderizado (1 por semana ISO) | publish-reel.yml |
| `instagram-reels/_reel-log.json` | idempotência do reel (1 por semana ISO) | publish-reel.yml |
| `media/reels-clips/clips.json` + `*.mp4` | acervo manual de trechos de clipe (fundo dos blocos cinéticos, sempre mudos) | Andre |

Regras: NUNCA editar a fila sem entender `markPosted`/`mergeQueueStates` (`scripts/publish/queue.mjs`). JSON de estado corrompido derruba a run de propósito (não silenciar). A routine de curadoria só pode tocar `media/news/` (validador do auto-merge rejeita o resto).

## Fluxo dos crons (GitHub Actions)

1. `news.yml` coleta de ~38 fontes pra `_pending.json` (teto `MAX_NEW_PER_RUN`).
2. Routine Claude remota cura `_pending` -> `index.json` + `items/<id>.json` + enfileira na `_publish-queue` (commita em branch `claude/news-routine-*`, PR auto-merged pelo passo `auto-merge-routine.mjs` do publish).
3. `publish-instagram.yml` publica carrossel/single via Graph API, marca `postedAt`, notifica Telegram. `publish-story.yml` gera story diário em vídeo. `publish-reel.yml` gera o reel semanal (domingo 09:00 BRT, resumão dos 7 dias).
4. `test.yml` roda a suíte em todo push/PR de `scripts/`/`mock-ig/`.

### Reel semanal (motion design, MOTION-SPEC do Claude Design)

`run-publish-reel.mjs` -> `reel-select.mjs` (top 5-8 da semana + formato por cena: cinético/card/papel) -> `reel-clips.mjs` (casa trecho de clipe do acervo com a cena, por tag, rotação determinística por semana ISO) -> `reel-video.mjs` (renderer SVG frame a frame + ffmpeg, cold open 3s + 8 blocos de 4.5s + outro 2.5s = 41.5s, 1080x1920). Publica via `publishReel` (caption com índice + `share_to_feed` + `thumb_offset`). Larguras de texto medidas REAL via `sharp.trim` (estimar por char sobrepõe as palavras do Anton). Sem acervo de clipe, degrada pra foto com Ken Burns ou fundo fantasma "CLIPE". Spec versionado em `design-handoff/retorno/movie/project/entrega/MOTION-SPEC.md` (gitignored, é referência).

## Gotchas conhecidos (não redescobrir)

- **Falso-erro 2207051**: `media_publish` devolve `code 4 subcode 2207051` MAS publica. Tratado em 2 camadas: `recoverPublishedPost` (poll 5x10s) + guarda cross-run (`_lastAttemptCaption`). NÃO tratar como rate limit puro. Origem: conta MEDIA_CREATOR flagada, conversão pra BUSINESS pendente.
- **Conflito de rebase no commit de estado**: `commitAndPush` reconcilia via `mergeQueueStates` (postado > backoff > pendente). Não trocar por push forçado.
- `GET /<uid>/media` tem consistência eventual (post recém-criado demora a aparecer).
- `billboard-br` devolve XML malformado intermitente; `reddit-pj` dá 403 sem proxy.
- Site é SPA com deep-link `#news/<id>`; os stubs estáticos `n/<id>.html` (gerados pelo publish) existem só pra OG/social e redirecionam pro hash.
- Mock IG (`mock-ig/`) cobre feed, story, reel, falhas injetáveis (`ghostpublish`, `ratelimit`, `mediaHideCalls`). Sempre validar nele antes de produção. `GET /<uid>/media` agora mescla feed + reels (o IG real lista reel no /media; story não), pra a recuperação pós-erro enxergar reel.
- **Reel: direitos autorais**: trecho de clipe oficial é detectado pelo IG principalmente via ÁUDIO. Mitigação: clipes entram SEMPRE mudos (trilha royalty-free própria por cima), trechos curtos 2-6s. Áudio original = mute/bloqueio quase certo.

## Convenções

- Commits em PT-BR descritivo, sem travessão. Nunca commitar segredo (tudo em GitHub Secrets).
- Antes de mexer em >5 arquivos, propor plano.
- Fim de sessão: atualizar `PROGRESSO.md` + pipeline de commit completo.
