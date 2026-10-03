# CLAUDE.md, setlists-pj-ev

Mapa do projeto pra agentes (Claude Code, routines). Fontes da verdade: este arquivo (estrutura) + `PROGRESSO.md` (estado agora + últimas semanas; histórico em `docs/progresso/`) + `PIPELINE.md` (fluxo detalhado de notícias) + `backend/DEPLOY-RAILWAY.md` (deploy/infra do fórum). Saúde do projeto: `docs/VISTORIA-2026-10-02.md`. Docs antigos (HANDOFF, auditorias de mídia) ficam em `docs/arquivo/`: histórico, não instrução.

> **Fórum caiu?** Ver `backend/DEPLOY-RAILWAY.md`. Teste de vida REAL: `curl -s -H "Origin: https://somaisumfadepearljam.com.br" https://perpetual-energy-production-1a69.up.railway.app/forum/topics` tem que devolver 200 com `items`. O `GET /` responder `Terra Gentil API` é ESPERADO (o Railway roda o backend do Terra Gentil, superset multi-site do fórum, mesmo banco); não é sinal de Source errada. Causa recorrente de queda: Supabase free pausado por inatividade (`keep-db-awake.yml` evita).

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

## Mapa do código

- `scripts/lib/`: estado (`lerEstado`), git (`commitAndPush`), Telegram, fuso BRT, argumentos. `scripts/config.mjs`: raiz do
  repo, domínio, link de notícia, Graph API, URL do fórum, caminhos de estado.
- `scripts/publish/`: tudo que publica (README lá, com o mapa das subpastas `feed/`, `fila/`, `ig/`, `slide/`, `story/`,
  `reel/`, `routine/`). Arquivos que eram gigantes viraram fachada (mesma API) ou roteiro curto.
- `scripts/news/`: coleta e curadoria. `index-site.mjs` é a regra ÚNICA de gravação do `index.json` (teto 2000, notícia nova
  nunca arquivada); `coleta/`, `comunidade/` e `curadoria/` são as partes do fetch-news, community-fetch e merge-curated.
- Site: `index.html` + `css/app.css` + `dados/*.js` (shows, discos, músicas, mídia). Fórum: `forum*.html` + `functions/`.
- `backend/`: cópia do fórum que ficou para trás; produção roda `terra-gentil-app/backend` (ver `backend/DEPLOY-RAILWAY.md`).

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
4. `test.yml` roda a suíte em todo push/PR de `scripts/`, `mock-ig/`, `colab/`, `functions/` e `index.html`. O `npm test` acha sozinho todo `*.test.mjs` (não precisa registrar teste novo). `backend-ci.yml` roda ruff + pytest + pip-audit do backend.
5. `contrib-curadoria.yml` (a cada 10 min): painel de colaboradores (`colaborar.html` + `colab/`, backend `backend/app/contrib/`, scripts `scripts/contrib/`). Cura por IA (Gemini ouve o áudio) e publica os aprovados às :30 no IG/FB/site. Módulo apartado, desligado sem o secret `CONTRIB_BOT_KEY`. Mapa completo em `backend/app/contrib/README.md`.
6. `publish-capsula.yml` (20h BRT): publica uma cápsula do YouTube por dia (`scripts/publish/run-publish-capsula.mjs`, fila em `media/news/youtube-acervo/`, pipeline em `scripts/news/youtube/`).
7. `community.yml`: digest e spotlight do Reddit (`scripts/news/community-fetch.mjs`). `news-merge.yml`: disparado pela routine via o worker `cloudflare-worker/news-merge-dispatch.js` (o `reddit-proxy.js` é o proxy do Reddit).
8. Manutenção: `refresh-ig-token.yml` (dia 1, renova o token do IG), `keep-db-awake.yml` (diário, não deixa o Supabase pausar), `forum-seed.yml` (sexta, tópico semanal no fórum), `fb-smoke.yml` (manual, valida o token da Página).

Quem dispara: `news`, `community`, `publish-instagram` e `publish-story` NÃO têm cron no YAML; quem chama é o **TriggerAll** (sistema externo, ver `PIPELINE.md` seção 7). Renomear esses workflows quebra os gatilhos. Os que instalam ffmpeg usam a action `.github/actions/ffmpeg` (apt com teto de tempo e reserva estática; o apt já levou 12 min e derrubou o story).

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
- `show/`, `musica/`, `disco/`, `banda/`: gerados de `dados/*.js` (SHOWS, ALBUMS, SONGS_DB, MEDIA_MANIFEST), do
  PJ_MEMBERS do `index.html`, de `media/interpretations.json`, `media/lyrics-notes.json` e `media/albums/*.md` por
  `node scripts/seo/build-seo-pages.mjs`, que também gera o `media/shows.json` do fórum.
  **Mexeu nesses dados? Rode o gerador**, senão o teste de sincronia (`scripts/seo/seo.test.mjs`) falha.
- Música sem texto em PT não ganha página (conteúdo fino). Letra e cifra nunca vão pras páginas estáticas (direito autoral).
- `sitemap.xml` tem seções marcadas (`news:start/end`, `seo:start/end`); cada gerador só reescreve a sua.
- O rodapé da home tem a coluna "Pra ler" com links reais pros índices: é por ela que o Google entra.
- Letras (`LYRICS`/`LYRICS_PT`) ficam em `media/letras/en.json` e `pt.json`, carregadas em segundo plano pelo index.html
  (`_letrasPromise`). Não voltar a embutir no HTML: pesa 316 KB e o Google indexaria letra com direito autoral.
- **index.html enxuto** (desde 2026-10-03): dados em `dados/*.js` (uma linha `const NOME = ...;` cada, carregada antes do
  script principal), CSS em `css/app.css` (no lugar do antigo `<style>`, mesma ordem de cascata). Teste
  `scripts/seo/site-leve.test.mjs` barra linha gigante e `<style>` grande de volta no HTML.

### Reel semanal (motion design, MOTION-SPEC do Claude Design)

**Acervo de clipes (transições, abertura e capa do reel, flag `REEL_TRANSICOES`)**: `scripts/publish/reel/transicoes.mjs`
+ `media/reels-clips/transicoes/transicoes.json` (750+ trechos com tags de b-roll). Os MP4 ficam no **R2** (`acervo/`), não
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
- **Conflito de rebase no commit de estado**: `commitAndPush` (único, `scripts/lib/git.mjs`) sempre aborta o rebase que falhou; o run-publish reconcilia via `mergeQueueStates` (postado > backoff > pendente). Não trocar por push forçado.
- `GET /<uid>/media` tem consistência eventual (post recém-criado demora a aparecer).
- `billboard-br` devolve XML malformado intermitente; `reddit-pj` dá 403 sem proxy.
- Site é SPA com deep-link `#news/<id>`; as páginas `n/<id>.html` (geradas pelo publish) são páginas reais de SEO com o texto da notícia e link pro SPA, não redirecionam.
- Mock IG (`mock-ig/`) cobre feed, story, reel, falhas injetáveis (`ghostpublish`, `ratelimit`, `mediaHideCalls`). Sempre validar nele antes de produção. `GET /<uid>/media` agora mescla feed + reels (o IG real lista reel no /media; story não), pra a recuperação pós-erro enxergar reel.
- **Reel: direitos autorais**: trecho de clipe oficial é detectado pelo IG principalmente via ÁUDIO. Mitigação: clipes entram SEMPRE mudos (trilha royalty-free própria por cima), trechos curtos 2-6s. Áudio original = mute/bloqueio quase certo.

## Convenções

- **Regra 0 (módulo apartado)**: feature nova em pasta própria, desligada por flag/secret, arquivo de até 160 linhas
  (teste global `scripts/regra-zero.test.mjs`; os arquivos antigos maiores estão numa lista de exceções com teto que
  só pode diminuir). Arquivo grande demais = fatiar por responsabilidade, nunca subir o teto.
- **Estado e git**: ler JSON de estado só com `lerEstado` e commitar só com `commitAndPush`, ambos em `scripts/lib/`
  (README lá). Nunca `catch { return vazio }` em arquivo de estado.
- **Config**: domínio, URL do fórum, versão da Graph API e caminhos de estado ficam em `scripts/config.mjs`.
- Commits em PT-BR descritivo, sem travessão. Nunca commitar segredo (tudo em GitHub Secrets).
- Antes de mexer em >5 arquivos, propor plano.
- Fim de sessão: atualizar `PROGRESSO.md` + pipeline de commit completo.
