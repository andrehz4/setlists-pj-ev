# PROGRESSO, setlists-pj-ev

## Data
2026-05-29 (sessão longa: cutover V2 + ~35 fixes + integração fórum + redesign perfil + Batches 1+2+3+4 mobile)

## Estado atual
Em produção: `build 2026-05-29.13`. Batches 1, 2, 3 e 4 do mobile skin aplicados (Notícias + chrome global + Timeline + drawer setlist + Galeria + lightbox + BANDA + Cifras & Tabs + FAB #9 + Fórum iframe e páginas standalone). Fila de bugs anteriores zerada.

## Próximo passo concreto
1. Validar Batches 1-4 em produção (DevTools 375px / 414px). Smoke test consolidado:
   - **B1-B3:** ver entrada anterior
   - **B4:** abrir tab Fórum no `index.html` → iframe full-bleed sem padding lateral duplicado. Abrir um tópico (vai pra `forum-topic.html`) → header/composer/posts com alvos de toque. Abrir perfil (`forum-profile.html`) → `.profile-body` colapsa em 1 coluna (antes a sidebar 320px espremia o conteúdo)
2. Confirmar build `2026-05-29.13` no rodapé
3. Pedir Batch 5 ao Claude Design (último): views auxiliares (ranking/highlights/rarity/deep/gaps/search + drawer de show) → `mobile-aux.css`

## Sessão 2026-05-29 — Batches 1, 2 e 3 mobile aplicados

### Instalação
Pasta `mobile/` com os arquivos do design bundle Anthropic (`mobile-pj`):
- `mobile.css` (aggregator com `@import` dos 6 parciais ativos + 2 placeholders comentados B4/B5)
- `mobile-core.css` **B1+B2+B3** (nav scroll-snap sticky, masthead compacto, filter-bar wrap, audio-player 1-linha, footer coluna única; B3 mata reticência da aba "BUS..." em iPhone SE)
- `mobile-news.css` **B1** (#view-news fanzine)
- `mobile-timeline.css` **B2** (year-label 96→60px, drawer setlist 16px, chips LETRA/TAB/ANÁLISE)
- `mobile-gallery.css` **B2** (contact-sheet 3 colunas + **fix crítico lightbox**: setas ‹ › reativadas)
- `mobile-banda.css` **B2** (membro aberto vira `grid-column: 1/-1`)
- `mobile-cifras.css` **B3** (#view-tabs: busca ≥46px com fonte 16px anti-zoom iOS, itens ≥52px, transport com play 54px, partitura scroll interno, chord-chips legíveis; **FAB #9 resolvido CSS-only** via `#audio-player.active ~ .alphatab-fab` → `bottom: 112px` (104 em ≤480), zero JS)
- `mobile-forum.css` **B4** (#view-forum iframe edge-to-edge + páginas standalone: header/auth/btn ≥40px, busca 16px anti-zoom, **`.profile-body` colapsa em 1 coluna** — antes 1fr+320px espremia o conteúdo)
- `README.md` (decisões B1 + B2 + B3 + B4)

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
**B2:** Timeline year-label engolindo cards · Drawer setlist legibilidade · Galeria contact-sheet · Lightbox sem navegação (CRÍTICO) · BANDA ficha espremida

### Pendência conhecida pro Batch 3
FAB do cifra player (#9): subir `bottom` quando `#audio-player.active`. Provavelmente seletor irmão CSS.

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
