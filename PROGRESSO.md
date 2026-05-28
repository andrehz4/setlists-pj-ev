# PROGRESSO, setlists-pj-ev

## Data
2026-05-29 (sessão longa: cutover V2 + ~30 fixes)

## Estado atual
Em produção: `build 2026-05-29.07`. Cutover V2→V1 concluído, fórum integrado via iframe, paginação de notícias funcional, 100% cobertura de acordes nos 191 JSONs, diagramas de cifras com fret>4 + barre, migrações SQL aplicadas no Supabase.

## Próximo passo concreto
1. Validar em produção: tab Fórum embebido funciona (clica e vê dentro da view-forum), perfil edita e salva, paginação notícias responde (`< 1 2 >`).
2. Decidir bug #8 da fila: cifras compartilhadas vs separadas por instrumento (opção A=manter design / B=schema novo com `instruments.{inst}.content`). Bloqueado esperando Andre.
3. Cleanup opcional: ~735 linhas de mock antigo do fórum no `index.html` (`_fState`, `renderForum`, `_fHomeHtml`, etc — órfãs desde a integração via iframe).

## Sessão 2026-05-28/29 — cutover V2 + fila de bugs + integração fórum

### Cutover V2 → produção (commits `65c70a2`, `252394b`)
- `cifras-v2.html` (~21k linhas, com ~20 fixes na seção de cifras) virou `index.html`
- 3 ajustes pré-cutover: title sem "preview isolado", remoção do script auto-open-cifras, build tag sem `v2`
- `cifras-v2.html` deletado do repo

### Fixes na seção de cifras (heranças do V2, todos em produção agora)
- FAB sem play duplicado + botão × de fechar
- Master mixer controla volume da cifra (bindado no `renderTabsView`, antes só rodava com tab carregada)
- Scroll preservado ao trocar instrumento, alinha `.alphatab-surface`
- Diagramas com fret>4 (indicador `Nfr`) + barre detection (objeto/numero/fingers repetidos)
- Violão usa `cdata.fingering` do JSON (antes caía no `_CHORD_DB` legado)
- Voice-picker movido pra dentro de `.tab-pane-tab` (não vaza pro modo CIFRA)
- Mixer-aside sempre expandido (sem reflow no hover)
- Footer compacto (~136px+116px de espaço morto removidos)
- Decais `pj-stickman/pj-sun-logo` movidos pra dentro do braço + halo defensivo nos marcadores
- Zoom de texto da cifra (A−/A+) com default 120%, persiste localStorage
- Strumming-bar sempre renderiza (piano sem strumming não some mais)
- 3 tablists de instrumento com aria/SVG corretos + sync bidirecional
- Botão "Visualizador" (era "Braço") para o overlay

### Cobertura de acordes 100% (commit `7e5d2fa`)
- `scripts/audit-chord-coverage.mjs` — varre os 191 JSONs e lista lacunas
- `scripts/fill-chord-gaps.mjs` — preenche lacunas com biblioteca canônica + chord book embutido
- 34 acordes preenchidos em 11 músicas (D7, C, Bb, F5, etc — todos já existiam em outros JSONs)
- `scripts/cifras-coverage.test.mjs` — 8 testes garantindo invariantes (rodar `npm run test:cifras`)

### Vistoria de sprint (commits `7fd12c2`, `ee29742`, `417f116`)
Subiu nota média de 6.3 → 7.0:
- **Segurança** 6→8.5: DOMPurify carregado + helper `window._safeHtml` + meta `referrer` policy
- **Observabilidade** 4→6: error handlers JSON em `window.error` e `unhandledrejection`
- **SEO** 9→10: sitemap.xml expandido + JSON-LD Schema.org (WebSite + Person + MusicGroup + SearchAction)
- **Testes** 3→5: 8 testes Node nos JSONs cifras-multi (npm test integrado)

### Paginação de notícias (commit `e6feb41`)
- `const _NEWS_PER_PAGE = 22;` (variável fácil de ajustar)
- Paginação acima do grid + abaixo (entre grid e lista compacta)
- Hero (items[0]) fixo, não pagina
- Reset pra página 0 ao trocar tag
- State em `window._newsCurrentPage`
- Lista compacta MANTIDA como complemento (Andre flagou que paginação é essencial)

### Integração fórum via iframe (commit `2fbbc46`)
- Tab "Fórum" voltou a ser `<button data-view="forum">` interno
- `<section id="view-forum">` com `<iframe src="forum.html">` carregado lazy
- Altura dinâmica via postMessage: `forum.html` emite, `index.html` ajusta `iframe.style.height`
- Boot lê `?tab=forum` da URL e ativa aba (auth callback redireciona pra `/?tab=forum`)
- Sub-páginas (`forum-topic.html`, `forum-profile.html`) continuam standalone (links absolutos abrem em nova aba a partir do iframe)
- `auth-callback.html` redirect: `forum.html` → `/?tab=forum`

### Migrações SQL aplicadas no Supabase (Andre rodou)
- `001_fix_body_reactions_indexes.sql` — body→text, tabela `forum_reactions` criada, índices
- `002_anchor_show_id.sql` — coluna `anchor_show_id` em forum_topics
- `003_user_profile_fields.sql` — bio/email/birth_year/city/shows_attended em forum_users
- **ALTER manual extra** (descoberto durante debug): `forum_reactions` precisava de coluna `site` (CREATE TABLE IF NOT EXISTS pulou porque a tabela já existia em schema antigo). Aplicado com DEFAULT 'pj'.

### Auditoria pós-mudanças: terra-gentil intacto
- Terra-gentil é projeto Next.js separado (`C:/Gitlab_hz/terra-gentil-site/`)
- Consome OUTRO backend Railway (`terra-gentil-app-production.up.railway.app`, Doutor Gentileza/Gemini)
- NÃO usa tabelas `forum_*` ou `feed_*` do Supabase do pj
- Validado: `SELECT site, COUNT(*) FROM forum_reactions GROUP BY site;` retornou só `pj` (14 reactions)

## Arquivos-chave dessa sessão
- `index.html` — cutover V2, fórum iframe, paginação, structured data, DOMPurify, error handlers
- `forum.html` — emitter de altura via postMessage (window.parent.postMessage)
- `auth-callback.html` — redirect final pra `/?tab=forum`
- `sitemap.xml` — expandido (forum + profile)
- `package.json` — scripts `test:cifras`, `test:band`, `test` agregado
- `scripts/audit-chord-coverage.mjs` — auditoria de cobertura
- `scripts/fill-chord-gaps.mjs` — preenchimento automático
- `scripts/cifras-coverage.test.mjs` — testes Node
- `backend/migrations/001-003` — SQL aplicado no Supabase

## Memória atualizada
- `project_cifras_v2_substitui_v1.md` — marcado como CONCLUÍDO (cutover em 2026-05-29)
- `MEMORY.md` index — entrada atualizada

## Blockers
- **Bug #8** da fila: cifras compartilhadas entre instrumentos. Bloqueado esperando decisão A (manter design atual, cifra comum aos 3, só `chords` e `strumming` variam) ou B (refactor de schema pra `instruments.{inst}.content` separado, ~191 JSONs precisariam re-curadoria).
- **Bug E** (tablist 3 Baixo/Bateria não muda braço): precisa validar manualmente se ainda quebra após os fixes de aria-pressed (B/F). Hipótese: já resolvido junto.

## Como continuar na próxima sessão
1. Hard reload em produção (Ctrl+Shift+R), confirma `build 2026-05-29.07` no rodapé
2. Smoke test: tab Fórum embebida funciona, paginação `< 1 2 >` nas notícias responde, perfil do fórum edita/salva
3. Andre decide bug #8
4. (Opcional) Cleanup do mock antigo do fórum no `index.html`
