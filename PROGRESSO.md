# PROGRESSO, setlists-pj-ev

## Data
2026-06-01 (sessão tarde: CAUSA REAL do repost achada e CONSERTADA, contraria o handoff anterior)

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
