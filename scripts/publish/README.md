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

Os arquivos grandes viraram fachada ou roteiro curto; o código vive em subpastas (uma responsabilidade por arquivo):

| Pasta | O que tem |
|---|---|
| `feed/` | Etapas do `run-publish.mjs`: config, itens, guarda contra repost, lote, publicação, avisos, guardas (cooldown/quota), manutenção, reconciliação. |
| `fila/` | A fila (`queue.mjs` é fachada): io, denylist, cooldown, seleção, marcação. NUNCA mexer sem entender `markPosted`/`mergeQueueStates`. |
| `ig/` | Cliente do Instagram (`instagram.mjs` é fachada): erros, legendas, http, containers, recuperação do falso-erro 2207051, publicações. |
| `slide/` | Slides do feed (`slide-image.mjs` é fachada): base, texto, escolha da foto, recorte, card02, capa, cápsula, cadernob (rollback). |
| `story/` | Story diário: linha do tempo, selo animado, card, montagem, registro, aviso, padrão do reel. |
| `reel/` | Reel semanal e acervo de clipes (README próprio). |
| `routine/` | Auto-merge da curadoria: git/gh, validação de segurança, mensagens, aplicação direta. |
| `story-styles/` | Estilos de abertura e final do story (padrão `card11`). |
| `citacao/`, `narracao/`, `x/`, `assets/` | Slide de citação das cápsulas, voz ElevenLabs, X manual, trilhas e selo. |

Soltos: `facebook.mjs`, `ig-quota.mjs`, `ig-detect-deleted.mjs`, `refresh-token.mjs`, `midia-r2.mjs`, `cover-styles*.mjs`,
`face-crop.mjs`, `band-fallback.mjs`, `subject-fallback.mjs`, `find-better-image.mjs`, `image-overrides.mjs`,
`fontconfig-boot.mjs`, `edition.mjs`, `color-cycle.mjs`, `story-select.mjs`, `story-track.mjs`, `reel-*.mjs`.

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
