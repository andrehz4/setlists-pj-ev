# scripts/publish

Tudo que publica: carrossel do feed, story diário, reel semanal, cápsulas, Facebook e X.
Fluxo geral e arquivos de estado: `CLAUDE.md` da raiz. Helpers comuns (estado, git): `scripts/lib/`.

## Orquestradores (um por workflow)

| Script | Workflow | O que faz |
|---|---|---|
| `run-publish.mjs` | `publish-instagram.yml` | Fila do feed: escolhe itens maduros, gera slides, publica IG+FB, marca `postedAt`, housekeeping. |
| `run-publish-story.mjs` | `publish-story.yml` | Story diário em vídeo (1 por dia BRT, idempotente pelo `_story-log.json`). |
| `run-publish-reel.mjs` | `publish-reel.yml` | Reel de domingo (1 por semana ISO, `_reel-log.json`). Pasta `reel/`. |
| `run-publish-capsula.mjs` | `publish-capsula.yml` | Uma cápsula do YouTube por dia às 20h BRT. |
| `auto-merge-routine.mjs` | `publish-instagram.yml` | Mescla as branches `claude/news-routine-*` da curadoria (valida que só tocam `media/news/`). |

## Módulos

- **Fila e estado:** `queue.mjs` (fila, denylist, cooldown, `mergeQueueStates`), `edition.mjs`, `color-cycle.mjs`.
- **Instagram e Facebook:** `instagram.mjs` (Graph API, recuperação do falso-erro 2207051), `facebook.mjs`,
  `ig-quota.mjs`, `ig-detect-deleted.mjs`, `refresh-token.mjs`, `midia-r2.mjs` (vídeo pro R2).
- **Imagem:** `slide-image.mjs` (slides do carrossel), `cover-styles*.mjs` (capas em rodízio), `face-crop.mjs`,
  `band-fallback.mjs`, `subject-fallback.mjs`, `find-better-image.mjs`, `image-overrides.mjs`, `fontconfig-boot.mjs`.
- **Story:** `story-video.mjs`, `story-select.mjs`, `story-track.mjs`, `story-styles/`, `story/padrao-reel.mjs`.
- **Reel:** `reel-select.mjs`, `reel-clips.mjs`, `reel-video.mjs`, `reel-week.mjs` e a pasta `reel/` (tem README).
- **Outros:** `citacao/` (slide de citação das cápsulas), `narracao/` (voz ElevenLabs), `x/` (X manual), `assets/`.

## Ferramentas manuais

- `ban.mjs`: põe um post na denylist perpétua (o `/ban` do Telegram faz o mesmo).
- `telegram-bot.mjs`: comandos do bot.
- `smoke-test.mjs`, `fb-smoke.mjs`: validam tokens sem publicar.
- `seed-queue.mjs`: popula a fila pra testes no mock.
- `prune-media.mjs`: limpa binários locais.

## Validar mudança

```
npm test
node mock-ig/run.mjs feed      # publish REAL contra o IG fake (precisa npm run mock:server)
node mock-ig/run.mjs story
node mock-ig/run.mjs reel
```
