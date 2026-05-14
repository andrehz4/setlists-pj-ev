# PROGRESSO, setlists-pj-ev

## Data
2026-05-13 (fim de tarde/noite)

## HANDOFF SESSAO 2026-05-13 NOITE: Instagram @smufdpj no ar, rebrand site, expansao de fontes BR + oficiais

### Resumo do estado em uma frase
Pipeline IG `@smufdpj` operacional em producao (5 posts ja publicados, ultimo cron de publish funcionou). Site rebrandeado pra "So mais um fa de Pearl Jam". Coleta expandida com 9 fontes BR + 2 oficiais (pearljam.com/news + shop.pearljam.com). HEAD `079fb54`.

### O que esta funcionando hoje
- **Carrossel IG operacional**: workflow `publish-instagram.yml` cron 30min (`:17,:47`), endpoint `graph.instagram.com/v21.0` via fluxo "Instagram with Instagram Login", token long-lived 60d em GH Secret `IG_ACCESS_TOKEN`. Posts ja publicados: 1 spotlight + 1 regular single + carrossel de 3 slides (backfill manual de items pre-integracao). postCount=3.
- **Rotacao de cores da tarja superior**: muda a cada 3 posts. Ciclo: vermelho `#c12727` -> preto `#0a0908` -> ocre `#a87f2c` -> azul `#2a5b9e`. Proximo post (4o) ja sai com tarja PRETA (primeira transicao).
- **Caption do post completa**: title + intro + body_pt inteiro (truncado em ultimo paragrafo/frase antes de 2200 chars) + CTA "leia completo em setlists-pj-ev.pages.dev" + 5 hashtags fixas (`#pearljam #eddievedder #pjbrasil #grunge #smufdpj`) + tags dinamicas. Fonte original NAO mencionada (credito vive dentro da materia no site).
- **Dedupe BR por similaridade**: Jaccard >= 0.65 sobre shingles de 4 palavras (titulo+snippet normalizado). Cluster por union-find. Em cada cluster, mantem o item com texto mais LONGO. So aplica dentro do group="br".
- **Site rebrandeado**: title=`So mais um fa de Pearl Jam`. h1 do masthead atualizado, og:title, twitter:title, news-flag-stamp ("SMUFDPJ" no topo de Noticias). Titulo do masthead clicavel = atalho pra home (view Noticias + scroll top).
- **"Continue lendo" no fim de cada noticia**: 2 cards de outras noticias priorizando mesma tag, depois mais recentes. Click abre a proxima + scroll top.
- **Fontes novas**:
  - **pearljam.com/news**: scraper que extrai JSON inline `"articles":[...]` do HTML (RSS oficial continua quebrado). Dry-run pegou 3 items: Ohana 2026, Book Signing Geoff Whitman, EV x Japan Tour Merch. `kind=pjcom-news`, tag obrigatoria `tenclub`.
  - **shop.pearljam.com**: Shopify products.json nativo (`/collections/featured/products.json` + `/collections/music/products.json`). Filtra produtos `published_at` < 21 dias, ignora Gift Card. Curador trata como noticia editorial (sem mencionar preco, contexto historico). `kind=shop`, tag obrigatoria `loja`.
  - **8 portais BR**: Rolling Stone BR, Billboard Brasil, CNN Brasil, Terra (Musica), O Globo (Cultura/Musica), Igor Miranda, Tenho Mais Discos Que Amigos, Wikimetal. Junto com Folha = 9 BR.

### Decisoes da sessao
- **Conta IG**: `@smufdpj` (nova, criada pra projeto, convertida Business + Page FB criada e vinculada). Andre = unico admin do app Meta "Setlists PJ EV Bot" (FB pessoal antiga, conta nova ficou bloqueada por anti-fraude).
- **Business Verification submetida** em 2026-05-13, status "Em analise" (~2 dias uteis). Token atual funciona em modo Development com conta tester @smufdpj sem precisar de App Review.
- **GH Secrets configurados**: `IG_USER_ID`, `IG_ACCESS_TOKEN`, `IG_APP_SECRET`, `IG_APP_ID`, `FB_APP_ID`. Refresh do token automatico via `refresh-ig-token.yml` (cron dia 1 e 15 do mes).
- **Spotlight + regular = posts separados**: confirmado, mantem agrupamento por type.
- **Reels + Stories no roadmap (task #14)**: 1 render MP4 1080x1920 vai pro Reel E pro Story (mesmo MP4). Bloqueado ate carrossel JPG validar ~1 semana. Story sem link sticker inicialmente (conta nova precisa 10k+ followers pra liberar).
- **Threads parqueado**: RSS publico nao existe (RSSHub quebrado), RSS.app pago foi descartado. Volta quando virar prioridade.

### Routine Sonnet (estado atual)
```
id            : trig_01WTGwu5LzVJrQcxtMpRH3Te
enabled       : true
cron          : 30 */6 * * * UTC
modelo        : claude-sonnet-4-6
proximo run   : ~21:30 BRT (cura items NME novos coletados as 17:14 BRT)
```

### Cronograma diario automatico
```
UTC      BRT      Workflow
─────────────────────────────────────────────
00:23    21:23    GH Actions news.yml (8 fontes EUA + 9 BR + 2 oficiais + reddit)
00:30    21:30    Routine Sonnet cura _pending.json -> index.json + queue IG
*/30     */30     GH Actions publish-instagram.yml (publish-instagram.yml :17,:47)
06:23    03:23    news.yml
06:30    03:30    Sonnet cura
12:23    09:23    news.yml
12:30    09:30    Sonnet cura
18:23    15:23    news.yml
18:30    15:30    Sonnet cura
13/15 mes 06:13   refresh-ig-token.yml (renova token long-lived)
```

### Bugs conhecidos / cuidados
1. **GAP de 13/05 cedo**: items curados pelo Sonnet as 14:15 BRT (antes do commit `a9b6aa5` da integracao enqueue no merge-curated) entraram no index.json mas NAO foram pra publish queue. Resolvido via backfill manual (3 items: Stereogum, Rolling Stone, PJ Online IT memoria). A partir do proximo cron Sonnet, integracao funciona automatico.
2. **Anthropic Cloud bloqueia git push do sandbox**: routine remota usa MCP GitHub `create_or_update_file` single-file (push_files estoura stream).
3. **LF/CRLF warnings em todos os commits**: cosmetico, sem impacto. Windows + git.
4. **Stories link sticker** so libera com 10k+ followers; conta nova vai postar story sem link clicavel (so "link na bio" textual).

### Frentes abertas pro proximo chat
1. **Acompanhar primeiros posts naturais (proximas 6-8h)**:
   - Sonnet routine 21:30 BRT cura 3 items NME coletados hoje (Hugh Jackman, Even Flow CPR, Bruno Mars cover)
   - Em 3h depois (~00:30 BRT), publish acorda e posta - PRIMEIRA tarja PRETA aparece (postCount transitiona de 3 pra 4)
2. **Validar que shop + pjcom-news entram no pipeline real** quando proxima coleta rolar
3. **Conferir logs de dedupe BR**: ver quais portais foram pegos como replicas (Folha=Terra=CNN pelo mesmo wire)
4. **Task #14**: Reels + Stories. Aguardar 1 semana de carrossel validado. Implementar quando confortavel.
5. **Task #2**: App Review Meta. Em analise (~2 dias uteis a partir de 2026-05-13). Quando sair Business Verification, submeter App Review pra instagram_content_publish (sair do modo Development, aceitar publish em qualquer conta IG).
6. **Tasks #4-5 Threads**: parqueado em decisao de rota.
7. **Task #8 rebranding extras**: regerar og:image com novo nome, comentarios internos "Ticket Archive" no codigo, README se houver.

### Comando exato pra continuar (proximo chat)
```
cd C:\Gitlab_hz\pearljam\setlists-pj-ev && claude
```
Pede: "leia o ultimo HANDOFF no PROGRESSO.md e olhamos como ficou as ultimas 12h do pipeline rodando sozinho".

### Arquivos chave (atualizados nesta sessao)
```
Pipeline IG publish (novo):
  scripts/publish/queue.mjs              # fila + postCount + dedupe
  scripts/publish/slide-image.mjs        # gera JPG 1080x1350, tarja colorida
  scripts/publish/instagram.mjs          # cliente Graph API + caption builders
  scripts/publish/refresh-token.mjs      # auto-refresh token 60d
  scripts/publish/run-publish.mjs        # orquestrador cron 30min
  scripts/publish/seed-queue.mjs         # helper dev (backfill manual)
  scripts/publish/smoke-test.mjs         # valida token + escopos
  .github/workflows/publish-instagram.yml
  .github/workflows/refresh-ig-token.yml

Coleta expandida:
  scripts/news/sources.mjs               # +8 BR +2 oficiais
  scripts/news/fetch-news.mjs            # fetchShopifyItems + fetchPjcomNewsItems + dedupe BR
  scripts/news/dedupe.mjs                # NOVO: Jaccard sobre shingles
  scripts/news/curators/_shared.mjs      # VALID_TAGS += "loja"
  scripts/news/merge-curated.mjs         # VALID_TAGS += "loja", enqueue na fila IG
  scripts/news/prompts/system-curator-fa.txt  # regras pra kind=shop e kind=pjcom-news

Frontend (site):
  index.html                             # rebrand SMUFDPJ + h1 clicavel + "Continue lendo"

Dados (produzidos pelo pipeline):
  media/news/_publish-queue.json         # 5 items, postCount=3
  media/news/instagram-slides/<id>.jpg   # 3 slides do backfill (cd-... e 92083... excluidos)
```

### Secrets/configuracoes externas
- **GH Secrets**: `GEMINI_API_KEY`, `REDDIT_PROXY_URL`, `ANTHROPIC_API_KEY`, `IG_USER_ID`, `IG_ACCESS_TOKEN`, `IG_APP_SECRET`, `IG_APP_ID`, `FB_APP_ID`
- **Conta IG**: @smufdpj (nova, Business, vinculada a Page FB do projeto)
- **App Meta**: `Setlists PJ EV Bot` (FB_APP_ID=1679039826640945) com produto Instagram (IG_APP_ID=957999513763966). Modo Development, Business Verification "Em analise"
- **Token IG**: long-lived ~60 dias, refresh automatico via cron mensal (dia 1 e 15)

---

## HANDOFF SESSAO 2026-05-12/13 MADRUGADA: SPLIT MODE com Sonnet + redesign fanzine + tags por integrante

### Resumo do estado em uma frase
Pipeline de Noticias agora roda em **SPLIT MODE**: GH Actions coleta (cron :23, 6 em 6h), routine Sonnet 4.6 cura 7min depois (cron :30). Frontend de Noticias com identidade visual nova (fanzine xerox brasileiro). Site no ar com 7 noticias publicadas pelo Sonnet hoje. HEAD `32c9643`.

### O que esta funcionando hoje
- **SPLIT MODE operacional**: news.yml (cron 23 */6 * * *) + community.yml (cron 25 12/0 * * *) coletam e escrevem `_pending.json`. Routine Sonnet (cron 30 */6 * * *) acorda, faz git pull, le pending, cura, faz merge, commit + push.
- **Cloudflare Worker proxy** resolve 403 do Reddit em IPs de cloud: `https://reddit-proxy.eng-andrehz.workers.dev`. Secret `REDDIT_PROXY_URL` configurado no GH e usado tanto por news.yml quanto por community.yml.
- **3 modos de curadoria coexistem**: gemini (free, default ate hoje), anthropic (Haiku 4.5, precisa key), routine (Sonnet via plano Max, ATIVO).
- **Frontend Noticias** com tema fanzine xerox completo: papel creme, grain noise SVG, wordmark "NOTICIAS" stencil, hero 3 colunas com numero outline e drop cap, tags-stamp rotacionados em cores semanticas (turne vermelho, comunidade azul, memoria ocre, eddie roxo, mike vermelho-ferrugem, stone cinza-petroleo, jeff verde-mato, matt laranja-bateria, boom azul-teclado, josh mostarda), filtros bracketed `[ tag ]`, auto-scroll pro hero, skeleton xerografico.
- **Tags por integrante** substituiram `ed-solo`: eddie, mike, stone, jeff, matt, boom, josh. Regra: usa apenas quando o foco da materia eh AQUELE integrante (banda em turne = `turne`).
- **Assinatura nova nos community items**: "_Andre, so mais um fa idiota de Pearl Jam._" (substituiu "_Compartilhada na comunidade..._" e "_Termometro da comunidade..._"). Items de midia mantem "_via Stereogum_" etc.

### Comparacao 3-way Gemini 2.5 vs Sonnet 4.6 vs Gemini 3.1
Fizemos um A/B/C com 8 items do mesmo dia. Resultado:

| # | Item | Vencedor | Por que |
|---|---|---|---|
| 1 | Digest comunidade | Sonnet | Voz autoral, sem clichês |
| 2 | Spotlight retrato | Sonnet | Frase "microfone enrolado no cabo, escaladas de palco"; Gemini 3.1 usou "incriveis" (proibido) |
| 3 | Ohana PJ Online | Empate | Sonnet trouxe quote literal do McCready, Gemini 3.1 mais organizado |
| 4 | Stereogum | Gemini 3.1 | Sonnet pulou (duplicata semantica); Gemini 3.1 manteve |
| 5 | Rolling Stone | Sonnet | Trouxe Dave Abbruzzese (estava no input do Stereogum) |
| 6 | Bad Radio demo | Sonnet | Abertura "Antes do Pearl Jam, antes do 'Ten'..." |
| 7 | Jeff Ament Montana | Sonnet | Correct tag `jeff`, frase autoral |
| 8 | Livros recomendados | Gemini 3.1 (mas Sonnet tbm fez) | Ambos listaram autores |

Score: Sonnet 5, Gemini 3.1 2, Empate 1. **Sonnet eh o melhor escritor mas pula duplicatas semanticas e ocasionalmente eh telegrafico demais com listas.** Pra absorver os pontos do Gemini 3.1, adicionei DUAS regras novas no prompt `system-curator-fa.txt`:
1. **REGRA DE COBERTURA**: NAO SKIP por duplicacao de assunto entre fontes (Stereogum + Rolling Stone + PJ Online IT do mesmo Ohana 2026 viram 3 materias separadas, cada uma com angulo proprio).
2. **REGRA DE RIQUEZA INFORMACIONAL**: Quando o input tem LISTA concreta (livros, lineup, setlist, datas), listar TUDO no corpo, nao resumir.

Proxima rodagem do Sonnet ja vai aplicar essas regras.

### Cota Sonnet medida
Antes da primeira run: 8% Sonnet semanal. Depois de 1 run com 8 items pendentes: ~10-12% (estimativa, Andre nao confirmou delta exato). Tempo de execucao: primeira run timeout em ~20min, segunda passou em 10min apos adicionar regra "MODO BATCH EFICIENTE" no prompt da routine + reduzir MAX_NEW_PER_RUN de 6 pra 3.

### Routine Sonnet (estado atual)
```
id            : trig_01WTGwu5LzVJrQcxtMpRH3Te
enabled       : true
cron          : 30 */6 * * * UTC
modelo        : claude-sonnet-4-6
tools         : Bash, Read, Write, Edit, Glob, Grep
proximo run   : 2026-05-13 06:30 UTC (03:30 BRT)
painel        : https://claude.ai/code/routines/trig_01WTGwu5LzVJrQcxtMpRH3Te
```

### Cronograma diario automatico
```
UTC      BRT      Workflow
─────────────────────────────────────────────
00:23    21:23    GH Actions news.yml (mídia, sempre)
00:25    21:25    GH Actions community.yml (spotlight noturno)
00:30    21:30    Routine Sonnet (cura tudo)
06:23    03:23    GH Actions news.yml
06:30    03:30    Routine Sonnet
12:23    09:23    GH Actions news.yml
12:25    09:25    GH Actions community.yml (digest matinal)
12:30    09:30    Routine Sonnet
18:23    15:23    GH Actions news.yml
18:30    15:30    Routine Sonnet
```

### Bugs conhecidos / cuidados
1. **Allowlist da Anthropic Cloud**: routine NAO consegue HTTP externo. Coleta DEVE rodar no GH Actions, routine soh cura. Sempre SPLIT MODE.
2. **Race condition pull/push**: news.yml e community.yml podiam colidir. Resolvido com loop `git pull --rebase --autostash` + `git push` ate 3 tentativas.
3. **Timeout do Sonnet em batches grandes**: limite ~15-20min. MAX_NEW_PER_RUN = 3 evita. Plano B se passar: limpar `_pending.json` manualmente.
4. **"John Klinghoffer"** no input da Rolling Stone (correto eh Josh). Bot mantem o typo da fonte.
5. **Commit estranho "Update HANDOFF.md"** da conta `terra-gentil` (commit 96b6578) durante a sessao - origem desconhecida, nao foi a routine. Investigar se voltar.
6. **LF/CRLF warnings em todos os commits**: cosmetico, sem impacto. Windows + git.

### Frentes abertas pro proximo chat
1. **Validar primeira rodagem automatica da manha** (03:30 BRT): conferir se Sonnet aplicou novas regras (cobertura + riqueza). Olhar tags, listas completas, materias duplicadas que antes eram pulled.
2. **Calibrar prompts se necessario** apos ver o resultado.
3. **Anthropic SDK** (Haiku 4.5) ainda nao testado. Falta cadastrar `ANTHROPIC_API_KEY` no GH Secrets pra disparar via workflow_dispatch.
4. **Medir cota Sonnet por semana**: Andre pode acompanhar o "Somente Sonnet · X%" na status line do Claude Code. Se passar de 30% sem motivo, ajustar frequencia do cron.
5. **GitHub Student Pack** aprovado, libera em 72h (~14-15 mai 2026). Vale ativar Sentry pra alertas de falha + Namecheap pra dominio custom.
6. **MAX_NEW_PER_RUN**: atualmente 3. Se proximas runs derem timeout, reduzir pra 2. Se sobrarem cedo, voltar pra 4.
7. **Spotlight da comunidade como "art piece"** (frente proposta antes mas nao executada): layout especial pro spotlight, imagem dominante, texto reduzido.

### Comando exato pra continuar (proximo chat)
```
cd C:\Gitlab_hz\pearljam\setlists-pj-ev && claude
```
Pede: "leia o ultimo HANDOFF no PROGRESSO.md e foca em validar a rodagem do Sonnet da manha".

### Arquivos chave (atualizados nesta sessao)
```
Coleta + curadoria:
  scripts/news/fetch-news.mjs              # MAX_NEW_PER_RUN=3
  scripts/news/community-fetch.mjs         # suporta --curator=routine
  scripts/news/reddit-community.mjs        # parser com pickCoverImage
  scripts/news/merge-curated.mjs           # preserva metadados extras
  scripts/news/sources.mjs                 # 8 fontes RSS
  scripts/news/curators/_shared.mjs        # VALID_TAGS atualizado
  scripts/news/curators/gemini.mjs         # schema com tags por integrante
  scripts/news/curators/community-digest.mjs
  scripts/news/curators/community-spotlight.mjs
  scripts/news/curators/routine.mjs        # stub PENDING
  scripts/news/prompts/system-curator-fa.txt       # voz midia + cobertura + riqueza
  scripts/news/prompts/system-community-digest.txt # assinatura nova
  scripts/news/prompts/system-community-spotlight.txt # assinatura nova
  scripts/news/routine-prompt.md           # modo batch eficiente

CI/CD:
  .github/workflows/news.yml               # default=routine, pull-rebase retry
  .github/workflows/community.yml          # default=routine, pull-rebase retry

Infra:
  cloudflare-worker/reddit-proxy.js        # Worker no eng-andrehz.workers.dev

Frontend:
  index.html                               # tudo num arquivo (~14600 linhas)
    - linhas 4362-4970+: CSS Noticias (tema fanzine xerox)
    - linhas 13900-14160: JS Noticias

Dados:
  media/news/index.json                    # 7 items publicados pelo Sonnet
  media/news/seen.json                     # dedup state
  media/news/_pending.json                 # AGORA VAZIO (Sonnet processou tudo)
  media/news/archive/                      # overflow >30 items
  media/news/img/*.jpg                     # cache imagens
  media/news/_backup-2026-05-12-gemini-baseline/  # baseline Gemini pra comparar
```

### Secrets/configuracoes externas
- **GH Secrets**: `GEMINI_API_KEY`, `REDDIT_PROXY_URL`, `ANTHROPIC_API_KEY` (vazia)
- **GH Variables**: `GEMINI_MODEL` (default gemini-2.5-flash)
- **Cloudflare Worker**: `reddit-proxy.eng-andrehz.workers.dev` (free tier, 100k req/dia)
- **Routine Anthropic**: `trig_01WTGwu5LzVJrQcxtMpRH3Te` (env `env_01YJZwpkiM9iGttJApwDgQWL`)

### Regras absolutas dos prompts (NAO MEXER sem motivo forte)
1. **Anti-travessao**: PROIBIDO em qualquer output. Sanitizer no `_shared.mjs` (stripDashes) tambem garante.
2. **Anti-mencao Reddit/r/pearljam/subreddit/upvote/u/autor** (so community items).
3. **Anti-numeros de votos/curtidas/comentarios** no corpo (so community items).
4. **Tags por integrante**: so quando o foco eh AQUELE integrante. Banda completa = turne ou lancamento.
5. **NOVA: Cobertura**: nao SKIP por duplicacao semantica entre fontes.
6. **NOVA: Riqueza informacional**: listar TUDO em listas concretas.

---

## HANDOFF SESSAO 2026-05-12 NOITE: refino do bot de Noticias, nav reorganizado, playlists no Galeria

### Estado atual
HEAD `cae7677` (vai virar +1 com este commit). Site no ar em https://setlists-pj-ev.pages.dev/
Routine Sonnet criada mas **desabilitada** (id `trig_01WTGwu5LzVJrQcxtMpRH3Te`), aguardando validacao do Gemini antes de ligar.

### O que esta funcionando hoje
- **Noticias 100% operacional** com Gemini 2.5 Flash via GH Actions cron `0 */6 * * *` UTC. Free tier do Gemini cobre folgado (500 RPD vs 10/dia que usamos).
- **8 fontes ativas**: Stereogum, NME, Consequence, Pitchfork, Rolling Stone, Folha, PJ Online IT (RSS valido em italiano), Reddit r/pearljam (filtro score>=100 + flair restrito).
- **Frontend**: Notícias é a home (primeira aba). Click em card abre pagina propria (`#news/<id>`), sem redirect externo. Setas anterior/proxima funcionam.
- **Garantia tripla anti-travessao**: sanitizer no `_shared.mjs` (stripDashes) + prompt reforcado + limpeza retroativa do index. Mesmo se LLM teimar, nada passa.
- **Truncate de intro**: `truncateAtWord(s, 140)` corta no boundary de palavra com "..." limpo se LLM gerar prosa longa. Card CSS clamp 2 linhas + text-overflow ellipsis.
- **Tradução completa** (nao mais resumo): prompt manda 400-1200 palavras, max_tokens 4000. extract.mjs cap subiu pra 8kB.

### Curators selecionaveis (em ordem de uso recomendado)
1. **gemini** (default cron, default workflow_dispatch): Gemini 2.5 Flash via @google/generative-ai. Free tier. Andre tem `GEMINI_API_KEY` em GH Secrets. Pra trocar modelo: GH → Settings → Variables → `GEMINI_MODEL` = `gemini-2.5-pro` (ou outro).
2. **anthropic**: Claude Haiku 4.5 via @anthropic-ai/sdk. Precisa `ANTHROPIC_API_KEY` (Andre nao configurou ainda).
3. **routine**: usa quota do plano Max 5x (Sonnet com 8% usado/semana). Zero custo externo. Routine ja criada (`trig_01WTGwu5LzVJrQcxtMpRH3Te`), so falta enable=true. Workflow: bot coleta com --curator=routine (escreve `_pending.json`), routine le, curatela natively, roda `merge-curated.mjs --file` pra publicar.

### Tabs/Nav
- Ordem atual: **Notícias, Timeline, Cifras & Tabs, Galeria, Buscar, Ranking, Álbuns, Destaques, Raridades, Deep**.
- Clipes section foi removida. Videos agora aparecem dentro do Galeria via `_renderGalleryVideosSection`, com interleaving: 2 playlists antes de cada show (`renderGalleryShows` virou async). Hoje so 2 playlists no manifest (`PL9C9DD94124C436BB` Vevo + `PLFJn5QfTxjnhxs_9qYgxW_8lXOjstj5Sr` Oficial). Andre vai mandando mais playlists em rodadas.

### Investigacao de fontes (concluida)
- `community.pearljam.com`: Cloudflare bot challenge (403). Inviavel sem Puppeteer.
- `pearljam.com/news`: SPA client-side. RSS quebrado, conteudo via XHR. Requer headless browser.
- `fivehorizons.com`: arquivo antigo, sem feed, pouco update.
- `pearljamonline.it`: ADICIONADO (RSS valido em italiano; curador adapta pra PT-BR).
- Canal YT @PearlJam/playlists: scrape achou 30 IDs (`PLFJn5QfTxjn...`) mas titulos vem em estrutura JSON aninhada que regex simples nao resolve. Backlog: parser dedicado se valer a pena.

### Proximo passo concreto (proximo chat de News)
Andre quer **ir aprimorando o bot** show por show. Possiveis frentes:

1. **Validar a routine Sonnet** (ativar `trig_01WTGwu5LzVJrQcxtMpRH3Te` enable=true via /schedule, deixar correr 1-2 ciclos, comparar voz do Sonnet vs Gemini). Se Sonnet for melhor, **desligar cron do GH** (.github/workflows/news.yml) e migrar 100% pra routine.
2. **Calibrar o prompt do curador** (`scripts/news/prompts/system-curator-fa.txt`). Toda noticia que ficar artificial ou fora do tom, Andre flagra → ajustamos uma regra especifica.
3. **Filtros de tag no frontend** (chips tipo `[turne, lancamento, ed-solo, tenclub, memoria, br, bootleg]` na view Noticias pra usuario filtrar).
4. **Arquivo de noticias antigas** (view "Ver mais antigas" lendo `media/news/archive/YYYY-MM.json`).
5. **Mais fontes**: pearljam.com via headless browser (Puppeteer no GH Actions), brooklynvegan via outro endpoint, blogs PJ BR (Whiplash/Tenebrarum se voltarem).
6. **Source-specific tweaks**: o curador trata Stereogum diferente de Folha? PJ Online IT tem nota italiana que precisa adaptar diferente.

### Arquivos chave de News (read first ao retomar)
```
scripts/news/fetch-news.mjs                # orquestrador, com --curator + --dry-run
scripts/news/sources.mjs                   # 8 feeds atuais
scripts/news/relevance.mjs                 # regex PJ + canonicalize + sha10 + reddit filter
scripts/news/extract.mjs                   # cheerio scrape (OG + texto, cap 8kB)
scripts/news/image-cache.mjs               # sharp 1280x720 + GC orfas
scripts/news/curators/_shared.mjs          # dispatcher + JSON validator + stripDashes + truncateAtWord
scripts/news/curators/gemini.mjs           # default, JSON mode estruturado
scripts/news/curators/anthropic.mjs        # Haiku 4.5 com cache_control
scripts/news/curators/routine.mjs          # stub que retorna PENDING
scripts/news/merge-curated.mjs             # pra modo routine: aplica curated.json -> index.json
scripts/news/prompts/system-curator-fa.txt # voz de fa, regras de estilo, REGRA ABSOLUTA #1 anti-travessao
scripts/news/README.md                     # doc dos 3 backends + onde achar cada API key
.github/workflows/news.yml                 # cron 6h + manual dispatch com input curator
media/news/index.json                      # 5 itens atuais (PT-BR)
media/news/seen.json                       # dedup state
media/news/archive/YYYY-MM.json            # arquivamento mensal (vazio ainda)
media/news/img/*.jpg                       # 4-6 imagens cacheadas
```

### Comando exato pra continuar (proximo chat)
```
cd C:\Gitlab_hz\pearljam\setlists-pj-ev && claude
```
Daí pede: "leia o ultimo HANDOFF no PROGRESSO.md e foca em refinar o bot de Noticias".

---

## HANDOFF SESSAO 2026-05-12 TARDE: secao 📰 Noticias automatizada (full-auto fa-pra-fa)

### Estado atual
View nova 📰 Noticias instalada no nav (apos Cifras & Tabs), com pipeline completo de coleta+curadoria+publicacao automatica via GH Actions a cada 6h.

### Arquitetura (toda decidida em plano [lucky-conjuring-rain.md])
- **Coleta**: 7 fontes RSS (Stereogum, NME, Consequence, Pitchfork, Rolling Stone, Folha, Reddit r/pearljam com filtro score>=100 + flair restrito). Cortadas as 6 fontes quebradas (pj.com/feed XML invalido, BrooklynVegan 403, Whiplash 404, Tenebrarum/TMDP DNS, YT PJ Vevo channel_id errado).
- **Dedupe**: `media/news/seen.json` por hash sha10 da URL canonica (remove utm_*, ref, fragmentos).
- **Scrape**: cheerio + got. Extrai OG image (cascata og→twitter→article img→fallback placeholder) e texto do artigo (cap 4kB).
- **Imagens**: cache local em `media/news/img/<hash>.jpg` (resize 1280x720 cover JPEG q82 via sharp). CSP atual ja cobre (img-src self).
- **Curador IA**: Claude Haiku 4.5 (`claude-haiku-4-5`) via @anthropic-ai/sdk, system prompt com cache_control ephemeral (~1.2k tokens reusados). Prompt em PT-BR no tom de fa veterano, sem travessao, sem hype. Output JSON {titulo_pt, intro_pt, corpo_pt, tags} ou string `SKIP` se irrelevante.
- **Frontend**: `renderNewsView()` em index.html (apos `_renderChordPro`, antes de DEEP MAGAZINES). Carrega `media/news/index.json` (cache no-cache), renderiza grid responsivo de cards (thumbnail 16:9 + meta + titulo serif + intro 3 linhas truncadas). Click expande corpo inline. Chips de filtro por fonte. CSS bloc novo entre `.tabs-intro` e `.tabs-layout` (tokens existentes do site).
- **Workflow**: `.github/workflows/news.yml` cron `23 */6 * * *` UTC + manual dispatch com flags `dry-run` e `no-claude`. Commit auto so se diff real (`git diff --cached --quiet`).

### Arquivos criados
```
package.json                                     # deps: rss-parser, cheerio, got, sharp, @anthropic-ai/sdk
.github/workflows/news.yml                       # cron 6h + manual dispatch
scripts/news/sources.mjs                         # 7 fontes validadas + REDDIT_FILTER
scripts/news/relevance.mjs                       # regex PJ + canonicalize + sha10 + passesRedditFilter
scripts/news/extract.mjs                         # got+cheerio scraping OG+article text
scripts/news/image-cache.mjs                     # sharp resize + GC orfas
scripts/news/claude-curator.mjs                  # Claude Haiku com cache_control
scripts/news/fetch-news.mjs                      # orquestrador (com --dry-run, --no-claude, --fixtures)
scripts/news/prompts/system-curator-fa.txt       # system prompt versionado
scripts/news/prompts/user-template.txt           # template do user turn
media/news/_placeholder.svg                      # fallback quando OG falha
media/news/index.json                            # ja populado em smoke test (6 items)
media/news/seen.json                             # dedup state
media/news/img/*.jpg                             # 6 capas cacheadas no smoke
```

### Arquivos modificados
- `index.html`: nav button `tab-news` (L6614), section `view-news` (L6685), switch case (L8899), `renderNewsView` + helpers + CSS bloc.
- `.gitignore`: removido `package.json`/`package-lock.json` da lista de ignorados (eram artefatos lighthouse antes; agora repo tem deps proprias do bot).

### Smoke test pre-commit
`node scripts/news/fetch-news.mjs --no-claude` rodou local com sucesso: 7 fontes consultadas (5 saudaveis), 36 candidatos pos-filtro, top 6 processados, 6 imagens cacheadas. `media/news/index.json` populado. Pipeline E2E validado sem queimar API key.

### O que falta pra ligar de verdade (passos manuais Andre)
1. **Configurar secret no GH**: Settings → Secrets and variables → Actions → New repository secret → nome `ANTHROPIC_API_KEY`, valor a chave da Anthropic.
2. **Primeira execucao manual**: Actions → "News fetch" → Run workflow → marcar `dry-run: true` na primeira vez pra ver os logs sem alterar o repo. Validar saida JSON em log.
3. **Flipar pra cron**: depois da validacao, deixar o cron 6h tomar conta. Voltar ao GH Actions tab pra ver logs de runs futuras.

### Custos esperados
- Claude API: ~$1-2/mes (Haiku, ~10 noticias curadas/dia, prompt caching reduz ~30%).
- GH Actions: ~180 min/mes (free tier 2000).

### Pendencias residuais (decidir depois)
- TenClub announcements: nao tem RSS publico. Andre tem login? Skip por ora.
- Fontes BR quebradas (Whiplash, Tenebrarum, TMDP): achar URLs corretas e re-adicionar.
- YT PJ Vevo: achar channel_id correto (tentei `UCkV_6Z6OTaGiKa9-ZuKVQjA`, deu 404).
- View "Arquivo": ler `archive/YYYY-MM.json` antigos. MVP fica so com top 30, v2 adiciona.

---

## HANDOFF SESSAO 2026-05-12 MADRUGADA: cifras multi-instrumento + versoes de tab

### Estado atual
HEAD `a5b2143`. Branch main sincronizada com origin. Cloudflare Pages re-deployando.

### Entregas desta sessao (em ordem de commit)
- `7de38ad` setlist: rollback de 3 comportamentos quebrados (max-height surface, auto-scroll, scroll inteligente). View Cifras intocada.
- `dfb5d07` Black agora tem 2 versoes de tab (`black-v1.gp5` + `black-live.gp5`) com seletor `.alphatab-version-select` no transport-top. Manifest tem `versions: [{id,label,file,format}]`.
- `47910c1` Labels da bateria em PT (ATAQUE, CHIMBAL, CONDUCAO, SURDAO, CAIXA, BUMBO).
- `c243902` Fix bateria invisivel no tab: trocou `staveProfile: 'tab'` por `'default'` (percussion precisa de score, nao tab).
- `54e1352` Plano de curadoria de tabs Pro no PROGRESSO.md.
- `a5b2143` Cifras multi-instrumento: schema JSON novo `media/tabs/cifras-multi/<song>.json` com Violao+Ukulele+Piano (fingerings, fundamental, inversion, padrao de palhetada). Black completo. Seletor no transport-top + header de palhetada visual.

### Regras gravadas em memoria
- `feedback_fretboard_posicionamento.md`: bracos floating no setlist, docked inline na view Cifras
- `feedback_players_isolados.md`: setlist e view Cifras sao DOIS produtos; nunca mexer num sem confirmar contexto
- `reference_ultimate_guitar_pro.md`: Andre tem conta Pro; UG nao tem API publica (403); PDFs sao caminho viavel; nomes sem creditos pessoais

### Proximo passo concreto
Andre vai baixar 3 PDFs (violao + ukulele + piano) de cada uma das proximas 16 musicas top 20 sem .gp local, na ordem sugerida: better man, jeremy, given to fly, daughter, elderly woman, corduroy, animal, state of love and trust, rearviewmirror, do the evolution, sirens, hail hail, just breathe, last kiss, crazy mary, footsteps.

Por musica, em sessao Claude Code:
1. Andre passa os 3 paths em Downloads (ex: `Pearl Jam - Better Man (violao).pdf`)
2. Claude usa `/c/Users/engan/poppler/poppler-24.08.0/Library/bin/pdftoppm` (instalado nesta sessao) pra converter pra PNG
3. Le com Read tool pra extrair conteudo
4. Cria `media/tabs/cifras-multi/<song>.json` no schema (referencia: `black.json`)
5. Atualiza manifest com `cifraMulti: '<song>.json'`
6. Andre passa tambem .gp pra v1 e ao vivo da mesma musica; eu adiciono em `versions: [...]`

### Bloqueios em aberto
Nenhum.

### Refator A (split completo setlist/view)
Andre aprovou refator completo pra isolar setlist e view Cifras em familias de funcoes dedicadas. Eu ROLLBACKEI no commit `7de38ad` em vez de fazer o split, porque ele queria primeiro restaurar o estado bom. O refator A continua aprovado mas adiado: ver memoria `feedback_players_isolados.md` que regula comunicacao enquanto base for compartilhada. Retomar quando convem.

---

## HANDOFF SESSAO 2026-05-12 NOITE: estrategia de curadoria de tabs Pro (Ultimate Guitar)

Andre assinou Ultimate Guitar Pro e quer popular o site com:
- 2 melhores versoes em `.gp` por musica (Versao 1 = top-rated, + Ao vivo quando houver)
- "Cifras de cada instrumento": resolvido visualmente pelo voice-picker + mixer + fretboard, ja existente. O `.gp` carrega TODAS as tracks da musica; usuario isola Stone/Mike/Jeff/Matt/Boom pelo mixer.

### Estado: 2 tabs do Black ja no ar
- `media/tabs/gp/black-v1.gp5` (Versao 1, ex-"ver 4 by Master Rayz", 51KB)
- `media/tabs/gp/black-live.gp5` (Ao vivo, 59KB)
- Manifest `media/tabs/index.json` `"black"` ganha `versions: [{id, label, file, format}]`
- Seletor `<select class="alphatab-version-select">` no `.alphatab-transport-top` da pane tab; aparece quando `versions.length >= 2`. Onchange faz `api.load(arrayBuffer)` sem re-init.
- Nomes sem creditos pessoais por regra (`Versao 1`, `Versao 2`, `Ao vivo`). Salvo em [reference-ultimate-guitar-pro](feedback memory).
- Commit: `dfb5d07` (versoes Black) + `c243902` (fix bateria staveProfile)

### Decisao: nao tem como pegar via API com token
- UG nao publica API publica oficial.
- API mobile interna existe mas e nao-documentada, fragil e viola ToS.
- Scraping de tabs Pro requer decodificar formato gpif protobuf-binario com DRM, viola ToS.
- Songsterr tem API semi-publica mas catalogo diferente.
- **Conclusao**: download manual via botao Pro continua sendo o caminho. Andre opera o navegador, salva em pasta de staging, e em sessao seguinte um script (Node) integra: copia pra `media/tabs/gp/<song>-vN.gp5`, atualiza manifest.

### Plano de curadoria (proxima sessao)

**Restantes top 20 sem `.gp` (16 musicas):**
better man, jeremy, daughter, elderly woman behind..., just breathe, given to fly, corduroy, state of love and trust, animal, rearviewmirror, do the evolution, last kiss, crazy mary, sirens, hail hail, footsteps.

**Workflow proposto:**
1. Andre abre tab Pro top-rated da musica no UG (logado).
2. Clica "Download GP" -> salva em `Downloads/` com nome livre.
3. Eventualmente baixa tambem "Ao vivo" (se houver versao bem rankeada).
4. Em sessao Claude Code: passar paths dos 2 arquivos por musica; eu copio pra `media/tabs/gp/<song>-v1.gp5` (e `<song>-live.gp5` se aplicavel), atualizo manifest com `versions`, faco commit.

**Sequencia sugerida (do top 20 mais tocado pra menos):**
1. better man (`5d2.gp5`/popular ao vivo)
2. jeremy
3. given to fly
4. daughter
5. elderly woman
6. corduroy
7. animal
8. state of love and trust
9. rearviewmirror
10. do the evolution
11. sirens, hail hail, just breathe, last kiss, crazy mary, footsteps (menos urgentes)

**Automacao Fase 2 (opcional):** userscript Tampermonkey que adicione botao "Baixar pra setlists-pj-ev" no UG, com convencao de nome ja resolvida. Implementa em sessao dedicada se Andre topar.

### Cifras textuais por instrumento (ChordPro)
- Site ja tem 3 cifras: `media/tabs/cifras/black.cpro`, `alive.cpro`, `even-flow.cpro`.
- Pra outras 17 do top 20: transcricao manual ChordPro a partir da letra + ouvido. UG Pro NAO exporta ChordPro - so `.gp`. Continua sendo cura mao, sem atalho.

## BACKLOG

### Secao "Clipes" (videos oficiais Pearl Jam) [aberto 2026-05-12]
Andre pediu uma view nova com os videoclipes oficiais do PJ, baseada na playlist oficial do canal Pearl Jam Vevo no YouTube.

- **Fonte**: `https://www.youtube.com/playlist?list=PL9C9DD94124C436BB` (primeiro video: `fYSazphh_C8`)
- **Padrao visual obrigatorio**: tem que casar com o resto do site (Ticket Archive). Paleta cream/pj-red/teal/ev-amber, fonts existentes (Big Shoulders, Instrument Serif, Newsreader, JetBrains Mono, Oswald), tokens `--bg/--bg-card/--paper/--ink/--pj` etc. Identidade visual: cards estilo ticket/poster, nao iframes soltos.
- **Esboco de implementacao**:
  - Nova nav tab `🎬 Clipes` (apos `🎸 Cifras & Tabs`).
  - Manifest `media/clipes/index.json` com `[{ id: 'fYSazphh_C8', title, song, album, year, director, dur, notes }]` curado a mao (ordem cronologica ou por album).
  - Grid de cards: thumbnail YouTube (`https://i.ytimg.com/vi/{id}/hqdefault.jpg` 480x360, cache local em `media/clipes/thumbs/` opcional), cover do album em pill no canto, titulo da musica, ano, diretor pequenininho.
  - Click no card abre modal/lightbox com iframe YouTube `<iframe src="https://www.youtube.com/embed/{id}?autoplay=1&modestbranding=1&rel=0">` (lazy, so cria iframe no click pra nao puxar JS do YT no load da view).
  - Header da view: titulo "Clipes Oficiais", subtitulo italic, contagem total.
  - Filtros: por album (chips horizontais), por decada, busca por titulo.
  - Privacy-conscious: usar dominio `youtube-nocookie.com` no embed (sem tracking pre-consent).
  - CSP: vai precisar abrir `frame-src https://www.youtube-nocookie.com` (ou youtube.com) no `_headers`. `img-src` ja permite `https:` ou pode adicionar `i.ytimg.com` se for explicit.
- **Trabalho de curadoria**: catalogar os ~30-40 clipes oficiais (Alive, Even Flow, Jeremy, Daughter, Animal, Dissident, Spin the Black Circle, I Got Id, Hail Hail, Given to Fly, Wishlist, Do the Evolution, Last Kiss, Save You, I Am Mine, Love Boat Captain, World Wide Suicide, Life Wasted, Just Breathe, The Fixer, Sirens, Mind Your Manners, Dance of the Clairvoyants, Retrograde, Wreckage, Dark Matter, Running, etc) com diretor, ano, contexto.
- **Quando atacar**: depois que a curadoria das 20 cifras (Top PJ ao vivo) avancar. Backlog, sem prazo.

## SESSAO MADRUGADA -> MANHA 2026-05-12: refinamento profundo cifras & tabs (mais 18 commits, total 24 na sessao)

Depois do bootstrap inicial (5 commits abaixo), Andre testou e flagou serie de bugs/melhorias. Bateu de novo numa serie de iteracoes. Tudo deployado e funcionando.

### Conteudo .gp atualizado
- `4891849` Black gp3 -> gp5 v5.10 (51KB), Alive ganha gp4 v4.06 (52KB), Yellow Ledbetter ganha gp5 v5.10 (46KB). 3 tabs do Ultimate Guitar.

### Bugs corrigidos
- `bf64f23` Busca do catalogo nao filtrava (display:flex sobrescrevia [hidden]). Fix com .hide class !important + diacritic strip + multi-word AND + contador + Enter abre primeiro + Esc limpa.
- `df21fab` Sync bidirecional voice-picker <-> fretboard-players <-> alphatab-tracks. Bug: dispatchEvent('change') manual nao acionava listener delegado; troca pra .click() nativo. Reverso tambem (toggles de baixo atualizam cards de cima).
- `2c8bc9e` Audio fantasma ao trocar musica/view. _stopAllTabAudio() centraliza cleanup, hookado em closeFloatingUI e activateTab. api.destroy() libera audio context.
- `35c843f` Manifest cache no-cache (cloudflare cacheava 1h) + status do transport mostra formato carregado (GP5/GP4/GP3).
- `0aee1e9` Click dentro do painel aberto (Letra/Traducao/Analise) fecha, igual lyric-row no show drawer.

### Features novas (pos-bootstrap)
- `10b74b4` Cifra player com Pause/Stop + FAB flutuante + scroll center (igual AlphaTab).
- `9932bb1` Chips Letra/Traducao/Analise no header com pane expansivel (reusa _fillLyricBody + novo _fillAnaliseBody).
- `763bdc2` Capas reais dos albuns no header (cifra-detail) e nos itens do catalogo (cat-item-cover 36x36). Usa loadAlbumCovers existente + fallback automatico .album-cover-fallback.
- `29c8c44` Botoes Cifra/Tab protagonistas (Big Shoulders 14px, dot pulsante, sombra colorida no ativo).
- `5753da0` Fretboard redesenhado com headstock angular + body com pickup + adesivos PJ stickman/sun integrados no SVG.
- `f516aa8` Slider de volume por instrumento (0-150%) em cada voice card. api.changeTrackVolume nativo.

### Pacotes do design Claude Design (todos completos)
- **A** `e3a122d` Efeitos visuais no fretboard durante reproducao: ringing line da nota ate o body, string vibration (animate opacity), pulse no circulo da nota.
- **B** `51d5fb9` 22 trastes com espacamento logaritmico real (equal-temperament): fret 1 com 45px, fret 22 com 13px. Mesma proporcao do violao de verdade. Inlays 3/5/7/9/12/15/17/19/21. ViewBox 540 -> 720.
- **C** `1c74f4d` Label do nome da nota (E, A#, G...) acima do circulo, calculado de string + fret. Suporte guitarra e baixo.
- **D** `155d608` Animacoes speed-aware: vib/pulse durations escalam inversamente com api.playbackSpeed. 0.25x = animacao 4x mais lenta.
- **E** `e38ede3` Botao Solo (S) no canto top-right de cada card. Click muta outras tracks, click de novo restaura.

### Refinamentos
- `f161284` Fretboard tambem em mobile (<=600px) como bottom-sheet full-width acima do FAB. Antes era display:none em <=480px. 22 trastes preservados; lower frets usaveis, higher comprimidos (proximo passo: pinch-zoom ou modo 12-frets mobile).

## Estado atual
- Branch main sincronizado com origin/main. HEAD = `f161284`.
- 24 commits feitos desde `f285ca8` (baseline da sessao).
- AlphaTab + smplr + soundfonts 100% local. CSP intacto.
- Manifest com cache no-cache pra propagacao instantanea de mudancas em deploy.

## Proximo passo sugerido
Andre testa visualmente. Possiveis frentes pendentes:
1. Persistencia volumes por track via localStorage (mantem entre sessoes)
2. Auto-scroll voice picker se muitas tracks (gp5 com 10+)
3. Tab loop visual no fretboard (highlight notas do range do loop)
4. Detectar acorde sendo tocado (notas simultaneas) e mostrar diagrama no canto
5. Pinch-zoom no fretboard mobile ou modo 12-frets compacto
6. Cifras dos top 17 restantes do manifest (yellow ledbetter, jeremy, given to fly, etc.)
7. Mais .gp do Ultimate Guitar pras musicas top
8. Auditoria visual completa por musica (Andre confere cada cifra/tab no navegador)

## Blockers
Nenhum.

## SESSAO MADRUGADA 2026-05-12: design Claude Design implementado (5 commits)

Plano executado em 5 commits sequenciais autonomos, com Andre fora pra testar tudo no fim. Bundle de design em `scripts/_design-pearljamcifras/` traduzido pro index.html preservando 100% da logica de player atual (AlphaTab + FAB + fretboard overlay + smplr + ChordPro).

### Commits

- `975d16c` **feat(cifras): layout 2-col com catalog-aside + cifra-detail**
  Substitui `.tabs-grid` (cards expansiveis) por `.tabs-layout > .catalog-aside (280px sticky) + .cifra-detail-wrap (1fr)`. Catalog tem search em tempo real (por titulo ou album) + lista por status (tab+cifra/cifra/em breve). Click no item troca o detail panel via nova funcao `_renderCifraDetail`, que delega pro `_renderTabPanel` (mesmo handler do botao TAB inline na faixa do show, zero divergencia).

- `8b51738` **feat(cifras): header do detail com cover-ten + titulo + pills**
  Cabecalho com cover do album (arte CSS pra Ten com 5 silhuetas + glow ambar; foto da capa pros demais via `albumCoverPath`; fallback generico com sigla pra musicas sem album), titulo em Big Shoulders Display uppercase, breadcrumb (artista · album · ano), pills key/tuning/capo/bpm reusando `.tab-pill` ja existente. InfoBar interna do `_renderTabPanel` escondida via CSS dentro do detail pra nao duplicar pills.

- `1b1954c` **feat(cifras): voice picker Stone/Mike/Jeff multi-select**
  Voice-picker de 3 cards entre header e body do detail, populado dinamicamente quando AlphaTab dispara `scoreLoaded`. Cada card mostra label da track + role inferido (Guitarra ritmica/solo/Baixo/etc) + tagline italica. Multi-select preservando comportamento atual: click no card propaga via `dispatchEvent('change')` pros checkboxes ja existentes em `.fretboard-players` (filtro visual) e `.alphatab-tracks` (mute audio + renderTracks).

- `2c96267` **feat(cifras): adesivos PJ no fretboard visualizer**
  Move `pj-stickman.png` (105KB) e `pj-sun-logo.png` (47KB) do bundle pra `media/decals/`. Adiciona dois `<img>` overlay no fretboard-overlay (fora do markup SVG pra nao serem apagados quando `drawBoard()` re-renderiza). Stickman top-left rotacionado -6deg, sun top-right rotacionado +12deg. `mix-blend-mode: screen` + opacidade 0.42 integram na textura de madeira sem disputar atencao com notas tocadas.

- `e5b3067` **style(cifras): dark theme overrides nos componentes**
  Site ja tinha dark mode completo (toggle ☀/☾ em `#theme-toggle`, localStorage, overrides extensivos), mas componentes cifras/tabs eram light-only com cores hardcoded. Adiciona overrides pra: `.alphatab-surface` (fundo escuro + filter invert nos glyphs), `.chord-diagram`, `.cifra-player-bar`, `.alphatab-transport`, `.tab-pane-soon`, `.fretboard-overlay`, `.fretboard-decal` (mais opacidade no dark).

### Decisoes Andre (antes de implementar)
1. Voice picker: **multi** (checkbox-like), nao single radio.
2. Dark theme: **implementar nesta tanda** (achei depois que ja existia, entao foi so' garantir que os novos componentes respeitam tokens + adicionar overrides nos antigos hardcoded).
3. Tweaks panel: **defaults fixos** (sem painel real). Adesivos sempre sutis, papel sempre kraft.

### O que MUDOU vs. design original
- Paleta: design propos dark amber/burgundy (Cifras Pearl Jam.html primeira passada que Andre rejeitou). Implementacao usa a paleta do site (Ticket Archive: cream/pj-red/teal/ev-amber) que era o que a segunda passada do design ja propos.
- Tweaks panel: nao implementado (defaults fixos como Andre pediu).
- Stickers PJ: 2 (stickman + sun). Sem variacao "Letras" do design (so usa as 2 PNGs fornecidas).
- Cover de Ten: arte CSS (silhuetas + glow) como o design propos. Demais albuns usam foto real `albumCoverPath`. Fallback sigla pra desconhecidos.
- Header dentro do detail (nao banner topo do site como design tinha na primeira passada). Mais coerente com a estrutura existente.

### Comportamentos PRESERVADOS (intactos)
- Botao TAB inline na faixa do show (`_renderTabPanel` direto, sem cifra-detail wrapper).
- AlphaTab player: Play/Stop/Speed/Loop/FAB/cursor/autoscroll custom/loop overlay.
- Fretboard overlay flutuante com filtro por track Stone/Mike/Jeff (checkboxes).
- Cifra player de chord-chips (`_startCifraPlayer`), parser ChordPro, diagrama de acorde SVG, som arpejado via smplr local.
- CSP atual (`worker-src 'self' blob:`).
- AlphaTab + smplr + soundfonts 100% local em `media/lib/`.
- Cifras cadastradas (`black.cpro / alive.cpro / even-flow.cpro / black.gp3`) + manifest com 20 musicas.

### Validacao pendente (Andre faz no navegador)
Golden path:
1. Nav superior → `🎸 Cifras & Tabs` → ve catalogo lateral com 20 musicas + Black auto-selecionada com header + body
2. Click no item Alive ou Even Flow → header muda, cifra carrega
3. Click numa musica disabled (qualquer outra) → empty state "em breve"
4. Busca: digitar "Ten" filtra; digitar "Black" filtra; clear restaura
5. Em Black: Tab → ▶ Play → fretboard overlay aparece com adesivos PJ visiveis
6. Voice picker no header: click em card desliga, fretboard esconde aquela track
7. Toggle dark mode (botao no masthead): tudo respeita
8. Painel inline (numa faixa Black em qualquer show) → ainda funciona igual antes (sem header novo, sem voice-picker)

### Riscos identificados (a confirmar)
- A) Em dark mode, o filter `invert(0.92) hue-rotate(180deg)` no SVG do AlphaTab pode deixar as cores PJ (cursor vermelho) estranhas. Se ficar feio, remover esse filter e aceitar tab cinza-claro sobre escuro.
- B) Decals em mix-blend-mode podem nao aparecer em browsers antigos. Browsers modernos OK.
- C) Voice picker so popula quando scoreLoaded dispara. Em musicas sem tab (so cifra), o picker fica `hidden` permanentemente. Esperado.

### Como reverter caso queira voltar atras
```
git reset --hard f285ca8   # antes desta sessao
```

---

## HANDOFF SESSAO NOITE 2026-05-11 (cifras + tablaturas + design pendente)

Sessao monstra: 23+ commits sequenciais entregando o ecossistema **Cifras & Tabs** completo + design refinado entregue pelo Claude Design que precisa ser implementado em outra sessao. Resumo dos commits da sessao (em ordem inversa):

- `be59cd1` feat(fretboard): filtro por guitarrista + botao fechar + stop esconde
- `81c0627` feat(tab-player): 0.25x + loop com overlay + fretboard maior com bass
- `5d0ffd6` feat(tab-player): controle de velocidade + loop de trecho
- `044032a` feat(tab-player): fretboard visualizer floating no canto direito
- `178cebd` fix: FAB sempre visivel + duplo clique fechar tab inline
- `efbd1e1` feat(tab-player): botoes flutuantes Pause/Stop sempre visiveis
- `06282ea` fix(tab-player): autoscroll custom mantem cursor sempre no centro
- `71ac5b6` fix(tab-player): autoscroll rola pagina inteira em vez do container
- `3ef5470` fix(tab-player): scrollMode offScreen evita jitter e perda de ritmo
- `e34b20d` fix(tab-player): autoroll + cursor visual no AlphaTab
- `9eef19e` fix(csp): permite Web Worker via blob: pra AlphaTab funcionar
- `9bfc3f1` fix(tabs-view): exige duplo clique pra fechar card aberto
- `57f99cc` feat: samples violao local + rename "Tradutor" pra "Opiniao"
- `091924f` fix(tab): hospeda AlphaTab 1.8.2 + smplr local (resolve CSP block)
- `e1af3e1` feat(tab): seletor de tracks por checkbox no Player de Tab
- `366edc3` feat(tab): substitui placeholder por black.gp3 real do gtptabs.com
- `511467c` feat(tab): Fase 3 AlphaTab CDN lazy-load + tab inicial de Black
- `24a778c` feat(tab): Fase 2 cifras com chord-chips + diagrama SVG
- `e6ec1b9` feat(tab): Fase 1 infraestrutura de cifras e tablaturas
- `1631c5b` feat(tab): secao dedicada Cifras & Tabs no nav (ao lado de Deep)
- `dd9db62` feat(analise): aba Tradutor com lyrics-notes.json no painel ANÁLISE
- `d1d94c5` feat(ui): renomeia secao INTERPRETAÇÃO para ANÁLISE
- `e9b58a5` feat(traducao): passada 2B contextual em interpretations.json

### O que existe HOJE em produção (testado por Andre, funcionando)

**Cifras & Tabs (view dedicada + bot~ao na faixa do show):**
- Tab no nav superior **🎸 Cifras & Tabs** ao lado de Deep.
- Grid de cards expansiveis com 20 musicas Top PJ ao vivo (manifest em `media/tabs/index.json`).
- Top 20: black, alive, even flow, yellow ledbetter, better man, jeremy, daughter, elderly woman..., just breathe, given to fly, corduroy, state of love and trust, animal, rearviewmirror, do the evolution, last kiss, crazy mary, sirens, hail hail, footsteps.
- Cada card: cover do album, titulo, key/tuning/capo, badges Cifra/Tab. Duplo clique pra fechar (Andre pediu).
- Botao **TAB** tambem inline na linha da faixa de cada show.

**Cifra (chord-chips + diagrama):**
- Parser ChordPro inline (`_renderChordPro`, `_parseChordProLine`).
- Chord-chips coloridos em paleta azul-petroleo (#2e6b8a).
- Click no chip mostra diagrama SVG do acorde (popover) + toca o acorde arpejado (via smplr local).
- Botao Play no topo da cifra: percorre os chord-chips no BPM da musica (2 beats/acorde), iluminando o ativo em vermelho PJ com pulse animation.
- 3 cifras cadastradas: `media/tabs/cifras/black.cpro`, `alive.cpro`, `even-flow.cpro`. BPM no manifest: 87/78/110.

**Tab (AlphaTab + .gp3):**
- AlphaTab 1.8.2 hospedado LOCAL em `media/lib/alphatab/` (alphaTab.min.js 1.1MB + Bravura font + sonivox.sf3 977KB).
- smplr 0.20.0 + soundfont acoustic_guitar_steel hospedado local em `media/lib/smplr-soundfonts/` (1.9MB).
- 1 tab cadastrada: `media/tabs/gp/black.gp3` (baixada de gtptabs.com pela Andre, 19KB).
- **Transport bar**: Play/Stop + select velocidade (0.25x/0.5x/0.75x/1x/1.25x/1.5x) + botao Loop.
- **Loop**: click no botao Loop → overlay grande no centro da tela com instrucao ("Clique no primeiro beat..."). 2 cliques na tab marcam start/end. Botao "play loop" amarelo aparece no FAB quando loop ativo.
- **FAB flutuante** (canto inferior direito): Pause/Play + Stop + Loop play. Sempre visivel enquanto tocando ou pausado. Stop esconde FAB + fretboard.
- **Autoscroll custom**: hook em api.playedBeatChanged + scrollIntoView({block:center}), throttled 400ms, margem central 25% pra evitar jitter. Cursor sempre proximo do meio da tela.
- **Cursor visual**: compasso ativo com fundo vermelho PJ semi-transparente, beat com barra vertical 3px, notas tocadas em vermelho.
- **Seletor de tracks no transport**: checkboxes por track (Stone/Mike/Jeff Ament) com mute (audio) + visual (renderTracks).

**Fretboard visualizer (floating canto direito durante playback):**
- 460x220 SVG com fundo de madeira (gradient), trastes prateados metalicos, nut em osso/marfim, inlay markers em madreperola (3/5/7/9 + duplo 12).
- Nomes das cordas afinadas na esquerda (E A D G B e ou E A D G).
- Seletor de instrumento (pill tabs): Violão/Guitarra (6c EADGBE) ou Baixo (4c EADG).
- Checkboxes de track POR DENTRO do fretboard (Stone/Mike/Jeff) — filtra visualmente quem aparece.
- Notas tocadas em circulos coloridos por track + halo + numero do fret. Cores: vermelho PJ, azul-petroleo, bronze, roxo, verde, magenta.
- Botao X no canto superior pra fechar manualmente.
- Stop tambem esconde.
- Hidden em mobile <=480px.

**CSP & infraestrutura:**
- `_headers` ajustado: worker-src 'self' blob:, font-src 'self' data:, script-src += blob: (resolve AlphaTab Web Workers).
- Tudo serve de `'self'`. Zero dependencia externa em runtime.

**Painel ANÁLISE (sessao anterior, sem alteracao recente):**
- 3 abas: PT, EN, **Opinião** (renomeada de "Tradutor" hoje).
- 227 ensaios em `media/lyrics-notes.json` (formato `{ song_key: "texto livre PT ~250-300 palavras" }`).
- Cards de busca tambem renderizam Opinião.

### Pendencia: design refinado pelo Claude Design

Andre pediu uma estilizacao premium da pagina de cifras (especificamente pra musica **Black**). O design vem em `scripts/_design-pearljamcifras/`:

- `README.md` (do bundle): instrucoes de como ler.
- `chats/chat1.md`: transcricao da conversa (LER PRIMEIRO).
- `project/Cifras Pearl Jam.html`: HTML principal final.
- `project/cifra.css`: paleta + tokens + layout (396 linhas).
- `project/*.jsx`: componentes React-style (cifra-app, cifra-detail, cifra-fretboard, cifra-tab, fretboard, tab-data, tweaks-panel) — TOTAL ~2100 linhas JSX.
- `project/cifra-data.js`: dados de musicas.
- `project/assets/`: pj-stickman.png e pj-sun-logo.png (adesivos pra colar no fretboard).
- `project/uploads/`: 4 screenshots da referencia visual.

**Resumo do design proposto:**

1. **Paleta dark** com album-accent burgundy (#C0392B), album-ink ambar (#F2C572), album-glow laranja (#E89C3D), bg-0 preto profundo (#0e0d0b). Fundo com **grao de papel** SVG noise sobre tudo.
2. **Banner** com capa do album 200x200 rotacionada -1.5deg + vinyl decoracao + titulo da musica em fonte Cormorant Garamond italic 56-96px gradient ambar-paper.
3. **Tabs internas**: Cifra / Letra / Interpretações / Setlists (mantém o sistema atual mas re-estilizado).
4. **Seletor Stone/Mike/Jeff** com foto, instrumento, afinação por musico (já temos o filtro de tracks; ele agora vira card com foto).
5. **Tab area** em papel envelhecido (#f4ecda) com playhead vermelho, brackets P.M., letra sincronizada opcional.
6. **Fretboard customizado**: madeira escolhivel (Rosewood/Ebony/Maple), adesivos PJ (stickman ou PJ-sun) colados no headstock/corpo via mix-blend-mode, corda vibrando na nota ativa, dot inlay tradicional.
7. **Side rail** de tracks com VU meters animados.
8. **Controles bottom**: volume, prev, play, speed 0.60 default, loop, metronome, fretboard toggle, settings.
9. **Modal de busca** Cmd+K (atalhos: / pra abrir busca, espaco play/pause).
10. **Tweaks panel** (canto inferior direito): madeira do braco, estilo dos adesivos, papel da tab, fundo do album, mostrar letra.
11. **Fontes**: Cormorant Garamond (titulos serif italic), Inter (corpo sans), Bebas Neue (display), JetBrains Mono (mono pra kbd).

**Features novas vs o que ja temos:**
- Metronome (nao existe hoje).
- Letra sincronizada com chord-chips.
- Modal de busca Cmd+K dentro da view Cifras.
- VU meters por track.
- Tweaks panel customizacao.
- Adesivos PJ no fretboard.
- Banner com capa + vinyl decorativo.
- Tipografia mais expressiva (Cormorant Garamond italic).

**O que MANTER do atual:**
- Toda a logica de player AlphaTab (cursor, autoscroll, loop, velocidade, FAB).
- Manifest `media/tabs/index.json` e arquivos `.cpro`/`.gp`.
- Parser ChordPro (`_renderChordPro`).
- Fretboard com filtro por track (já feito).
- Smplr local + AlphaTab local (zero CDN).
- CSP atual (worker-src blob:).

### Comando exato pra continuar
```
cd C:\Gitlab_hz\pearljam\setlists-pj-ev && claude
```

E na nova sessao, peca: "leia o handoff no PROGRESSO.md e implemente o design pendente em `scripts/_design-pearljamcifras/`".

---

## SESSÃO FECHADA: 227/227 letras transcriadas (100%)

Sessao iniciada com 49 letras (4 albuns completos) e fechada com **227 letras transcriadas + 227 ensaios do tradutor** em 14 commits sequenciais:

### Albuns de estudio (12) - 134 letras
1. Yield (1998): 13/13 (incluindo untitled fragmento). HEAD `391db5f`.
2. Binaural (2000): 13/13. HEAD `7e8aa6f`.
3. Riot Act (2002): 14/14. HEAD `ac44f06`.
4. Pearl Jam/Avocado (2006): 12/12. HEAD `5da5083`.
5. Backspacer (2009): 11/11. HEAD `ad51e0e`.
6. Lightning Bolt (2013): 12/12. HEAD `05048bb`.
7. Gigaton (2020): 12/12. HEAD `de3570b`.
8. Dark Matter (2024): 11/11. HEAD `f797b20`.
   (Ten, Vs., Vitalogy, No Code ja completados em sessao anterior)

### B-sides PJ batch (18 letras) HEAD `48c2657`
all night, sad, down, dont gimme no lip, alone, u, leaving here, hold on, yellow ledbetter, fatal, hard to imagine, footsteps, wash, dead man, strangest tribe, last kiss, bee girl, dirty frank

### Vedder solo - Into the Wild + Ukulele Songs (20 letras) HEAD `d1efec9`
driftin, setting forth, far behind, rise, long nights, hard sun, no ceiling, society, guaranteed, without you, more than you know, goodbye, broken heart, satellite, longing to belong, youre true, light today, sleepless nights, tonight you belong to me, dream a little dream of me

### Vedder solo - Earthling (11 letras) HEAD `3cff92e`
invincible, long way, power of right, brother the cloud, fallout today, the dark, the haves, good and evil, rose of jericho, try, picture

### Covers + originais avulsos (31 letras) HEAD pendente (commit final)
rockin in the free world, i believe in miracles, baba oriley, state of love and trust, youve got to hide your love away, ole, comfortably numb, crazy mary, i got id, man of the hour, long road, throw your arms around me, dont be shy, save it for later, better days, breath, song of good hope, its ok, redemption song, love reign oer me, masters of war, gimme some truth, crown of thorns, sonic reducer, another brick in the wall part 2, the ship song, picture in a frame, arms aloft, fortunate son, public image, reach down

### Fragmento experimental
untitled (Yield faixa 8): 2 linhas instrumentais cantadas, traduzido como 'Tamo tudo louco / Tamo tudo louco e tamo'.

## Estado atual (100% cobertura)
- Branch main sincronizado com origin (apos commit final).
- Lighthouse contra Cloudflare Pages (mobile): score **52 -> 67**, LCP 9.3s -> 5.5s, CLS 0.24 -> 0, TBT 68 -> 0, bytes 5293 KB -> 666 KB.
- Traducao PT interpretations.json: 220/220 entradas com PT, passada 2A aplicada.
- **Letras: 227/227 (100%)**.
- **Notas do tradutor: 227 ensaios em media/lyrics-notes.json**.

## Arquivos chave
- `index.html` linha 4402 (LYRICS EN, 227 entradas), linha 4403 (LYRICS_PT, 227 entradas).
- `media/lyrics-notes.json`: 227 ensaios do tradutor + _meta.
- `media/interpretations.json`: 220 entradas bilingues.

## MEDIA recovery 2026-05-11 (sessao da tarde)
**Linha do tempo dos commits da sessao:**
- `e1d5d0a` feat(media): subiu 56 my_photos 2015 + video 2014 (filtro automatico por tamanho >80KB).
- `b146b4a` revert(media): ROLLBACK das 56 fotos (Andre flagou conteudo inadequado, filtro nao foi suficiente).
- `0a938a5` fix(cache): _headers separou `/media/*/mine/*` com max-age 300 (antes era immutable 1 ano, que segurava CDN do Cloudflare apos remocao).
- `da4b667` fix(media): placeholder EM BREVE preenche os 56 slots vazios (visual ticket archive, fundo tan + borda PJ red + texto vermelho).

**Estado atual dos slots my_photos 2015:** todos os 56 (mais 56 thumbs = 112 arquivos) apontam pro placeholder `media/_placeholder-embreve.jpg` / `_placeholder-embreve-thumb.jpg`. Site mostra o "EM BREVE" no lugar das fotos pessoais ate retomada show por show.

**Decisao de protocolo (salva em memory feedback_no_bulk_photo_import.md):** futura importacao de my_photos do Drive vai pra `media/_staging/show-XXXX/`, Andre valida visualmente e move pra `mine/` show por show. Nunca mais bulk com filtro automatico.

**Video 2014 mantido:** `ev-2014-05-06/videos/video-1.mp4` (Facebook clip 1.47 MB 11s, 400x400) ficou no commit `e1d5d0a` apos rollback. Validacao visual ainda pendente.

**Cache do Cloudflare:** se o site ainda mostrar a foto antiga (zumbi), Andre precisa purgar manualmente via dashboard (Workers & Pages > setlists-pj-ev > Purge Cache). O immutable do header antigo retem cache mesmo apos novo deploy.

**Audit detalhado:** `MEDIA_AUDIT_2026-05-11.md` com lista de file_ids do Drive ainda valida pra retomada manual.

## Outras alteracoes da sessao da tarde (commits independentes)
- `07f9e46` feat(letras): unifica painel de letra em 4 modos EN/PT/EN-PT/Traducao. Cada musica com LYRICS_PT mostra barra de 4 botoes no painel. Botao externo virou "letra/traducao" quando ha PT.
- `7c5ae27` perf(fontes): troca font-display optional por swap (Archivo Black + Big Shoulders Display + Oswald + IBM Plex Mono + Caveat + Stardos Stencil). Primeiro acesso agora ve a fonte real (com pequeno FOUT) em vez de ficar no fallback.
- `7308d33` style(letras): margin-bottom da .lyric-lang-bar 10->18px.
- `61fbe64` feat(busca): adiciona card Traducao no resultado da busca (3 cards: Letra EN, Traducao PT, Interpretation EN). Padding-top de .lyric-pane 6px no painel inline.
- `2456040` style(letras): padding-top de .lyric-pane 6->14px (alinha com respiro do interpretacao).
- `27b5e1b` fix(raridades): badge "Dados pearljam.com/vitalogy/songs" com z-index 2 + margin-bottom 32px (estava sendo comido pela meia-lua do gauge).

## Passada 2B contextual em interpretations.json (sessao 2026-05-11 noite)
Reduzidos os 3 tiques de traducao identificados:
- `o tipo de`: 271 -> 3 (3 remanescentes legitimos: "o unico tipo", "outro tipo", "pelo tipo de luz").
- `estruturada em torno de`: 23 -> 0 (rotacao: construida sobre, armada em torno de, ancorada em, erguida sobre, etc).
- `a estrutura da cancao convida` + `que o verso da cancao exige`: 17 + 12 -> 0 (rotacao: a arquitetura da faixa pede, o arranjo da cancao convida, o verso pede, etc).

254 campos alterados em text_pt + byShow_pt. Estrutura JSON preservada (221 chaves, 220 text_pt, 779 byShow_pt entries). Scripts auxiliares versionados em `scripts/` (apply-pt-pass-2b.mjs, scan-pt-tics.mjs, sample-diff.mjs, compare-counts.mjs) — reutilizaveis pra futuras passadas (2C, 2D).

## Rename de secao: INTERPRETAÇÃO -> ANÁLISE (sessao 2026-05-11 noite)
Botao da faixa, tooltips, aria-labels e meta-textos visiveis ao usuario trocados de "interpretação" pra "análise" no index.html. Motivacao: "interpretação" em musica tem duplo sentido (hermeneutica + performance), criando ambiguidade num site de shows. "análise" é preciso e curto (botao com 7 chars vs 13). Conteudo dos ensaios em interpretations.json nao foi tocado (texto interno autoral), assim como nomes de variaveis JS (_getInterpretation, .interp-toggle, .interp-row), classes CSS e o filename interpretations.json — refator interno sem ganho ao usuario. Letras (LYRICS_PT) com a palavra "interpretação" como verso cantado permaneceram intactas.

## Fase 1 TAB: infraestrutura (sessao 2026-05-11 noite)
Estrutura base pra cifras e tablaturas hospedadas localmente em `media/tabs/`. Botao TAB ao lado de LETRA e ANÁLISE na linha da faixa, com painel inline em 2 abas (Cifra | Tab) e info-bar com pills mostrando key/capo/tuning.

**Criado:**
- `media/tabs/index.json` manifest com 20 entradas Top 20 PJ ao vivo (black, alive, even flow, yellow ledbetter, better man, jeremy, daughter, elderly woman..., just breathe, given to fly, corduroy, state of love and trust, animal, rearviewmirror, do the evolution, last kiss, crazy mary, sirens, hail hail, footsteps). Cada uma marcada como `{cifra: false, tab: false, key, tuning}` — placeholder.
- JS: `_loadTabsManifest()`, `_getTabEntry()` + chamada non-blocking em init().
- HTML: bloco TAB button + row injetado depois do bloco ANALISE no loop de faixas.
- CSS: `.tab-toggle`, `.tab-row`, `.tab-block`, `.tab-info`, `.tab-pill`, `.tab-pane`, `.tab-pane-soon` em paleta azul-petroleo (#2e6b8a) pra distinguir visualmente de LETRA (vermelho PJ) e ANALISE (laranja EV).

**Comportamento Fase 1:** botao TAB aparece nas 20 musicas do manifest. Painel mostra info-bar (key + tuning + capo quando aplicavel) e duas abas "Cifra"/"Tab", ambas exibindo placeholder "em breve - esta musica esta no plano das proximas curadorias". Texto explicativo do drawer audio-notes atualizado pra incluir o botao TAB.

**Proximas fases:**
- Fase 2: parser ChordPro + chord-chips coloridos + diagrama SVG no clique. Cadastro de 3-5 cifras iniciais (Black, Alive, Even Flow).
- Fase 3: AlphaTab integration via CDN lazy-load. Cadastro de 3-5 .gp iniciais.
- Fase 4: curadoria completa das 20 ao longo de varias sessoes.

## Fase 2 TAB: parser ChordPro + chord-chips + diagrama SVG (sessao 2026-05-11 noite)
Cifra moderna renderizada como pílulas tipograficas azul-petroleo ($2e6b8a) sobre a letra, com diagrama de acorde aparecendo num popover ao clicar/Enter no chord-chip.

**Criado:**
- Parser ChordPro inline em index.html: `_parseChordProLine`, `_renderChordPro`. Aceita `{section: nome}` pra label de estrofe (Intro, Verso, Refrao, Ponte, Solo, Outro), `[Chord]lyric...` pra chord-chip em cima da silaba/palavra, linha em branco como separador. Outras metadatas `{key:.}` etc ignoradas (vem do manifest).
- `_CHORD_DB`: dicionario com 28 acordes mais usados no Top 20 PJ (A, Am, Am7, B, B7, Bm, C, Cadd9, C#m, D, Dsus2/4, Dadd9, Dm, E, Em, Em7, E7, F, F#, F#m, F#sus4, G, G/B, A/E, Asus2/4). Cada entry: `{frets: [E_grave -> e_aguda], fingers, barre?}`.
- `_renderChordDiagram(chord)`: gera SVG 84x100 com nut, 4 trastes, 6 cordas, marcadores x/o, dedos numerados e barre quando aplicavel.
- `_attachChordChipHandlers(root)`: click/Enter no chord-chip abre popover com diagrama; click fora fecha; Esc fecha; toggle se ja aberto no mesmo chip.
- Slug auxiliar `_tabSlug(songKey)` substitui espacos por hifens pra evitar gotchas de filename.
- CSS novo: `.cifra-stanza`, `.cifra-section`, `.cifra-line`, `.cifra-token` (flex-column), `.chord-chip`, `.chord-chip-spacer`, `.cifra-syl`, `.chord-diagram` (popover absoluto), `.chord-diagram-svg`, `.chord-diagram-empty`.
- Cifras cadastradas: `media/tabs/cifras/black.cpro`, `alive.cpro`, `even-flow.cpro`. Cada uma ~5-7 estrofes (intro, verso, refrao, ponte, solo, outro), ChordPro padrao.
- Manifest atualizado: `cifra: true` pras 3 musicas.

**Comportamento:** ao clicar TAB numa das 3 musicas, a aba Cifra carrega lazy o arquivo `.cpro`, renderiza chord-chips coloridos com letra abaixo, e cada chip e clicavel pra mostrar o diagrama do acorde. Acordes nao cadastrados no `_CHORD_DB` mostram "digitacao nao cadastrada" no popover (fallback gracioso). As outras 17 musicas do manifest seguem com placeholder "em breve".

**Validacao pendente:** abrir show no navegador, testar Black/Alive/Even Flow, conferir:
1. chord-chips aparecem alinhados acima do texto;
2. click no chord-chip abre diagrama SVG com posicoes corretas;
3. click fora ou Esc fecha o popover;
4. mobile (320-768px) nao quebra layout (cifra-token flex-direction column ja prevê quebra de linha).

## Fase 3 TAB: AlphaTab via CDN lazy-load (sessao 2026-05-11 noite)
Aba Tab agora renderiza tablatura vetorial via biblioteca AlphaTab (https://alphatab.net, MIT license), carregada via jsdelivr quando o usuario abre a aba Tab pela primeira vez (zero overhead se nunca usado).

**Adicionado em index.html:**
- `_loadScriptOnce` / `_loadStyleOnce`: helpers idempotentes pra inject de tag.
- `_ensureAlphaTab()`: Promise singleton que carrega AlphaTab 1.5.0 (script + CSS) de cdn.jsdelivr.net. Retorna `window.alphaTab`.
- `_initAlphaTabPanel(container, songKey, tabFormat)`: instancia AlphaTabApi com `staveProfile: 'tab'` (so tablatura, sem partitura) e `enablePlayer: false` (sem soundfont, leve). Aceita `.gp` (Guitar Pro binario via `file:`) ou `.alphatex` (texto plano via `tex:`, lido por fetch).
- Atualizacao do fillTabBody: quando `hasTab=true`, cria `<div class="alphatab-surface">` e chama `_initAlphaTabPanel`. Mostra "carregando tablatura…" enquanto inicializa; fallback gracioso em caso de erro.

**CSS novo:** `.alphatab-surface` com border azul-petroleo, overflow-x auto pra mobile, padding leve.

**Conteudo cadastrado:** `media/tabs/gp/black.alphatex` com a progressao basica da intro de Black (Em - G - D - A) em formato AlphaTex (texto humano-editavel). Manifest marca `black: { tab: true, tabFormat: "alphatex" }`.

**Por que .alphatex no exemplo:** AlphaTex e o formato texto nativo da AlphaTab, mais facil de versionar em git e editar sem app dedicado. Pra musicas com arranjos complexos (solos, multi-instrumento, ritmo detalhado), o melhor e usar `.gp` (Guitar Pro 7) exportado de Songsterr/UG.

**Validacao pendente:** abrir Black no navegador, clicar TAB, ir pra aba Tab, conferir que carrega a tablatura. Possiveis ajustes: sintaxe do AlphaTex pode ter erros (nao testei contra a AlphaTab real); refinamento da progressao virá nos commits de curadoria.

## Secao "Cifras & Tabs" no nav (sessao 2026-05-11 noite)
Nova view dedicada ao lado do Deep, listando o conteudo musical do site num grid de cards (visual similar a Deep mas com card horizontal compacto: cover do album + meta + badges).

**Adicionado:**
- Tab no nav: `🎸 Cifras & Tabs` apos `📖 Deep`.
- Section `<section id="view-tabs">` com `<div id="tabs-content">`.
- Case `tabs` no switch de `renderCurrent()`.
- Funcao `renderTabsView()`: lista todas as entries do TABS_MANIFEST como cards expansiveis. Ordenacao: cifra+tab primeiro, depois so cifra, depois so tab, depois placeholders, com tie-break alfabetico.
- Funcao `_renderTabPanel(body, songKey, tabMeta)`: extracted de fillTabBody, agora reusada tanto pelo painel inline da faixa quanto pelo body expandido da card. fillTabBody virou one-liner.
- Cada card: cover do album (via `albumCoverPath`), titulo, album subtitle, key pill, badges (Cifra/Tab on ou em breve), chevron. Click expande o body inline com o painel completo de cifra/tab.

**CSS novo (paleta azul-petroleo):**
- `.tabs-empty`, `.tabs-intro`, `.tabs-grid` (auto-fill 280px min).
- `.tabs-card` (border azul-petroleo, hover/open com shadow).
- `.tabs-card-head` (botao com cover 60x60 + meta + chevron).
- `.tabs-card-cover`, `.tabs-card-meta`, `.tabs-card-title`, `.tabs-card-sub`.
- `.tabs-card-badges`, `.tabs-keypill`, `.tabs-badge-on`, `.tabs-badge-off`.
- `.tabs-card-chevron` (rotate 180 quando open).
- `.tabs-card-body` (revela painel _renderTabPanel inline).

**UX:** o usuario pode usar o site de duas formas pra cifra/tab:
1. Pela faixa do show (botao TAB inline ao lado de LETRA/ANALISE).
2. Pela view dedicada (encontra rapido sem precisar abrir um show).

Ambas usam o mesmo `_renderTabPanel`, garantindo consistencia visual e zero divergencia de logica.

**Validacao pendente:** abrir `Cifras & Tabs` no nav, conferir grid renderizado, expandir black/alive/even-flow, validar que painel mostra mesmas abas/chord-chips da versao inline da faixa.

## Som arpejado no chord-chip via smplr (sessao 2026-05-11 noite)
Click no chord-chip agora toca o acorde como arpejo de violao acustico, alem de abrir o diagrama.

**Adicionado em index.html:**
- `_TUNING_MIDI = [40, 45, 50, 55, 59, 64]` (E2 A2 D3 G3 B3 E4, ordem 6 grave -> 1 aguda).
- `_chordToMidiNotes(chordName)`: converte `_CHORD_DB[chord].frets` em array de notas MIDI, pulando muted (x). Usa o offset de cada corda + fret.
- `_getAudioCtx()`: singleton AudioContext lazy.
- `_ensureGuitarSampler()`: Promise singleton que importa smplr ESM do CDN jsdelivr e instancia Soundfont com instrumento `acoustic_guitar_steel`. Samples carregam de `gleitz.github.io/midi-js-soundfonts` (default do smplr).
- `_playChordSound(chordName)`: toca arpejado, 25ms entre cordas, velocity 75, duracao 1.6s. Silencioso em caso de erro (feature opcional).
- Hook em `_attachChordChipHandlers.showFor`: alem de mostrar o diagrama, chama `_playChordSound(chord)`. Gesto do usuario (click) ja autoriza Web Audio.

**Performance:**
- Primeiro click: ~500-1000ms (smplr ~50KB + soundfont base ~150KB).
- Cliques seguintes na mesma musica: instantaneo (samples cacheados pelo browser).
- Zero overhead se o usuario nunca clicar (lazy load total).

**Dependencias externas (hoje):**
- `cdn.jsdelivr.net/npm/smplr@0.20.0/dist/index.mjs` (~50KB).
- `gleitz.github.io/midi-js-soundfonts/.../acoustic_guitar_steel-mp3/{nota}.mp3` (5-10KB por nota).

**Plano futuro (se Andre aprovar o som):**
- Baixar os 88 samples acoustic_guitar_steel pra `media/sound/acoustic-guitar/`.
- Configurar smplr com `instrumentUrl` apontando local. Zero dep externa, +5MB no repo, mais rapido (mesmo origin).

## Players (Cifra + AlphaTab) (sessao 2026-05-11 noite)
Dois players adicionados ao painel TAB: um simples na aba Cifra (percorre acordes no BPM) e um rico na aba Tab (AlphaTab nativo, cursor sincronizado).

**Player de Cifra (aba Cifra):**
- Barra com botao `▶ Play` + meta `87 BPM · ~2 beats por acorde · violão acústico`.
- `_startCifraPlayer(root, bpm)`: percorre todos os chord-chips em ordem de aparicao, toca cada um arpejado (chamada a `_playChordSound`) e ilumina via classe `.chord-chip-playing` (animacao `chord-pulse` 600ms + box-shadow vermelho PJ).
- Duracao por acorde: `2 * 60/BPM` segundos. Scroll automatico pra manter o chip ativo visivel.
- `_stopCifraPlayer(root)`: aborta loop, limpa highlight, restaura botao.
- Estado armazenado em `WeakMap` por root pane (suporta multiplos painés abertos simultaneos).
- BPM cadastrado no manifest: black=87, alive=78, even flow=110. Default 90 se ausente.

**Player de Tab (aba Tab):**
- `_initAlphaTabPanel` agora passa `enablePlayer: true`, `enableCursor: true`, `soundFont: sonivox.sf3` do CDN jsdelivr (~2MB lazy).
- Transport bar com `▶ Play` (toggla pra `❚❚ Pause`), `◼ Stop` e status text.
- Hooks em `api.playerStateChanged` e `api.playerReady` pra sincronizar UI.
- Player toca a tablatura completa com cursor visual andando, no tempo do .gp/.alphatex.

**CSS novo:**
- `.chord-chip.chord-chip-playing` (vermelho PJ + dual box-shadow + pulse animation).
- `@keyframes chord-pulse` (scale 1 -> 1.18 -> 1).
- `.cifra-player-bar`, `.cifra-play-btn` (azul-petroleo idle, vermelho PJ playing), `.cifra-player-meta`.
- `.alphatab-transport`, `.alphatab-btn`, `.alphatab-play[data-state=playing]`, `.alphatab-status`.

**Performance:**
- Cifra player: zero overhead extra (reusa smplr ja carregado pelo click).
- AlphaTab player: primeiro Play baixa sonivox.sf3 ~2MB do CDN (lazy). Cache subsequente.
- Smplr samples + AlphaTab SoundFont sao bancos diferentes: ambos cobrem TODAS as musicas (~5MB + ~2MB = 7MB total externo, mas pode hospedar local depois).

**Smoke test passa:** todos os markers HTML/JS/CSS no lugar, BPM cadastrado no manifest pra black/alive/even flow.

**Validacao pendente no browser:**
1. Cifra: click Play em Black → chord-chips iluminam um por um no ritmo, audio arpejado em loop.
2. Tab: click Play em Black aba Tab → cursor AlphaTab anda pela tab e som toca via sonivox.
3. Stop interrompe ambos.
4. Multiplos paineis abertos simultaneos nao conflitam.

Plano completo em `C:\Users\engan\.claude\plans\shimmering-crunching-matsumoto.md`.

## Aba Tradutor no painel ANÁLISE (sessao 2026-05-11 noite)
`media/lyrics-notes.json` (227 ensaios do tradutor, ~250-300 palavras cada, foco em simbolismo e decisoes de traducao) agora renderizado como terceira aba "Tradutor" no painel ANÁLISE da faixa, ao lado de PT/EN da analise critica.

**Logica de exibicao:** botao ANÁLISE aparece se houver analise critica OU nota do tradutor. Abas sao dinamicas conforme conteudo disponivel:
- 170 musicas tem ambos -> 3 abas (PT, EN, Tradutor)
- 50 musicas so tem analise -> 1 ou 2 abas (PT e/ou EN)
- 57 musicas so tem nota do tradutor -> 1 aba (Tradutor)
- Quando uma aba so, sem lang-bar, prosa direto.

Aproveitou-se o sistema de tabs existente (.lyric-lang-bar, .interp-pane) com nomenclatura nova: `data-tab` no lugar de `data-lang`, classes `.interp-pane-pt/.interp-pane-en/.interp-pane-tr`. ARIA-label do tablist mudou de "Idioma da analise" pra "Modo da analise".

**Card de busca:** novo card 4 "Nota do tradutor · em português" aparece quando ha nota cadastrada. Card 3 (analise EN) teve titulo trocado de "Interpretation · English critical commentary" pra "Análise crítica · em inglês" pra coerencia.

**Texto explicativo do drawer:** o paragrafo da audio-notes-section agora menciona que o painel tem abas (PT, EN e nota do tradutor, conforme a disponibilidade).

Sintaxe JS validada via node --check sobre o inline extraido. Validacao visual no navegador ainda pendente: golden path = abrir show 2005-12-02 -> Black -> clicar ANÁLISE -> conferir que ha 3 abas (PT/EN/Tradutor) e que a aba Tradutor renderiza prosa em portugues.

## Outras frentes pendentes (proximas sessoes)
- Retomada das my_photos 2015 show por show: usar `MEDIA_AUDIT_2026-05-11.md` como ponto de partida. Para cada show, baixar candidatos pra `media/_staging/`, Andre escolhe visualmente, move pra `mine/` e commita. Nunca importar bulk.
- Passada 2C (boilerplate sentencial): "carregou os dois versos com X participacao vocal sustentada que a geometria acustica da casa a ceu aberto amplificou" aparece 7-8x quase verbatim. Precisa reescrita estrutural, nao so rotacao de invólucro.
- Performance round 3: 24 KiB unused-JS no index, 21 KiB unused CSS, render-blocking dos 3 links de fontes.
- MEDIA gap remanescente: 14 shows ainda sem my_photos no disco (2011, 2013, 2018, EV 2014), pasta media/comunidade/ inteira faltando (22 fotos esperadas pela chip Comunidade, fonte externa), 26 MP3s do show 2005-12-02, poster-1.jpg do 2024-08-31, my_photos 4 do ev-2014-05-06. Detalhes no MEDIA_AUDIT_2026-05-11.md.
- Validacao visual: revisar musica por musica no site (letra + interpretacao + nota do tradutor) e ajustar manualmente o que precisar.
- Passada de expansao opcional nos ensaios de covers (atualmente 50-100 palavras, abaixo da regua de 250 dos albuns de estudio). Por protocolo, covers entram com nota mais curta (letras alheias com contexto biografico), entao a expansao so faz sentido caso a caso, ex: covers de peso simbolico recorrente no setlist (rockin in the free world, baba oriley, comfortably numb, love reign oer me) merecem 180-220 palavras.

## Blockers
Nenhum.

## Protocolo da transcriacao (registro pra proximas sessoes)
1. **Fonte canonica unica**: usar apenas o LYRICS inline do index.html. Nao buscar letras externas.
2. **Contagem de linhas casada**: cada linha EN tem 1 linha PT correspondente (validado por script Node antes de aplicar).
3. **Falso-cognato check**: lista mental dos classicos (temple/templo, take/aguentar, middle/centro, legal halls/tribunais, library, pretend, actually, sympathetic, etc.).
4. **Glossario consistente**: termos-imagem traduzidos igual em todas as ocorrencias da mesma letra.
5. **Nomes proprios, datas, numeros, marcas**: preservados literalmente.
6. **Sem em-dash** (—). Regra global do projeto.
7. **Estilo de transcriacao**: equivalencia emocional/cultural ("Carlos Renno traduzindo Cole Porter"). Nao literal, nao adaptada-leve, nao poetica-rimada.
8. **Ensaio por musica**: ~250-290 palavras pra letras de albuns; ~150-180 pra b-sides; ~50-100 pra covers (vistos como letras alheias com contexto biografico). 3-4 paragrafos quando longos, 1-2 quando breves.
9. **1 commit por album/batch**, mensagem citando trecho por trecho as decisoes principais.

## Comando exato pra continuar
cd C:\Gitlab_hz\pearljam\setlists-pj-ev && claude

## Sessao 2026-05-13 tarde/noite, pipeline de news automation fechado

Investigacao longa de como a Claude routine remota (Anthropic Cloud) consegue commitar no repo. Varios caminhos testados e descartados:

| Rota | Resultado |
|---|---|
| `git push` direto do sandbox | 403 receive-pack do proxy local (mesmo com toggle "git push irrestrito" ligada) |
| Cloudflare Worker `news-merge-dispatch.eng-andrehz.workers.dev` | "Host not in allowlist" (workers.dev nao passa) |
| `mcp__github__push_files` (multi-file atomic) | Stream idle timeout, payload >80KB estoura |
| PAT no prompt + `curl api.github.com/dispatches` | Funcionou (commit 48588a9 das 14:34), mas expoe PAT no painel da routine |
| **`mcp__github__create_or_update_file` (single-file)** | **Rota final, funciona** |

**Solucao estrutural validada (commit f92dfaa):** split do `body_pt` em arquivos individuais `media/news/items/<id>.json` (1-5KB cada). `index.json` ficou light de 44KB pra 12KB. Cada arquivo individual cabe no payload do MCP single-file sem estourar stream. Routine `mcp__github__create_or_update_file` autenticada como `terra-gentil` (via OAuth Anthropic-Github, aceito, registrado em memoria).

Validado em producao: rodada 17:15 UTC publicou os 3 pendings (Mike McCready / "Who You Are" Stereogum / Yungblud+Eddie) em 6 commits sequenciais por `terra-gentil` (`bace625`, `3e1b5d6`, `ca93d95`, `aeeef6c`, `f7a426a`, `bb65dc9`). `_pending.json` zerou, `index.json` em 20 itens.

### Outras entregas da sessao
- **Step Summary nos workflows GH Actions:** helper `scripts/news/_summary.mjs`, plugado em `fetch-news`/`community-fetch`/`merge-curated`. Painel "Summary" mostra counts + lista de titulos linkaveis na pagina do run.
- **CTA `[ LER -> ]` nos cards do grid** (estilo fanzine, casa com o hero), com hover transform. Plus ajuste de card pra encaixar sem cortar intro (line-clamp 3 -> 4, mais respiro).
- **Lazy-fetch do body_pt** no `_renderNewsDetail` (consome o split novo).

### Infra ociosa deployada nao usada (vale limpar)
- **Cloudflare Worker** `news-merge-dispatch.eng-andrehz.workers.dev` deployado, env vars `GH_PAT` + `ROUTINE_SECRET` setadas, mas rota nao funciona (proxy do sandbox bloqueia workers.dev). Pode deletar ou deixar parado (custo zero).
- **Workflow** `.github/workflows/news-merge.yml` com trigger `repository_dispatch`: nao eh chamado pela routine, mas serve de rota manual de emergencia.
- **PAT** `github_pat_11AHTKO6Y0...` (gerado pra rota worker, agora ocioso). **RECOMENDADO REVOGAR** porque vazou no chat anterior. Tambem `ROUTINE_SECRET` `7ATLlJRoduxgBVqMV-TLkOQkN2i49QJWc4eeWBBHG7M` vazou.

### Pendencias da sessao (proxima sessao decide)
1. **Integracao Instagram**: discutida mas nao decidida. Opcoes: (a) app Meta + Hashtag Search (gratis mas precisa App Review, sem username de quem postou, max 30 hashtags/7d), (b) RSS.app (~$10/mes, simples, com atribuicao completa), (c) Threads RSS publico (Pearl Jam tem mas posta pouco). Andre estava preenchendo formulario do Meta Developer Portal quando interrompeu.
2. **Limpeza de seguranca**: revogar PAT antigo no GitHub, apagar env vars do worker CF, decidir se deleta worker e workflow news-merge.yml.
3. **Performance**: index 12KB agora deve subir Lighthouse Perf (estava 52). Vale revalidar.

### Memorias adicionadas
- `reference_anthropic_cloud_proxy.md`: proxy do sandbox bloqueia git push mesmo com toggle ligada
- `reference_routine_mcp_github.md`: routine commita via `mcp__github__create_or_update_file` autenticado como `terra-gentil` (integracao OAuth Anthropic-Github fica em `terra-gentil`, aceito)

### Cron da routine
`30 */6 * * *` UTC (proximo: 00:30 UTC = 21:30 BRT). Coleta automatica do GH Actions roda 7min antes (`23 */6 * * *`).

