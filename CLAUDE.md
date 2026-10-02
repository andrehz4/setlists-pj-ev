# CLAUDE.md, setlists-pj-ev

Mapa do projeto pra agentes (Claude Code, routines). Fontes da verdade: este arquivo (estrutura) + `PROGRESSO.md` (estado/sessões) + `PIPELINE.md` (fluxo detalhado de notícias) + `backend/DEPLOY-RAILWAY.md` (deploy/infra do fórum). `HANDOFF.md` está defasado, não confiar.

> **Fórum caiu?** Ver `backend/DEPLOY-RAILWAY.md`. Causa recorrente: o serviço Railway do fórum teve a Source trocada e passou a servir OUTRO app (ex: Terra Gentil). Diagnóstico rápido: `curl -s https://perpetual-energy-production-1a69.up.railway.app/` deve devolver `SMUFDPJ Forum API`; se devolver `Terra Gentil API`, a Source do serviço está no repo errado. Conserto é no painel do Railway (Andre logado), o código do fórum está intacto no repo.

## O que é

Site fan-to-fan de Pearl Jam + Eddie Vedder (https://somaisumfadepearljam.com.br, Cloudflare Pages, deploy automático no push da main) + pipeline autônomo de notícias que coleta (RSS/scrape), cura (routine Claude remota) e publica no Instagram @smufdpj. Fórum com backend FastAPI no Railway (`backend/`). Tudo PT-BR, sem travessão em texto.

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
COVER_STYLE=zine node mock-ig/run.mjs feed  # força um estilo de capa (card11/poster/zine/ingresso)
npm run fontes:mac       # instala as fontes do projeto no Mac (sem isso slides saem com fonte genérica)
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

1. `news.yml` coleta de ~40 fontes pra `_pending.json` (teto `MAX_NEW_PER_RUN`). Inclui o **Instagram oficial** (@pearljam, @eddievedder) pela API da Meta (Business Discovery, `scripts/news/ig-oficial.mjs`, secret `IG_LEITURA_TOKEN`, token de usuário que não expira, app "Setlists PJ EV Bot", via página "Só mais um Fã de PJ" vinculada à @smufdpj). Só a legenda entra; foto deles nunca. Nada de navegador nem scraping no Instagram.
2. Routine Claude remota cura `_pending` -> `index.json` + `items/<id>.json` + enfileira na `_publish-queue` (commita em branch `claude/news-routine-*`, PR auto-merged pelo passo `auto-merge-routine.mjs` do publish). A routine só tem um prompt curto que manda seguir `scripts/news/routine-prompt.md` (editar o arquivo já vale). Guias de voz em `scripts/news/prompts/` (inclui `voz-humana-ptbr.md`). O `merge-curated.mjs` barra texto sem acento (`qualidade-ptbr.mjs`): volta pro `_pending` e avisa no Telegram.
3. `publish-instagram.yml` publica carrossel/single via Graph API, marca `postedAt`, notifica Telegram. `publish-story.yml` gera story diário em vídeo. `publish-reel.yml` gera o reel semanal (domingo 09:00 BRT, resumão dos 7 dias).
4. `test.yml` roda a suíte em todo push/PR de `scripts/`/`mock-ig/`.
5. `contrib-curadoria.yml` (a cada 10 min): painel de colaboradores (`colaborar.html` + `colab/`, backend `backend/app/contrib/`, scripts `scripts/contrib/`). Cura por IA (Gemini ouve o áudio) e publica os aprovados às :30 no IG/FB/site. Módulo apartado, desligado sem o secret `CONTRIB_BOT_KEY`. Mapa completo em `backend/app/contrib/README.md`.

### Páginas de tópico pro Google (`functions/`)

Cloudflare Pages Functions, módulo apartado ligado por `FORUM_SEO=1` (variável do projeto no painel do Cloudflare Pages).
`/t/<id>` renderiza o tópico do fórum no servidor (título, corpo, respostas, JSON-LD `DiscussionForumPosting`) a partir
da API do Railway; `/sitemap-forum.xml` lista todos (está no `robots.txt`). Cache de borda 1h/6h; API fora = 503 +
Retry-After (nunca cacheado). `forum-topic.html` aponta o canonical pra `/t/<id>`. Testes em `scripts/forum-seo/`.

### X / Twitter (@somaisumfadepj), MODO MANUAL

Tudo em `scripts/publish/x/` (mapa no `README.md` de lá). Hoje é manual e grátis: às 11h o Mac (launchd
`com.smufdpj.x-kit`, instalado) monta o kit do dia em `.x-kit/<dia>/` e abre o Claude com `/x-hoje`
(`ROTINA-X-HOJE.md`): reescrevo cada post condensado, `conferir.mjs` valida, o Andre aprova, eu preencho no agendador
do X e o **Andre clica em Schedule** (automação pelo site é proibida pelo X; nunca clicar sozinho). Só a 1a notícia do
dia leva link (teste de alcance). Automático via API (`oauth1.mjs`) espera crédito no X.

### Imagens e marca (Nano Banana / Google Flow)

O Andre tem Google Flow e Nano Banana pagos: usar pra imagem de marca (selo, perfil, capa), como o Claude Design é usado
pra layout. Passo a passo, regras (nunca gerar foto de pessoa real) e acervo em `docs/PLAYBOOK-IMAGENS-GOOGLE.md`.
Selo em alta e artes do perfil em `media/marca/`.

### SEO: páginas estáticas pro Google

Playbook completo e reaproveitável (diagnóstico, Search Console, migração de domínio, velocidade, og.jpg):
`docs/PLAYBOOK-SEO-GOOGLE.md`.

O SPA (`index.html`) usa `#` e o Google não indexa o que vem depois dele. Por isso cada conteúdo tem página estática,
todas no mesmo molde (`scripts/seo/layout.mjs`: menu de seções, breadcrumb, JSON-LD, GA):
- `n/<id>.html` + `noticias/index.html`: gerados pelo publish via `scripts/news/build-news-stubs.mjs` (`news-page.mjs`).
- `show/`, `musica/`, `disco/`, `banda/`: gerados de `index.html` (SHOWS, ALBUMS, SONGS_DB, PJ_MEMBERS) +
  `media/interpretations.json`, `media/lyrics-notes.json` e `media/albums/*.md` por `node scripts/seo/build-seo-pages.mjs`.
  **Mexeu nesses dados? Rode o gerador**, senão o teste de sincronia (`scripts/seo/seo.test.mjs`) falha.
- Música sem texto em PT não ganha página (conteúdo fino). Letra e cifra nunca vão pras páginas estáticas (direito autoral).
- `sitemap.xml` tem seções marcadas (`news:start/end`, `seo:start/end`); cada gerador só reescreve a sua.
- O rodapé da home tem a coluna "Pra ler" com links reais pros índices: é por ela que o Google entra.
- Letras (`LYRICS`/`LYRICS_PT`) ficam em `media/letras/en.json` e `pt.json`, carregadas em segundo plano pelo index.html
  (`_letrasPromise`). Não voltar a embutir no HTML: pesa 316 KB e o Google indexaria letra com direito autoral.

### Reel semanal (motion design, MOTION-SPEC do Claude Design)

**Acervo de clipes (transições, abertura e capa do reel, flag `REEL_TRANSICOES`)**: `scripts/publish/reel/transicoes.mjs`
+ `media/reels-clips/transicoes/transicoes.json` (330+ trechos com tags de b-roll). Os MP4 ficam no **R2** (`acervo/`), não
no git. Novo clipe: `node scripts/publish/reel/planos.mjs <video>` (grade plano a plano; o Claude olha e escolhe) e
`--importar p3:nome --musica X`. Mapa completo no README da pasta. Nunca mexer no baixa-clipehz (outra IA cuida).

`run-publish-reel.mjs` -> `reel-select.mjs` (top 5-8 da semana + formato por cena: cinético/card/papel) -> `reel-clips.mjs` (casa trecho de clipe do acervo com a cena, por tag, rotação determinística por semana ISO) -> `reel-video.mjs` (renderer SVG frame a frame + ffmpeg, cold open 3s + 8 blocos de 4.5s + outro 2.5s = 41.5s, 1080x1920). Publica via `publishReel` (caption com índice + `share_to_feed` + `thumb_offset`). Larguras de texto medidas REAL via `sharp.trim` (estimar por char sobrepõe as palavras do Anton). Sem acervo de clipe, degrada pra foto com Ken Burns ou fundo fantasma "CLIPE". Spec versionado em `design-handoff/retorno/movie/project/entrega/MOTION-SPEC.md` (gitignored, é referência).

## Gotchas conhecidos (não redescobrir)

- **Capas do carrossel** (desde 2026-09-28): rodízio diário (BRT) de 4 estilos, `card11` (original), `poster`, `zine`,
  `ingresso` (`scripts/publish/cover-styles.mjs` + `cover-styles-svg.mjs`, desenho do Claude Design em
  `design-handoff/retorno/capas/`). A capa entra NO LUGAR do slide da notícia líder (sem repetir). Notícia única = sem capa.
- **Fontes no Mac**: o sharp do macOS usa CoreText e ignora o `fonts.conf`; precisa de `npm run fontes:mac`.

- **Domínio** (desde 2026-09-28): `somaisumfadepearljam.com.br` (Registro.br, 5 anos até 2031, DNS no Cloudflare). O
  `setlists-pj-ev.pages.dev` redireciona 301 via Bulk Redirects da conta. O backend (Railway `SITE_ORIGINS`) aceita os
  dois; os robôs (contrib-curadoria, keep-db-awake, scripts/contrib, forum-seed) ainda mandam `Origin` antigo, de propósito.
  `contato@somaisumfadepearljam.com.br` cai no Gmail do Andre (Cloudflare Email Routing).

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
