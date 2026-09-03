# PROGRESSO, setlists-pj-ev

## Data
2026-09-02 (Facebook Pages: token permanente + cliente de FEED pronto e testado; story/reel pendentes)

## ⭐ Sessão 2026-09-02: PUBLICAÇÃO NO FACEBOOK PAGES (feed FEITO, 114/114 testes)

Objetivo do Andre: replicar as publicações no Facebook Pages (Página "Só mais um Fã de PJ") além do IG, os três formatos (feed + story + reel). Abordagem incremental: feed primeiro.

**Autenticação (resolvida):** o fluxo do IG ("Instagram with Instagram Login", `graph.instagram.com`) NÃO serve pro FB. Gerado um Page Access Token via `graph.facebook.com` (fb_exchange_token: user curto -> user longo -> page token permanente do /me/accounts). Secrets salvos: `FB_PAGE_TOKEN` (type PAGE, **expira NUNCA**, não precisa refresh mensal) e `FB_PAGE_ID` (1119493787910103). App ID 1679039826640945. Detalhes e pegadinhas em memory/facebook-page-smufdpj.md. Pegadinha: o ID da URL do FB (61589667122253) NÃO é o Page ID da API.

**Feed (FEITO, escolha do Andre = álbum com todos os slides):**
- `scripts/publish/facebook.mjs`: cliente espelho do instagram.mjs. `publishFeedAlbum` sobe cada slide como foto unpublished (`POST /<page>/photos`, published=false) e cria o post com `POST /<page>/feed` + attached_media[]. Reusa `buildCarouselCaption` e `slideUrlFor` do IG (legenda e URLs idênticas, zero duplicação). Erros tipados FBAPIError/FBRateLimitError.
- Mock estendido: `mock-ig/server.mjs` (rotas POST /photos e /feed + GET /_mock/fbfeed), `mock-ig/store.mjs` (fbPhotos/fbfeed), `mock-ig/run.mjs` (liga FB no e2e).
- `scripts/publish/facebook.test.mjs`: 8 testes (ordem das fotos, capa primeiro, slideSuffix, legenda single vs carrossel, rate limit tipado). Somados à suíte = 114/114.
- Integrado em `run-publish.mjs`: publica no FB em paralelo ao IG, BEST-EFFORT (falha do FB não derruba a run nem devolve item pra fila). Ligado só com flag `PUBLISH_FB=1` + secrets presentes.
- Validado e2e real contra o mock (`node mock-ig/run.mjs feed`): álbum com capa + slides na ordem certa, legenda reusada. OK.

**Smoke test em produção real (OK):** `scripts/publish/fb-smoke.mjs` + workflow `fb-smoke.yml` (dispatch, input delete_post_id). Postou um álbum de teste (3 band-fallback) na Página e apagou (status=200 success:true). Token/permissões/formato álbum validados ao vivo. Manter o smoke pra debug futuro.

**Feed FB LIGADO EM PRODUÇÃO (2026-09-03):** `publish-instagram.yml` agora tem `PUBLISH_FB: ${{ inputs.skip_fb && '0' || '1' }}` (ligado por padrão em todo disparo; input `skip_fb` publica só no IG numa run específica). Todo post de notícia passa a sair no FB junto com o IG. O primeiro post real com slides de notícia sai no próximo item maduro (acompanhar via Telegram/Página).

**PENDÊNCIAS (próximos passos):**
1. **Story no FB** (Fase 2): mesmo MP4 vira `video_story` (upload em fases: start/upload/finish). Integrar em run-publish-story.mjs.
2. **Reel no FB** (Fase 3): mesmo MP4 semanal vira `video_reel` (upload em fases). Integrar em run-publish-reel.mjs.
3. Observabilidade: incluir fbPostId no resumo do Telegram do publish (hoje só loga no console).
4. Acompanhar o PRIMEIRO post real de notícia no FB (slides de verdade), conferir visual do álbum com cards de texto.

## Data anterior
2026-08-04 (apagão do IG resolvido: token expirado renovado, secrets consertados, alerta no refresh)

## ⭐ Sessão 2026-08-04: TOKEN IG EXPIRADO, PUBLISH PARADO 5 DIAS (RESOLVIDO)

**Causa raiz em cadeia:** `IG_ACCESS_TOKEN` gerado em 31/mai expirou em 30/jul (long-lived dura 60 dias). O refresh mensal automático (`refresh-ig-token.yml`) falhava desde 1º/jun porque o secret `GH_PAT_SECRETS` sumiu na arrumação de secrets de 31/mai, e falhava EM SILÊNCIO (sem Telegram). Resultado: feed, story e reel parados de 30/jul a 04/ago.

**Conserto (com Andre no painel Meta + Terminal):**
- Token novo gerado no painel Meta (Instagram > Configuração da API com Login do Instagram > Gerar token, login @smufdpj). Pegadinhas: 1ª tentativa salvou secret VAZIO (`gh secret set` interativo não funciona via `!` do Claude Code, rodar no Terminal); 2ª salvou a App Secret por engano (32 chars); 3ª OK (token `IGAA...`, ~180 chars).
- `IG_USER_ID` atualizado pra `17841414148425536` (ID mostrado ao lado do token no painel; o antigo dava code 100 subcode 33 "Object does not exist").
- `GH_PAT_SECRETS` recriado (PAT classic, escopo repo, sem expiração) pro refresh mensal voltar a funcionar.
- Fila colocada em dia: carrossel regular (2 notícias Glen Hansard) + spotlight + story do dia publicados 04/ago.
- Reel W31 NÃO republicado (decisão): o MP4 está no repo mas o script calcula a semana pela data corrente; rodar agora criaria reel W32 com 2 dias de notícia e queimaria o slot do domingo. Se quiser recuperar semana perdida no futuro: adicionar flag `--week` no `run-publish-reel.mjs`.
- `refresh-ig-token.yml`: ganhou step de alerta Telegram em falha (nunca mais 3 meses de falha silenciosa).
- `PIPELINE.md`: troubleshooting corrigido (refresh NÃO recupera token já expirado; procedimento completo documentado).

**Validação pendente:** refresh só funciona com token com 24h+ de vida; o cron de 1º/set valida o ciclo completo (e agora alerta se falhar).

## ⭐ Sessão 2026-07-03: VISTORIA GERAL + CORREÇÕES (front e pipeline FEITO, 106/106 testes)

Vistoria completa nos 11 eixos (5 agentes em paralelo, suítes rodadas: 106/106 pipeline, 84/84 backend). Nota média 6,0/10. Relatório completo na conversa. Correções aplicadas e no ar em 2 commits:

**Fórum caiu e voltou (causa corrigida):** NÃO era repo errado no Railway (diagnóstico inicial errado). O deploy que atende o fórum PJ roda o backend do Terra Gentil (mesmo código, superset) contra o MESMO banco Supabase, multi-tenant por `site`. Por isso `/` diz "Terra Gentil API" (normal). A queda real foi o **free tier do Supabase pausando por inatividade** (~7d). Voltou ao despausar. `backend/DEPLOY-RAILWAY.md` reescrito com a causa certa + diagnóstico por curl. **Solução grátis no ar:** `keep-db-awake.yml`, cron diário que faz SELECT via `/forum/topics` e nunca deixa o Supabase pausar (mantém fórum + Terra Gentil vivos), com alerta Telegram se cair. Testado (run verde). Alternativa documentada: migrar pro Neon.

**Commit 1 (front, seguro, deploy automático Pages):**
- XSS por atributo corrigido: `san()` (3 HTMLs do fórum) e `_newsEscape` (index.html) passaram a escapar `"` e `'` além de `< > &`. `display_name`/título com aspas não quebram mais atributos data-*/alt/aria-label (era stored XSS cross-user com CSP unsafe-inline). Os 2 `document.title` que usavam `san()` passaram a usar valor cru (propriedade de texto, mostrava entidades literais).
- a11y: lightbox de clipes ganha `hidden` ao fechar; sem isso o dialog fechado (0 focáveis) seguia no focus trap global e prendia o Tab da página inteira.

**Commit 2 (pipeline, validado com npm test + mock e2e real):**
- `news.yml`/`community.yml`/`news-merge.yml`: loop de push aborta rebase em conflito e faz `exit 1` ao esgotar, em vez de sair verde perdendo o commit (curadoria do news-merge evaporava em silêncio).
- `run-publish.mjs`: persiste `_lastAttemptCaption` via git ANTES do `publishItems` (guarda anti-duplicata funciona mesmo se a run morrer durante o publish com o post já criado no IG). `processBatch` recebe o reconciliador.
- `auto-merge-routine.mjs`: apply direto pós-conflito dá push pra main ANTES de fechar PR/deletar branch; se o push falha, preserva branch+PR pra retry (antes o commit ficava só local e sumia).

**Commit 3 (CI/SEO quick wins, self-contained):**
- `forum-seed.yml`: não fica mais vermelho toda sexta. O skip gracioso do seed (sem `FORUM_BOT_KEY`) não gera stamp; guarda evita o `git add` de arquivo inexistente que abortava o step (exit 128). Testado (run verde). Push loop também com rebase --abort + exit 1.
- Alertas Telegram reativados (`news.yml` x2, `news-merge.yml` x1): estavam MORTOS porque `env` de step não é visível no `if` do próprio step; guarda do token movida pro shell.
- `robots.txt`: `Allow /media/news/img/` pro Googlebot rastrear as imagens de OG dos stubs.

**PENDÊNCIAS desta vistoria (não aplicadas):**
1. **Backend (P1/P2):** ATENÇÃO, o deploy roda o repo do Terra Gentil, então editar `backend/` aqui NÃO deploya sozinho (decidir: aplicar no `terra-gentil-app` também, ou reconectar o Railway a este repo). Itens: email exposto em `GET /forum/users/{id}` sem auth (`forum.py:284,337`); `JWT_SECRET`/`DATABASE_URL` sem validação de boot; pool asyncpg sem timeout/lifespan (`db.py`); rate limit contornável por `X-Forwarded-For` forjado (`limiter.py`); `feed.py:36` sem clamp de `page>=1`; python-jose 3.3.0 com CVE; container roda como root.
2. **P2/P3 front restantes:** cache HTTP fraco no `_headers`; index.html 1,28MB single-file; leitor Deep baixa 9-11MB ao abrir; páginas de fórum sem OG/canonical; `document.title` não muda na SPA; `npm test` é lista hardcoded; validador de segurança do auto-merge sem teste. Lista completa com arquivo:linha na conversa.

## ⭐ Sessão 2026-06-12/13: REEL SEMANAL (motion design ponta a ponta, FEITO, 105/105 testes)

Conta @smufdpj ganhou um terceiro formato além de carrossel diário e story diário: **reel semanal** (resumão dos 7 dias), projetado primeiro no Claude Design e depois implementado no pipeline.

**Design (Claude Design):** brief + pacote (`design-handoff/`, gitignored) com 8 manchetes reais, fotos, fontes e referências. Retorno em `design-handoff/retorno/movie/` (bundle baixado da API). O `MOTION-SPEC.md` aprovado virou a fonte de verdade da timeline: cold open 3s + 8 blocos de 4.5s + outro 2.5s = **41.5s, 1080x1920, 30fps, cortes secos**. 3 formatos de bloco alternados: **cinético** (manchete palavra a palavra sobre clipe/foto), **card** (foto da notícia, evolução do card02), **papel** (digesto da comunidade em xerox creme com snapshot inclinado).

**Implementação (mock-first):**
1. **Cliente IG** (`instagram.mjs`): `publishReel` (caption + `share_to_feed` + `thumb_offset`, poll 300s), `buildReelCaption` (cabeçalho + índice numerado + CTA + hashtags), `createReelContainer`. Recuperação do falso-erro 2207051 reusada (reel tem caption).
2. **Acervo de clipe** (`reel-clips.mjs` + `media/reels-clips/`): contrato versionado (`clips.json`), validação, casamento clipe-notícia por tag com **rotação determinística por semana ISO** (sem Math.random). Andre adiciona trechos 2-6s mudos; sem acervo o reel degrada sozinho (foto Ken Burns ou fundo fantasma).
3. **Seleção** (`reel-select.mjs`): top 5-8 dos 7 dias, cap de 2 papéis, item sem foto vira cinético, abertura é a manchete mais forte, formatos intercalados.
4. **Renderer** (`reel-video.mjs`): SVG frame a frame por SEGMENTO (cada cena = 1 MP4, ffmpeg concatena). Cenas com clipe = overlay PNG alpha sobre o vídeo; sem clipe = foto com zoom ou fantasma. **Larguras de texto medidas REAL via `sharp.trim`** (estimar por char sobrepunha as palavras do Anton, corrigido após inspecionar frames).
5. **Orquestração**: `run-publish-reel.mjs` (idempotência por semana ISO em `_reel-log.json`, commit do MP4, Telegram, `--dry-run/--no-git/--force`) + `publish-reel.yml` (domingo 12 UTC = 09:00 BRT + dispatch). `reel-week.mjs` (chave ISO + rótulo do intervalo). `prune-media.mjs` agora poda reels >30d.
6. **Validação**: 92 -> **105 testes** (13 novos: select, clips, plano de cenas, SVGs, semana, caption, publishReel no mock incl. ghostpublish e poll de processamento, poda). Render real de 41.5s gerado e 6 frames-chave inspecionados visualmente (cold open, cinético, card, papel, outro: todos corretos). E2e real contra o mock (postId p_2, caption certa). Mock `GET /media` passou a mesclar feed+reels.

**Direitos autorais (decisão registrada):** clipes SEMPRE mudos (trilha royalty-free própria por cima), trechos curtos. Áudio original = mute/bloqueio quase certo pelo rights manager do IG.

**PENDÊNCIAS pro Andre:**
1. **Cortar os primeiros trechos de clipe** (2-6s, H.264 1080p+, sujeito centralizado) e jogar em `/Users/andrehz/Documents/Githubhz/setlists-pj-ev/media/reels-clips/` (instruções no README de lá). Sem isso o reel já sai, mas com fundo de foto em vez de vídeo.
2. **Conferir o MP4 gerado** antes do 1º post real: `npm run publish:reel:dry` gera em `media/news/instagram-reels/<semana>.mp4`.
3. **1º ciclo monitorado**: domingo 09:00 BRT dispara sozinho; ou `gh workflow run publish-reel.yml -f dry-run=true` pra testar no Actions sem postar.
4. R2 segue pendente (reel adiciona ~10MB/semana ao repo, `prune-media` segura o checkout mas não o `.git`).

## ⭐ Sessão 2026-06-10 (parte 3): vistoria do mock-ig + correções (FEITO, 92/92 testes)

Vistoria completa do mock do Instagram (mock-ig/), endpoint a endpoint contra o cliente real. Veredicto: sólido, mas com 1 suspeita de bug de produção e lacunas de cobertura. Tudo corrigido na mesma sessão:

1. **Shape da quota (POSSÍVEL BUG DE PRODUÇÃO)**: a doc oficial da Meta devolve `content_publishing_limit` embrulhado em `data[]` (`{"data":[{"quota_usage":N,"config":{...}}]}`), mas `ig-quota.mjs` e `smoke-test.mjs` liam o campo plano. Se a API real for data-wrapped, o pre-check de quota era no-op silencioso (sempre via usage=0, nunca saturava). Conserto: cliente aceita os DOIS shapes (`data[0] ?? body`); mock passou a servir o shape oficial. **PENDENTE confirmar**: rodar `npm run publish:smoke` com token real e ver se imprime número (de toda forma o cliente agora cobre ambos).
2. **Fluxo de post apagado**: nova rota `POST /_mock/delete` (post some do feed/stories/reels + exists devolve code 100), botão "apagar do IG" no PostModal do front, e novo `detect-deleted.test.mjs` (checkPostExists contra o mock). Antes o array `deleted` do store era órfão (nada o populava) e o fluxo denylist era intestável no mock.
3. **Validações fiéis ao IG real no mock**: mídia local inacessível recusada com code 9004 (HEAD na criação do container; URL de host fake passa, pros testes unitários), publish de container `IN_PROGRESS` recusado com code 9007 (pega regressão que pule o waitContainerReady), caption >2200 e carrossel fora de 2..10 children recusados, quota dura 50/24h com code 80007, `ratelimit` também nos GETs, header `x-app-usage` em TODO erro Graph.
4. **Menores**: `_control.json` removido (arquivo morto, nada o lia; modo de falha vive no store via /_mock/fail), guarda anti path-traversal do serveFile/dist com `path.sep`, body lido antes do load do store nos POSTs (encurta janela de race), README atualizado (rotas + shape + validações).
5. **Validação**: suíte 84 -> 92 testes, tudo verde; e2e real `mock:publish` contra server novo na :8799 (slide gerado, validação de mídia passou, publish OK, quota data-wrapped, delete -> code 100, recusas 9007/9004 via curl). Estado de media/news restaurado byte a byte após o e2e. `recover-publish.test.mjs` passou a usar `REPO_PUBLIC_BASE` de host fake pros slides inexistentes não caírem na validação nova.

**Atenção**: o `npm run mock:server` que estiver rodando precisa ser REINICIADO pra carregar o server novo. Front rebuildado (web/dist, gitignored).

## ⭐ Sessão 2026-06-10: vistoria geral + correções (FEITO, 84/84 testes)

Vistoria completa (nota média 6.1/10, relatório na conversa) seguida de plano aprovado e executado em 6 fases, cada uma validada (suíte + mock e2e + dispatch de workflows + curl no site live):

1. **CI/CD**: workflow `test.yml` novo (npm test em push/PR de scripts/mock-ig); actions checkout/setup-node v4 -> v5 nos 8 workflows (deprecação Node20 forçada em 16/06); `fetch-depth: 0 -> 50` no publish (não baixa mais ~650MB de histórico a cada run); permissions read no test-reddit-rss. Validado: dispatch verde sem warnings.
2. **Confiabilidade da fila**: `mergeQueueStates` (reconciliação por id em conflito de rebase, postado > backoff > pendente); `commitAndPush` com rebase --abort + reconcile + re-commit (antes: warn + push cego que perdia markPosted = repost); persistência imediata da fila após cada batch; `readQueue`/index estritos (JSON corrompido = run vermelha, não fallback vazio); alerta Telegram de feed parado >48h (`_health-stamp.json`). 7 testes novos.
3. **Segurança web**: token de auth via fragment (#token=) com callback compatível com query (qualquer ordem de deploy Pages x Railway funciona) + replaceState limpando a URL + avatar https-only; `_headers` com CSP completa (GA4/fonts/R2/Railway/youtube-nocookie), nosniff, referrer-policy, cache 7d em media/news/img; parágrafo anti-prompt-injection no routine-prompt.md e system-curator-fa.txt. Validado live: headers no ar, site 200. XSS no fórum NÃO existe (verificado: DOMPurify + escape corretos).
4. **SEO/social + a11y**: stubs estáticos `n/<id>.html` (211 backfill + geração contínua pelo publish via `build-news-stubs.mjs`) com og:/twitter:/NewsArticle + redirect pra `/#news/<id>`; links /n/ do Telegram passam a abrir o artigo com preview correto (antes caíam na home); sitemap.xml com seção de notícias auto-gerada; fórum com 21 aria-labels + foco visível global. Validado live: stub servindo com OG.
5. **Higiene do repo**: `prune-media.mjs` apaga slides/stories já publicados >14d do working tree (delecões no commit de estado do publish). Limitação honesta: não encolhe o .git (645MB), só segura o checkout. Solução de raiz = R2, pendente de token (abaixo).
6. **IA-friendly**: `CLAUDE.md` (mapa do projeto pra agentes: comandos, arquivos de estado, fluxo dos crons, gotchas), `HUB.md` (integração hub-hz), banners de defasagem no HANDOFF.md e PIPELINE.md.

## ⭐ Sessão 2026-06-10 (parte 2): melhorias sem-risco-de-quebra (FEITO)

Pacote aprovado pelo Andre ("faz tudo, mas garante que não quebra"), 4 commits:
1. **Perf site** (`93e96fd`): interpretations.json (354KB gzip) saiu do caminho do primeiro paint, carrega no idle/1ª interação (o `_getInterpretation` já degradava pra null, comportamento preservado); dns-prefetch R2/ytimg + preconnect Railway no fórum; loading=lazy no thumb que faltava. Facade de YouTube DESCARTADA com justificativa: iframes já tinham loading=lazy e clipes usam lightbox. Imagens de notícia são background-image renderizadas só quando a aba abre (já lazy de fato).
2. **Coleta em pool** (`77a9c6f`): 4 fontes em paralelo (era sequencial + sleep 400ms, ~15s mortos/run); resultados processados na ordem de SOURCES, saída idêntica (validado com news:dry real: 39 fontes, 25 candidatos, mesmas falhas pré-existentes).
3. **Seeder semanal do fórum** (`4a0dc49`): endpoint aditivo `POST /forum/bot/topics` (FORUM_BOT_KEY via X-Bot-Key, compare_digest, sem env = desligado), usuário-bot UUID determinístico "SMUFDPJ", `forum-seed.mjs` monta tópico com as notícias dos últimos 7d, idempotente por semana ISO (`_forum-seed-stamp.json`), workflow sexta 12:00 BRT. Sem o secret, skip gracioso. Motivo: fórum tecnicamente pronto mas com 1 tópico "Teste" só (última atividade 18/05).
4. Validações: py_compile no backend, backend-ci (pytest) e test.yml no push, news:dry real, vm.Script nos 4 blocos inline do index.html.

**PENDÊNCIAS pro Andre:**
0. **Ativar o seeder do fórum**: gerar uma chave (ex: `openssl rand -hex 32`), setar `FORUM_BOT_KEY` no Railway (env do backend) e em GitHub Secrets, e redeploy do backend (o mesmo redeploy ativa o token via fragment da fase 3). Depois testar com `gh workflow run forum-seed.yml`.
1. **Token R2** (Settings do Cloudflare > R2 > API token com write no bucket) + cadastrar como secrets `R2_*` pra fase final: slides/stories param de ser commitados e o repo para de crescer ~48MB/mês. Pedir numa próxima sessão: "implementa o upload R2 dos slides".
2. **Redeploy do backend no Railway** (se não for automático no push): ativa o redirect com #token= (até lá o formato antigo ?token= segue funcionando, nada quebra).
3. **Conferir no celular**: site navegando normal (CSP nova), login do fórum, abrir 1 link /n/ antigo do Telegram.
4. **Monitorar 1 ciclo da routine**: próximo PR `claude/news-routine-*` deve ser auto-merged normalmente (valida o fetch-depth 50). Se falhar, rollback = voltar pra `fetch-depth: 0`.
5. Antigas: conta IG MEDIA_CREATOR -> BUSINESS (origem do 2207051); decidir uso do dataset setlist.fm.

## ⭐ Sessão 2026-06-09: conserto da DUPLICAÇÃO de posts no IG (FEITO, 75/75 testes)

**O bug:** 4 prováveis duplicações entre 07/06 e 09/06 (cd-20260607, cs-0c2a325251, d443026bc2, carrossel d97b23a764+a65e2c5d02). O falso-erro `code 4 subcode 2207051` do media_publish voltou (post sai MAS a API devolve erro). O `recoverPublishedPost` de 01/06 existia, mas checava o `GET /media` UMA vez, ~340ms após o erro, e o IG ainda não tinha indexado o post (consistência eventual). Resultado: item voltava pra fila (`_rateLimitedUntil` +1h) e o cron seguinte republicava. Prova nos logs do Actions: run 27215627593 (09/06 15:07) falhou sem recuperar; run 27235696930 (21:04, MESMO conteúdo) deu o mesmo erro e dessa vez recuperou o próprio ghost, ou seja, o mecanismo funciona, só checava cedo demais.

**Conserto (2 camadas):**
1. **Poll com retry** em `recoverPublishedPost` (`instagram.mjs`): 5 tentativas com 10s de intervalo (~40s de janela) em vez de 1 checagem imediata. Override por env `IG_RECOVER_ATTEMPTS` / `IG_RECOVER_DELAY_MS`. Agora exportado.
2. **Guarda cross-run** (`run-publish.mjs` + `queue.mjs`): antes de TODO publish, `markAttempt` grava na fila `_lastAttemptAt` + `_lastAttemptCaption`. No run seguinte, item maduro com tentativa anterior dispara 1 `GET /media`: se o post da caption tentada já existe, `markPosted` direto, sem republicar. `markPosted` limpa os campos. Trade-off documentado: match por prefixo de caption pode, em caso raro de batch recomposto, marcar item sem ter saído (perder 1 item < duplicar).

**Mock + testes:** mock ganhou `mediaHideCalls` (GET /media devolve vazio nas N primeiras chamadas, simula a indexação atrasada). 2 testes novos em `recover-publish.test.mjs` (visibilidade atrasada + guarda cross-run). Suíte 73 -> 75, tudo verde.

**Limpeza das duplicatas (FEITO na mesma sessão):** Andre apagou as duplicatas no app (e também o 7bb4cb8a78, intencional, não era duplicata). Forcei a re-detecção de apagados via workflow_dispatch (zerei `_detect-deleted-stamp.json` e o `_ig-exists-cache.json`, que ia pular os posts recém-checados por 7 dias). Resultado: 48 posts checados, denylist 8 -> 11 itens (entraram d97b23a764, a65e2c5d02, 7bb4cb8a78; cd-20260607 e cs-0c2a325251 já tinham entrado sozinhos em 08/06). d443026bc2 segue com a cópia rastreada viva, a duplicata antiga dele nunca foi rastreada, nada a registrar.

**PENDÊNCIA pro Andre (única restante):** ORIGEM do 2207051: converter a conta MEDIA_CREATOR -> BUSINESS (todo media_publish dos últimos 3 dias devolveu esse erro, até os que terminaram OK). Enquanto isso, o sistema depende da recuperação, que agora está robusta.

**Housekeeping desta sessão:** repo local estava 6 dias atrás do origin com a curadoria local de 03/06 staged e obsoleta (já tinha entrado no remoto). Feito stash (guardado em `stash@{0}` como backup) + pull.

## ⭐ Sessão 2026-06-03: expansão de fontes + setlist.fm (FEITO)

**Diagnóstico do teto 3->4:** confirmado que NÃO quebrou nada (backlog do `_pending` ficou em 0-2, longe do alerta). Achados cosméticos pré-existentes, não regressão: mensagens de commit da curadoria às vezes saem com `$(jq ...)` literal (vem de `routine-prompt.md`, não expande na routine) e `billboard-br` volta XML malformado de forma intermitente.

**Fontes: 19 -> 38 (depois 39 com setlist.fm).** Em `scripts/news/sources.mjs`:
- 4 URLs corrigidas (só respondiam via redirect): stereogum (apex sem barra), pitchfork (`/feed/feed-news/rss`), rolling-stone-br (mudou pra `rollingstone.com.br`), cnn-br (`admin.cnnbrasil.com.br`). Removida `oglobo-musica` (morta).
- +19 fontes novas via 2 passadas de deep-research + validação ao vivo (curl: HTTP 200 + itens + texto). Novo group `intl`. Cobre EN/PT/ES/DE/IT e ~12 países (US, BR, DE, IT, ES, AR, MX, CL, AU, CA, UK). Idioma não é barreira (curadoria Sonnet traduz). Dedicadas PJ (alwaysRelevant) usam tag-feed: só excerto no RSS, o `scrapeArticle` puxa o corpo (confirmado por teste: extrai 1300-4600 chars até em alemão/espanhol).
- Mercados de PJ (ranking por proxy de turnê setlist.fm, já que Spotify/Last.fm por país não são públicos): fora dos EUA, Canadá > Austrália > UK > Alemanha > Holanda > Itália; LatAm Brasil > México > Chile > Argentina.

**Teto MAX_NEW_PER_RUN 4 -> 10** (`fetch-news.mjs`), alerta de backlog `NEWS_PENDING_ALERT` 12 -> 25 (`news.yml`). Validado por dry-run: 36/38 fontes respondem (só billboard XML e reddit-pj 403 sem proxy local). DECISÃO PENDENTE: subir pra 15 na PRÓXIMA, depois de confirmar que a curadoria drena os 11 itens atuais sem estourar o tempo (Andre lembrou que a routine já avaliou 56-61/rodada; ressalva: aqueles eram texto vazio, baratos; agora é texto rico, scrape real por item). Risco real é wall-clock da routine, não capacidade da Sonnet.

**setlist.fm integrado (fase 2):** handler novo `scripts/news/setlistfm.mjs` (módulo separado porque importar `fetch-news.mjs` auto-executa `main()`). Source `setlistfm-pj`, group novo `turne`, `kind: "setlistfm"`. Cada show recente vira matéria com o setlist completo (`preText`), filtro de 45 dias (dormante fora de turnê, dispara sozinho na próxima). MBID PJ `83b9cbe7-9857-49e2-ab8e-b57b01038103`. Descobertas validando ao vivo: setlist.fm dá 403 pra UA de bot (handler manda UA de browser), rate limit 2/s. Teste `setlistfm.test.mjs` (8 testes), suíte **65 -> 73**.

**Dump histórico de shows:** `scripts/news/setlistfm-dump.mjs` (one-shot, fora do pipeline) baixou PJ 1134 + Eddie Vedder solo 313 = **1447 shows, 1990-2026**, versionado por ano em `media/setlistfm/by-year/<ano>.json` + `index.json`. Offline, commitado, redundante (disco + GitHub). Dados confiáveis (conferidos: 2019 só tem EV, zero PJ, bate com o PJ no estúdio do Gigaton). Eddie Vedder MBID `1a60d6dd-9d3e-40fc-a66d-3184f9ee0d61`. Material de trabalho pra timeline/stats/validação, uso a decidir.

**PENDÊNCIAS desta sessão:**
1. **Cadastrar secret `SETLISTFM_API_KEY` no GitHub** (Settings > Secrets > Actions). Sem ele o handler do setlist.fm faz skip gracioso (não quebra, mas fica dormente em produção). Andre vai fazer.
2. **Cap de diversidade por fonte no slice** (recomendado): o dry-run mostrou o podcast SOLAT comendo vários dos slots (4 de 11). Limitar 1-2 por fonte deixaria imprensa real entrar junto. É o complemento do teto 10.
3. Menores: fallback do `red-mosquito` (scrape Blogger dá 0 chars, mas tem texto no feed), parse do `billboard-br`.
4. Decidir o uso do dataset de shows (`media/setlistfm/`). Andre vai ver isso depois.

## ⭐ Throughput da curadoria: MAX_NEW_PER_RUN 3 -> 4 + alerta de backlog (2026-06-01, FEITO)

## ⭐ Throughput da curadoria: MAX_NEW_PER_RUN 3 -> 4 + alerta de backlog (2026-06-01, FEITO)
**Por que o teto existia:** `MAX_NEW_PER_RUN` (`scripts/news/fetch-news.mjs`) limita itens novos coletados por rodada. Começou em 6, baixou pra 3 em 2026-05-12 (commit `829ee18`) porque a **routine de curadoria estourava o tempo** (5 itens/run = 3 mídia + digest + spotlight). NÃO é regra de feed nem anti-spam do IG, é orçamento de wall-clock da routine Sonnet que cura o `_pending`. O community-fetch tem cap próprio (1 digest + 1 spotlight), fora desse número.

**O que mudou:** subido 3 -> 4 (experimento monitorado, agora que o feed está destravado). O risco de subir NÃO é o `news.yml` (só coleta, termina em ~40s, timeout de 12min). É a routine remota, que cura TODO o `_pending` por disparo: se a coleta entra mais rápido do que a curadoria drena, vira backlog e a routine demora/estoura.

**Como sabemos se vai dar bug (detector):** novo step "Alerta backlog _pending" no `news.yml`. Estado normal do `_pending` é 0-3 itens (a routine drena a cada run; hoje está em 1). Se passar de `NEWS_PENDING_ALERT` (default 12, env override via `vars.NEWS_PENDING_ALERT`), dispara aviso no Telegram. Backlog baixo e estável = seguro subir mais (5, 6...). Backlog crescendo = baixar de volta pra 3. Rollback = trocar o número em `fetch-news.mjs`. Suíte 65/65.

## ⭐ Conserto do repost do feed (2026-06-01, FEITO e testado)
**Causa real (o handoff anterior estava errado):** o `media_publish` do IG devolve `code 4 subcode 2207051` ("atividade restringida / potential spam", NÃO volume: X-App-Usage 0%) MESMO tendo publicado o carrossel. Falso-erro documentado pela Meta. O cliente tratava como rate limit, `markPosted` nunca rodava, o item ficava sem `postedAt` e seguia maduro, então a próxima janela re-postava. Por isso o histórico da fila mostra sempre `spotlight:0/N`. Evidência que fechou: o carrossel `DZCZhjaEeV0` está no Instagram com os 5 itens, mas a run das 09:00 registrou `FALHA code=4 subcode=2207051`.

**Conserto aplicado:** `recoverPublishedPost` em `scripts/publish/instagram.mjs`. Após qualquer erro no `publishContainer` (single e carrossel), faz `GET /<uid>/media` e, se o post que tentamos já está lá (caption batendo + criado depois do início da tentativa), devolve o id real e trata como sucesso (`{ recovered: true }`). Aí o `markPosted` roda, o item sai do pool, não re-posta. Mock ganhou modo `ghostpublish` + endpoint `GET /<uid>/media`. Teste novo `scripts/publish/recover-publish.test.mjs`. Suíte 48/48.

**Ainda pendente (origem do flag de spam, não do repost):** conta é MEDIA_CREATOR. Converter pra BUSINESS no Instagram + reduzir a frequência de disparo (a routine pusha 4x/dia mesmo em 100% SKIP, multiplicando os webhooks do publish) reduz o `2207051` na origem. Hardening opcional separado: persistir `postedAt` imediatamente após sucesso (protege contra falha de commit da fila por conflito; é risco latente, não foi a causa deste incidente).

## ⭐ Fluxo de notícias/postagem/schedule: ver PIPELINE.md
**Para entender TODAS as etapas (coleta, curadoria, publicação, schedule), leia `PIPELINE.md`, seção "Estado real e diagnostico" no topo.** É a fonte da verdade do fluxo. Memórias: `project_news_scraper_gargalo`, `project_mock_ig_abas`.

## Estado atual (2026-06-01)
**Feed destravado:** o `code 4` que derrubava o publish NÃO era volume (o header `X-App-Usage` mostrou 0%). Era **token + IG_USER_ID errados + app em dev mode**. Andre virou o app Live, regenerou o `IG_ACCESS_TOKEN` e corrigiu o `IG_USER_ID` (era `17841414148425536`, certo é `27761714130083125`). Smoke test passa ("TUDO PASSOU"). Cooldown e rate-limit-backoff resíduo limpos.

**Achado principal (o gargalo de verdade):** o feed recebe pouca notícia nova **por causa do SCRAPER, não da curadoria nem do feed**. O `reddit-search` traz `article_text` vazio (só `"submitted by /u/x [link][comments]"`). Sem texto, a curadoria (Claude schedule, roda 4x/dia, commita direto na main como autor "Claude") corretamente faz SKIP de quase tudo: 56-61 itens/rodada → 0 ou 1 aprovado. Até a notícia do novo baterista (`a7233f622d`) morre toda rodada por "texto vazio". Detalhe completo em PIPELINE.md.

**Observabilidade montada:** a routine agora grava log por rodada em `media/news/_curation-log/<TS>.json` (aprovados + todos os SKIP com razão), inclusive rodadas 100% SKIP. Prompt atualizado em `scripts/news/routine-prompt.md` e **recolado na scheduled task do Andre** (a task usa snapshot, não lê o arquivo). O mock-ig ganhou abas **Curadoria** (pending vs pego) e **Rodadas** (lê os logs), além de Simulador e Runs. Atalho "Mock Instagram" na área de trabalho sobe tudo num clique.

**Quem dispara o `publish-instagram.yml`:** TriggerAll (sistema separado, Railway+Vercel). O cron no YAML foi removido em `b3a5636` mas o TriggerAll JÁ EXISTE e está rodando: dispara via `workflow_dispatch` da API com PAT do Andre (actor: `andrehz4`, segundos `:01`). Webhook na rotina Claude + cron extra observado às 06:00 BRT. Detalhes em `PIPELINE.md` seção 7 e memória `reference_triggerall`.

## Próximo passo concreto
1. **Consertar o scraper** (`scripts/news/` + `news.yml`): o `reddit-search` precisa SEGUIR o link externo e extrair o texto do artigo-fonte, em vez de só pegar o metadado do post. É o que vai dar matéria-prima pra curadoria aprovar (e a notícia do baterista finalmente chegar no feed). Também melhorar o filtro de relevância (deixa passar Grammy, Duff McKagan, food review).
2. Monitorar a aba Rodadas: a partir de 06:00 BRT de 2026-06-01 a routine começa a gravar logs reais. Vários SKIP "texto vazio" seguidos = confirmação contínua do gargalo.
3. (opcional) Decidir se restaura um cron pro `publish-instagram.yml` (Andre mandou esquecer por ora).

## mock-ig: Instagram fake local (NOVO, completo)
Pasta `mock-ig/` (genérica, serve qualquer app que publique no IG, inclusive Terra Gentil). Doc em `mock-ig/README.md`. Interceptação por env `IG_API_BASE` (default = Graph real, produção intocada).
- **Fase 1:** mock Graph API (server.mjs) + run.mjs + reset.mjs + testes.
- **Fase 2:** front React+Vite (`mock-ig/web/`), layout Instagram web desktop (sidebar + grid). Feed/carrossel/stories.
- **Fase 3:** story ponta a ponta (createStory→poll→publish), `mock:story` / `mock:story:reuse`.
- **Fase 4:** painel de injeção de erro (rate limit/quota/video) + reels.
- **Simulador:** aba que lista o material REAL da fila (pendentes + postados, por tipo) e gera o preview do post (slide + caption reais). Read-only, slide vai pra `media/news/_preview/` (gitignored). Botão Atualizar.
- **Contador de chamadas:** medidor horário global (chamadas última hora / ~200, alarme 80%=160) + custo por post (badge + breakdown). Envs `MOCK_HOURLY_LIMIT`, `MOCK_ALARM_PCT`.
- Comandos: `mock:server`, `mock:seed`, `mock:publish`, `mock:story`, `mock:reset`, `test:mock`. Server roda local em http://127.0.0.1:8788.

## Hardening anterior do pipeline (mesma sessão, commits antes do mock)
- Cooldown global no rate limit code 4 (`_ig-cooldown.json`) + cache da detecção de apagados.
- Dedupe-history: unigrama + stopwords de domínio + guard de título curto (MIN_TOKENS=5) pra saga reescrita não duplicar e título curto não dar falso positivo.
- Diversidade por assunto no carrossel (topicCap=1) + item envenenado não trava slot (errorCount/MAX_ERRORS) + tombstones (_skipped-stale, _rejected-curated).
- Suite de testes: 45/45 (`npm test`).

## Backlog mobile (pós B1→B5)

- [x] **BANDA mobile: visual quebrado** (Andre reportou em 2026-05-29 com screenshot, patch aplicado em build .15)
  - **Diagnóstico:** o `mobile-banda.css` original do B2 só tratava do estado ABERTO da ficha (`.bm.is-open`). O B2 nunca propôs ajuste do estado FECHADO dos cards, então `.bm-role` herdava 10px do desktop (microscópico) e `.banda-title` herdava `clamp(40px, 8vw, 84px)` que ficava desbalanceado no mobile
  - **Fix aplicado:** estendi `mobile-banda.css` com regras pra estado fechado:
    - `.banda-masthead` ganhou padding vertical (18px top, 14px bottom) + borda tracejada
    - `.banda-title` virou `clamp(36px, 11vw, 56px)` (era 40-84px) → cabe na largura sem dominar
    - `.banda-eyebrow` 9.5px com margin-bottom 8px (hierarquia visual)
    - `.bm-meta` ganhou padding (10px 8px 12px) pra respiro
    - `.bm-name` 18px (era 19) com margin-bottom 6px
    - `.bm-role` 11.5px com letter-spacing 0.12em (era 10px sem override = microscópico)
    - Em ≤480px: title encolhe pra 32-44px, name 16px, role 11px
  - **Aguarda validação visual:** hard reload em `setlists-pj-ev.pages.dev`, confirmar build `.15`, abrir aba BANDA no DevTools 375 e 414 e ver se ficou apresentável. Se ainda quebrado, abrir nova sessão com screenshot atualizado
- [ ] (futuro) Drawer de show no mobile (review independente — não foi visto nesta sprint, pode ter problemas próprios)
- [ ] (futuro) Lighthouse mobile pós-skin (não rodado; pode revelar regressões de perf)
- [ ] (futuro) Teste em device real (iPhone SE, Android comum) — só DevTools até agora

## Sessão 2026-05-29 — Batches 1, 2, 3, 4 e 5 mobile aplicados

### Instalação
Pasta `mobile/` com os arquivos do design bundle Anthropic (`mobile-pj`), agora com **todos os 7 parciais ativos**:
- `mobile.css` (aggregator com `@import` dos 7 parciais, zero placeholders)
- `mobile-core.css` **B1+B2+B3** (nav scroll-snap sticky, masthead compacto, filter-bar wrap, audio-player 1-linha, footer coluna única; B3 mata reticência da aba "BUS..." em iPhone SE)
- `mobile-news.css` **B1** (#view-news fanzine)
- `mobile-timeline.css` **B2** (year-label 96→60px, drawer setlist 16px, chips LETRA/TAB/ANÁLISE)
- `mobile-gallery.css` **B2** (contact-sheet 3 colunas + **fix crítico lightbox**: setas ‹ › reativadas)
- `mobile-banda.css` **B2** (membro aberto vira `grid-column: 1/-1`)
- `mobile-cifras.css` **B3** (#view-tabs: busca ≥46px com fonte 16px anti-zoom iOS, itens ≥52px, transport com play 54px, partitura scroll interno, chord-chips legíveis; **FAB #9 resolvido CSS-only** via `#audio-player.active ~ .alphatab-fab` → `bottom: 112px` (104 em ≤480), zero JS)
- `mobile-forum.css` **B4** (#view-forum iframe edge-to-edge + páginas standalone: header/auth/btn ≥40px, busca 16px anti-zoom, **`.profile-body` colapsa em 1 coluna** — antes 1fr+320px espremia o conteúdo)
- `mobile-aux.css` **B5** (polimento das 6 views auxiliares: #view-ranking linhas ≥52px, #view-gaps álbuns 1-col, #view-highlights cards 1-col, #view-rarity trophy-wall 1-col + tabela enxuta, #view-search busca 16px anti-zoom, #view-deep grid 2→1 col com setas/thumbs do leitor 3D ≥44px)
- `README.md` (decisões B1 + B2 + B3 + B4 + B5)

### Mudança de HTML do B4 (primeira do projeto além do index)
Adicionada 1 linha no `<head>` de cada uma das 3 páginas standalone do fórum, logo após o `</style>` próprio:
```html
<link rel="stylesheet" href="mobile/mobile-forum.css" media="(max-width: 768px)">
```
Arquivos tocados: `forum.html`, `forum-topic.html`, `forum-profile.html`. O `mobile-forum.css` é auto-contido (não depende dos outros parciais) e só dispara em ≤768px.

### Linha no `<head>`
Logo após os `<link>` das fontes Google:
```html
<link rel="stylesheet" href="mobile/mobile.css" media="(max-width: 768px)">
```

### Contrato
- Zero JS novo, zero alteração no HTML existente, zero renomeação
- Só aplica em ≤768px (media attr no link + `@media` em cada parcial = cinto+suspensório)
- Usa só tokens existentes (`--bg`, `--ink`, `--pj`, `--np-*`, `--font-*`)
- `!important` necessário pra vencer o redesign ticket archive + blocos legados `@600/@640/@760`

### Problemas resolvidos
**B1:** #1 Nav 12 abas · #4 Chips de tag · #5 Audio player · #6 Footer
**B2:** Timeline year-label engolindo cards · Drawer setlist legibilidade · Galeria contact-sheet · Lightbox sem navegação (CRÍTICO) · BANDA ficha espremida (parcial — ver backlog)
**B3:** Cifras catálogo/transport · FAB #9 (CRÍTICO, resolvido CSS-only via sibling selector)
**B4:** Fórum iframe edge-to-edge · `.profile-body` colapso · alvos de toque nas 3 standalone
**B5:** Polimento de 6 views auxiliares + leitor 3D do Deep

### Contrato final
- Zero JS novo em todo o projeto mobile
- Apenas 4 linhas de HTML adicionadas: 1 em `index.html` (+ 1 em cada `forum*.html`)
- Skin não dispara em desktop (media attr no link + `@media` em cada parcial)
- Desktop intocado (rollback de toda skin = remover 1 linha do `index.html` e 1 de cada `forum*.html`)

## Sessão 2026-05-28/29 — fila de 22 tasks atacadas

### Cutover V2 → produção (commits `65c70a2`, `252394b`)
V2 (cifras-v2.html com ~20 fixes) virou index.html. 3 ajustes pré-cutover (title, script auto-open, build tag) + delete cifras-v2.html.

### Fixes na seção de cifras (heranças do V2)
FAB sem play duplicado + × de fechar | master mixer bindado em renderTabsView | scroll preservado entre instrumentos | diagrama frets>4 + barre detection (objeto/número/fingers repetidos) | violão usa cdata.fingering do JSON (antes caía em _CHORD_DB legado) | voice-picker dentro de .tab-pane-tab | mixer-aside sempre expandido | footer compacto (-252px de espaço morto) | decais pj-stickman + halo defensivo nos marcadores | zoom de texto A−/A+ default 120% persistido | strumming-bar sempre renderiza (piano) | 3 tablists com aria+SVG+sync correto | botão "Visualizador" (era "Braço") | bug E corrigido: `drawBoard()` chamado no handler do tablist 3.

### Cobertura de acordes 100% (commit `7e5d2fa`)
- `scripts/audit-chord-coverage.mjs` + `scripts/fill-chord-gaps.mjs` + `scripts/cifras-coverage.test.mjs` (8 testes node)
- 34 acordes preenchidos em 11 músicas
- `npm test` agora roda 2 suites (cifras + band-fallback)

### Vistoria de sprint (commits `7fd12c2`, `ee29742`, `417f116`)
Nota média 6.3 → 7.0:
- Segurança 6→8.5: DOMPurify carregado + helper `window._safeHtml` + meta `referrer`
- Observabilidade 4→6: error handlers JSON em `window.error` e `unhandledrejection`
- SEO 9→10: sitemap expandido + JSON-LD Schema.org (WebSite + Person + MusicGroup + SearchAction)
- Testes 3→5: 8 testes node nos JSONs cifras-multi

### Paginação de notícias (commit `e6feb41`)
`const _NEWS_PER_PAGE = 22;` (variável) | acima e abaixo do grid | hero fixo não pagina | reset ao trocar tag | state em `window._newsCurrentPage` | lista compacta mantida como complemento.

### Integração fórum via iframe (commit `2fbbc46`)
Tab Fórum interna | `<iframe src="forum.html">` lazy | altura dinâmica via postMessage | boot lê `?tab=forum` | auth-callback redireciona pra `/?tab=forum` | sub-páginas (topic, profile) abrem em nova aba.

### Migrações SQL no Supabase (Andre rodou)
001 (body→text + tabela reactions) | 002 (anchor_show_id) | 003 (bio/email/birth_year/city/shows_attended) | **ALTER manual extra**: forum_reactions ganhou coluna `site` DEFAULT 'pj' (CREATE TABLE IF NOT EXISTS tinha pulado porque tabela já existia em schema antigo).

### Perfil do fórum: shows que esteve aparecem (commit `0b87db9`)
4 bugs em forum-profile.html: stat hardcoded `—` | badge "Tava lá" sempre false | badge "Decade" sempre false | lista de shows não renderizava. Fix: usar data.shows_attended.length, computeBadges(data, cat) consome catálogo, nova seção "Shows confirmados" + auditoria backend confirmou que PATCH /users/me salvava corretamente.

### Reformulação do perfil pelo design bundle (commit `7161ef6`)
Extraído de `screen-profile.jsx` + `styles-profile.css` do bundle Claude Design "Raul_8mm" (sem copiar wholesale): bio editorial, locale com cidade+ranking, stats reordenados, "Shows que esteve" virou grid de chips (formato `DD MES YY`), rail com Posts/mês e Threads/mês calculados, card MEMBRO com email+nascimento. Pulou features sem backend: Seguir, Idiomas, Músicas mais citadas, Presenças raras.

### Cleanup mock antigo do fórum (commit `c42a30a`)
Removidos `_fState`, `renderForum` mock, `_fHomeHtml/Thread/Composer/Profile/Show/Empty`, `_forumWireEvents`, dados hardcoded de 16 tópicos, CSS órfão `body.in-forum`. index.html: 21693→20958 linhas (-735, -3.4%). Sintaxe JS validada.

### Bug E do tablist 3 (commit `3953dfc`)
Click em Baixo/Bateria não redesenhava braço (continuava 6 cordas guitarra). Causa: handler chamava só `drawActiveNotes()` (pinta notas), faltava `drawBoard()` que escolhe entre drawFretboard/drawPianoBoard/drawDrumKit por INSTRUMENTS[t].type. Fix de 1 linha.

## Decisões registradas

- **#8 Cifras compartilhadas entre instrumentos**: MANTER design atual (opção A). Não é bug, é intencional. `_meta` dos JSONs documenta. O que varia por instrumento: `instruments.{inst}.chords` (popover/braço) + `strumming` (palhetada). Refactor pra cifras separadas (opção B) exigiria re-curadoria dos 191 JSONs, fora de escopo.
- **Bug #10 H** (posicionamento confuso dos 3 tablists): UX/design subjetivo, deixado pra ser redesenhado via Claude Design no mobile.

## Bugs novos descobertos durante a sessão (todos resolvidos)
- Paginação notícias inexistente → criada (#20)
- UndefinedColumnError no perfil → 3 migrações + ALTER reactions
- Shows confirmados não apareciam → 4 fixes em forum-profile (#renderProfile + computeBadges + section nova)
- Tab Fórum apontando externo → integração iframe (#19)
- Forum-profile sem design do bundle → reformulação (#21)
- Mock antigo do fórum órfão → cleanup (a-e item a)
- Bug E tablist 3 → 1 linha (a-e item c)

## Próxima sessão: mobile

Prompt completo entregue na sessão pra usar com Claude Design. Estratégia: CSS apartado em pasta `mobile/` carregado via `<link media="(max-width: 768px)">`, zero alteração no HTML/JS gigante existente. Pacote inclui inventário completo de localStorage keys, window vars, IDs/classes sagradas, fluxos críticos, estado SPA, problemas mobile conhecidos.

## Arquivos-chave dessa sessão
- `index.html` — todo o trabalho de cifras + fórum iframe + paginação + structured data + cleanup mock
- `forum.html` — emitter postMessage
- `auth-callback.html` — redirect `/?tab=forum`
- `forum-profile.html` — design bundle aplicado
- `sitemap.xml` — expandido
- `package.json` — npm test agregado
- `scripts/audit-chord-coverage.mjs`, `scripts/fill-chord-gaps.mjs`, `scripts/cifras-coverage.test.mjs`
- `backend/migrations/001-003.sql` — aplicados no Supabase + ALTER manual de reactions

## Memória atualizada
- `project_cifras_v2_substitui_v1.md` — CONCLUÍDO (cutover em 2026-05-29)
- `MEMORY.md` index — entrada atualizada

## Blockers
Nenhum. Fila zerada.

## Como continuar
1. Hard reload em produção (Ctrl+Shift+R), confirma `build 2026-05-29.09` no rodapé
2. Smoke test: tabs nav, paginação notícias, perfil do fórum carrega e edita, cifra de Alive funciona, braço muda pra Baixo/Bateria sem manter 6 cordas
3. Próxima sessão: usar prompt mobile (entregue) no Claude Design, aplicar bundles batch por batch em pasta `mobile/`
