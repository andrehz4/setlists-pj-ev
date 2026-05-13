# HANDOFF · Setlists PJ + EV.

Atualizado em **2026-05-09**. Snapshot completo do projeto. Tudo aqui é versionado com o código. Ao abrir num novo chat, leia este arquivo primeiro.

---

## 1. Status atual: ONLINE

| Recurso | URL / Local | Status |
|---|---|---|
| Site live | https://setlists-pj-ev.pages.dev/ | OK |
| Repo Git | https://github.com/andrehz4/setlists-pj-ev | público |
| Pasta local | `C:\Gitlab_hz\pearljam\setlists-pj-ev` | OK |
| Deploy | Cloudflare Pages, push em `main` reimplanta em ~1 min | OK |
| HTTPS | Cloudflare auto | OK |
| Identidade git | `André <eng.andrehz@gmail.com>` (config global) | OK |
| GA4 | property `Site Pearl Jam`, ID `G-234ZL5MF0T` | OK |
| R2 áudio | bucket `setlists-pj-ev-audio`, ~5.8 GB de 10 GB | OK |
| Branch atual | `main`, último commit `0979454` | sincronizado |
| Lighthouse | A11y 100, SEO 100, Best Practices 96, Perf 52 | validado live 2026-05-08 (não revalidado pós-redesign Deep) |

## 2. O que é

Site estático single-file que cataloga shows do Pearl Jam + Eddie Vedder presenciados pelo dono (André). **28 shows** catalogados (25 presenciados + 3 extras de acervo), **~225 músicas únicas com interpretação crítica em inglês** (sprint i18n em curso, **73/221 = 33% também em PT**), **~795 parágrafos de análise show-específica (byShow)**, **15 análises de álbum** publicadas em português + 1 rascunho (Lost Dogs), 1 ensaio temático em rascunho (Covers), áudio dos shows quando disponível, fotos oficiais e pessoais, posters, vídeos, **5 revistas Deep** do Ten Club com **leitor 3D flip-page**.

Visual: **Ticket Archive** (papel kraft, perfurações, stubs de ingresso). Navegação por 8 tabs: Timeline, Ranking, Cobertura por álbum, Destaques, Buscar música, Raridades, Galeria, Deep.

## 3. Features ativas

### Core
- 28 shows em `SHOWS` (25 presenciados + 3 extras com `extra: true`)
- Setlists completos (full confidence em todos)
- Drawer com poster, fotos oficiais/pessoais, vídeos, setlist clicável, transcrição de áudio
- Filtros por artista (PJ / EV / Ambos) e ano
- Lightbox com carrossel
- Tema claro/escuro (default claro), `prefers-reduced-motion` respeitado globalmente
- Stats agregadas (total shows, músicas únicas, total cantado, anos, cidades)

### Conteúdo enriquecido
- **Letras** (`media/lyrics.json`): trechos curtos por música, inline no drawer. **Piloto bilíngue PT/EN** (commit `df532bb`): 3 músicas de Pacaembu (black, even flow, alive) com `LYRICS_PT` inline + variantes de exibição
- **Interpretações** (`media/interpretations.json`): ~1.05 MB, 221 entradas em inglês, **73 (33%) também em PT** após sprint i18n em curso. Inline no drawer + cards no Buscar (default abertos)
  - **Botão alterna PT/EN** quando ambos cadastrados; default em PT, fallback EN com nota "em inglês"
  - **UX drawer** (commit `3f483d6`): clicar no painel de letra/interpretação fecha o card
  - Suporta formato dual: string (universal) ou objeto `{text, byShow:{showId: paragraph}}`
  - **byShow 100% (28/28 shows, ~795 paragraphs)**: cobertura completa de todos os shows do projeto
    - 2005 (1): pj-2005-12-02 Pacaembu (27/27)
    - 2011 PJ20 BR (4 presenciados + 1 extra): pj-2011-11-03/04/06/09 + extra POA pj-2011-11-11
    - 2013 Lolla SAm (3): pj-2013-03-31 SP / 04-03 AR / 04-06 CL
    - 2015 Latin AM BR (5): pj-2015-11-11 POA / 11-14 SP / 11-17 Brasília / 11-20 BH / 11-22 RJ
    - 2018 PJ (2): pj-2018-03-21 Maracanã + 03-24 Lolla SP
    - 2024 Wrigley (2): pj-2024-08-29 + 08-31
    - EV solo 2014 (5): ev-2014-05-06/07/08 SP + 05-11/12 RJ
    - EV solo 2018 (3): ev-2018-03-28/29/30 SP
    - 2 extras de acervo: pj-2021-10-02 Dana Point Ohana + pj-2022-07-25 Amsterdam Ziggo Dome
  - **12 universal text entries adicionados** durante cobertura dos extras: 8 do Gigaton/Brad/Avocado pra Dana Point + 4 covers raros (Black Diamond KISS, Purple Rain Prince) e Binaural deep cuts (Nothing as It Seems, Alright) pra Amsterdam
  - **Único skip**: "I Want You So Hard" (cover Eagles of Death Metal, Paris-tribute 2015) em pj-2015-11-20 e pj-2015-11-22; sem universal text, pode adicionar depois
  - **Bug de apóstrofo/ponto/vírgula resolvido** (vários commits desta sessão): ~22 keys foram renomeados pra casar com `_lyricsNorm` que strippa esses caracteres. Lista: baba oriley, rockin in the free world, fuckin up, im open, satans bed, my fathers son, its ok, i wont back down, i wont hold on, brain of j, cant deny me, react respond, another brick in the wall part 2, wont tell, cant keep, driftin, im one, youve got to hide your love away, youre true, im so tired, isnt it a pity, dont be shy
  - **Sprint i18n PT em curso** (7 batches commitados):
    - batch 1 (`b6d48ed`): Pacaembu pt.1 (10 m): go, hail hail, animal, green disease, corduroy, given to fly, faithfull, untitled, mfc, porch
    - batch 2 (`4b646e0`): Pacaembu pt.2 (10 m): glorified g, do the evolution, modern girl, better man, man of the hour, i believe in miracles, last kiss, don't gimme no lip, rearviewmirror, save you
    - batch 3 (`385b8f6`): Pacaembu remainder + high-frequency (10 m): i got id, once, jeremy, yellow ledbetter, elderly woman, why go, unthought known, wishlist, just breathe, daughter
    - batch 4 (`36ede1d`): high-frequency cont (10 m): rockin in the free world, got some, sleeping by myself, not for you, save it for later, lukin, falling slowly, far behind, hard sun, release
    - batch 5 (`47863a9`): high-frequency cont (10 m): immortality, setting forth, mind your manners, society, guaranteed, sleepless nights, the fixer, state of love and trust, sirens, tuolumne
    - batch 6 (`82547b1`): high-frequency cont (10 m): cant keep, indifference, comatose, present tense, lightning bolt, smile, i am mine, crazy mary, sometimes, long nights
    - batch 7 (`0979454`): high-frequency cont (10 m): rise, without you, better days, youve got to hide your love away, ole, off he goes, in hiding, come back, comfortably numb, imagine
  - Padrão da tradução: `text_pt` espelha `text` universal; `byShow_pt` traduz cada show com mesmas keys do `byShow`. Citações de letra ficam em EN com gloss PT entre parênteses quando útil. Sem em-dashes
- **Análises de álbum** (`media/albums/*.md`): 15 docs longos em português + 1 rascunho. Modal fullscreen acessível pela tab Cobertura por álbum (botão "📖 Ler análise")
- **Ensaios temáticos** (`media/essays/*.md`): nova pasta criada pra documentos cross-cutting que não são de um álbum específico. Atualmente: 1 rascunho (Covers / reinterpretações)

### Áudio
- Player no rodapé do drawer; `preload="none"` (só puxa do R2 quando user clica)
- Áudio servido do R2 público (constante `R2_AUDIO_BASE`)
- Prefetch da próxima faixa via `<link rel=prefetch as=audio>`
- 19 shows com áudio (incluindo os 3 extras), ~600 MP3s, ~5.8 GB no R2
- **Transcrição de áudio**: bloco `<details>` colapsável "🎧 Transcrição do áudio (N faixas)" no drawer

### Buscar música
- Busca por substring no nome
- Cards com contagem, lista de shows onde tocou, **letra** (default open) e **interpretation** (default open)

### Raridades
- LuckGauge SVG donut com luck score baseado em frequência histórica
- Once-ever (1× na carreira), Ultra-raras (2-5×), Histograma de distribuição

### Destaques
- 9 cards de stats (música mais ouvida, in 80%+, show mais longo etc)
- Top 10 mais ouvidas (horizontal bar chart)
- Timeline de músicas-por-show (SVG area chart com aria-label)

### Galeria
- Grid de capas + Comunidade (fotos coletivas)
- Thumbs e headers keyboard-acessíveis

### Deep (revistas Ten Club): **REDESIGN 2026-05-09**
- **Leitor 3D flip-page** substituindo o scroll-snap horizontal antigo
- Cards 3D na grid: cover inclinada (rotateY -8°), miolo de páginas visível na lateral, hover com transform mais agressivo
- Reader como overlay full-screen (`role="dialog" aria-modal="true"`)
- **FLIP animation**: cover sai do lugar exato na grid, escala e flutua pro centro (~700ms cubic-bezier)
- **Page flip 3D em torno da lombada**: rotateY 0 → -180° (~750ms cubic-bezier)
- Sombra de curl que acompanha a página virando
- Page stacks visuais (1px lines): páginas lidas à esquerda, faltando à direita
- Idle sway animation (suave 8s cubic), respeita `prefers-reduced-motion`
- Backdrop com blur(6px) + spotlight gradient
- Top bar com back button + título + contador com progress bar (counter `01/12` + barra animada)
- Setas de navegação laterais (48×48px círculo, hover preenche com PJ vermelho)
- Tira de thumbnails embaixo (clique pula direto sem flip)
- Click zones laterais (38% width cada lado) sobre a revista
- Keyboard: ←/→/PageUp/PageDown/Space/Home/End/Esc
- Hint "← → virar página · esc fechar" no topo
- **Cores hardcoded em escopo local** (`--reader-ink`, `--reader-pj`, etc): backdrop é sempre escuro, então não pode depender de vars do tema (no claro elas viam pretas e sumiam no fundo). Setas têm `font-size: 22px` + `color: #fff` no hover pra contraste máximo
- 5 edições publicadas (Issues 8-12, 2011-2015), 164 páginas total, 48 MB JPGs no repo
- Para adicionar nova edição: `pip install --user pymupdf` + script PIL com quality=70

### Extras / acervo (rule 0)
- Infra completa: shows com `extra: true` ficam fora de `filteredShows()` (todas as stats automaticamente excluem)
- Bloco "Acervo · extras" no fim da Timeline com nota explicativa
- 3 extras publicados: pj-2011-11-11 (POA Beira-Rio), pj-2021-10-02 (Dana Point Ohana), pj-2022-07-25 (Amsterdam Ziggo Dome)

### Analytics (GA4)
- gtag.js no `<head>` com ID `G-234ZL5MF0T`
- 7 custom events: `tab_change`, `drawer_open`, `audio_play`, `audio_error`, `image_error`, `search` (debounced 800ms), `album_doc_open`
- Doc completa em `ANALYTICS.md`

### Segurança e SEO
- `_headers` com CSP completa, X-Frame-Options DENY, Permissions-Policy, etc
- `robots.txt` (Disallow `/media/`)
- `sitemap.xml` minimal
- Open Graph + Twitter card + canonical + theme-color + **og.jpg 1200×630**
- **Lighthouse SEO 100/100**

### Acessibilidade (WCAG 2.2 AA)
- **Lighthouse Accessibility 100/100** (validado em 2026-05-08, não revalidado pós-redesign Deep mas o novo reader integra com `_a11yOpenDialog`/`_a11yCloseDialog` + ESC topmost handler atualizado)
- 3 fases aplicadas em 2026-05-08 (detalhes em §7)
- **Reader Deep** integrado com helpers de a11y: focus-trap global pega `[role="dialog"][aria-modal="true"]`, ESC fecha (handler topmost atualizado), reduced-motion neutraliza flip animation pra snap instantâneo

## 4. Análises de álbum (status)

| Álbum | Ano | ID | Status | Tamanho |
|---|---|---|---|---|
| Ten | 1991 | `ten` | publicado | 35 KB |
| Vs. | 1993 | `vs` | publicado | 33 KB |
| Vitalogy | 1994 | `vitalogy` | publicado | 54 KB |
| No Code | 1996 | `nocode` | publicado | 59 KB |
| Yield | 1998 | `yield` | publicado | 62 KB |
| Binaural | 2000 | `binaural` | publicado | 53 KB |
| Riot Act | 2002 | `riotact` | publicado | 34 KB |
| Pearl Jam (Avocado) | 2006 | `pj2006` | publicado | 34 KB |
| Backspacer | 2009 | `backspacer` | publicado | 47 KB |
| Lightning Bolt | 2013 | `lightningbolt` | publicado | 27 KB |
| Gigaton | 2020 | `gigaton` | publicado (parcial, paste degradou) | 46 KB |
| Dark Matter | 2024 | `darkmatter` | publicado (parcial, paste degradou) | 45 KB |
| Into the Wild (EV) | 2007 | `intowild` | publicado (parcial, conclusão degradou) | 51 KB |
| Ukulele Songs (EV) | 2011 | `ukulele` | publicado (íntegro) | 33 KB |
| Earthling (EV) | 2022 | `earthling` | publicado (íntegro) | 35 KB |
| Lost Dogs | 2003 | `lostdogs` | rascunho salvo, aguardando revisão (não no `ALBUM_DOCS`) | 46 KB |

### Ensaios temáticos (não-álbum)

| Tópico | Local | Status | Tamanho |
|---|---|---|---|
| Covers / reinterpretações | `media/essays/covers.md` | rascunho salvo, paste com seções degradadas marcadas, sem rota no site ainda | 54 KB |

**Conclusões truncadas** (Gigaton, Dark Matter, Into the Wild): paste original entrou em loop de adjetivos repetidos. Pode-se repastear as conclusões em sessão futura.

**Como publicar Lost Dogs** (quando revisar): adicionar `'lostdogs'` ao Set `ALBUM_DOCS` em `index.html`. O botão "📖 Ler análise" aparece automaticamente.

**Como publicar ensaio Covers**: ainda não tem rota. Sugestão pra sessão futura: criar Set `ESSAYS_DOCS` similar a `ALBUM_DOCS`, com link de "📖 Ler ensaio" em alguma tab apropriada.

## 5. Estrutura de arquivos

```
setlists-pj-ev/
├── index.html              # ~504 KB, ~6900 linhas (HTML+CSS+JS+DADOS+lyrics)
├── _headers                # Cloudflare Pages headers (CSP, cache, security)
├── robots.txt
├── sitemap.xml
├── og.jpg                  # 61 KB, 1200×630 OG image
├── ANALYTICS.md
├── HANDOFF.md              # este arquivo
├── MEDIA_AUDIT_2026-04-29.md
├── media-manifest.json
├── README.txt
├── .gitignore              # exclui .claude/, node_modules/, lighthouse-*
└── media/
    ├── albums/             # 16 capas .jpg + 15 análises .md publicadas + 1 rascunho (lostdogs)
    ├── essays/             # NEW: ensaios temáticos cross-cutting (1 rascunho: covers.md)
    ├── lyrics.json         # 7.5 KB
    ├── interpretations.json  # ~700 KB, ~225 entradas, byShow 100% nos 28 shows
    ├── deep/               # 5 edições, 164 JPGs, 48 MB
    ├── pj-YYYY-MM-DD/      # 19 shows PJ
    └── ev-YYYY-MM-DD/      # 8 shows EV
```

Tamanho total `media/`: ~270 MB.

## 6. Pendências (em ordem de prioridade)

### Próxima sessão (precisa input do user)
1. **Sprint i18n PT, continuar**: 73/221 (33%) feitos em 7 batches. Restam 148 entradas sem `text_pt`. Próximas candidatas naturais (3 byShow entries cada, em ordem alfabética da fila atual): `should i stay or should i go`, `world wide suicide`, `wma`, `down`, `severed hand`, mais o resto da cauda. Padrão é batch de 10
2. **"I Want You So Hard"** (cover Eagles of Death Metal, deployment Paris-tribute 2015): falta universal text. Apareceu em pj-2015-11-20 BH e pj-2015-11-22 RJ. Skipado pra não criar entrada incompleta; se quiser, eu redijo universal + byShow nos 2 shows
3. **Repaste das conclusões truncadas**: Gigaton, Dark Matter, Into the Wild tiveram paste degradado. Se quiser repastear só a Conclusão, eu acrescento na seção "Conclusão" dos respectivos `.md`
4. **Lost Dogs review + publish**: rascunho em `media/albums/lostdogs.md`. Revisar e adicionar `'lostdogs'` ao `ALBUM_DOCS` pra ativar
5. **Covers essay review + roteiro de publicação**: rascunho em `media/essays/covers.md` com seções degradadas marcadas. Decidir como expor no site (criar Set `ESSAYS_DOCS`? linkar de Cobertura por álbum?)

### Decisões pendentes (precisam autorização do dono)
- **P2-02 Mover Deep pra R2**: 48 MB de JPGs no repo poderiam estar no R2. Reduz repo de ~270 MB pra ~220 MB e acelera deploys. Requer: (a) `rclone copy media/deep r2-setlists:setlists-pj-ev-audio/deep/`, (b) ajustar paths em `renderDeep`/`_deepOpenReader` pra usar `R2_AUDIO_BASE + "/deep/" + ...`. Nota: agora que o reader foi redesenhado, os paths estão concentrados em `_deepPageUrl()` (uma função só), então a mudança fica fácil
- **P2-03 GA4 + LGPD**: GA4 carrega sem banner de consent. Opções: (a) banner mínimo com `gtag('consent', 'default', {analytics_storage: 'denied'})`, (b) trocar pra **Cloudflare Web Analytics** (sem cookies, GDPR/LGPD-safe). Recomendo (b)
- **Performance**: Lighthouse Performance 52/100. Maior peso restante: 650ms de "unused JavaScript" do Google Tag Manager. Resolve com (b) acima

### Validação manual (precisa ferramenta + você)
- **Revalidar Lighthouse pós-redesign Deep**: o redesign não foi auditado ainda. Sobe servidor local, roda Lighthouse na live, valida que A11y continua 100 e que o redesign não regrediu Best Practices/SEO
- **NVDA (Windows) ou VoiceOver (Mac/iOS)**: testar fluxo real do Deep reader em SR. Tab navigation, ESC, click zones, ler counter aria-live
- **Lighthouse mobile** (não rodei, só desktop)
- **Browser stack**: testar redesign Deep em Safari iOS, Chrome Android, Firefox

### Pendentes legados (mídia, infra)
- Procurar fotos pessoais antigas (2011-2015) em outro PC
- Importar 12 arquivos do Drive (`MEDIA_AUDIT_2026-04-29.md`)
- ZIP backup local + SHA-256 antes de qualquer formatação
- Domínio custom no Cloudflare Pages
- `pj-2024-08-31/poster-1.jpg` falta (manifest declara 2 posters)
- Deletar repo antigo `azimermann4/setlists-pj-ev` (manual via web)

## 7. Sprint de acessibilidade (3 fases + vistoria, 2026-05-08)

### Fase 1: Fundação ARIA (commit `63bb2c4`)
- Skip-link, landmarks, tabs WAI-ARIA, dialogs com `role="dialog"`/`aria-modal="true"`/foco-trap, helpers `_a11yOpenDialog`/`_a11yCloseDialog`, `aria-pressed` nos toggles, `aria-label` em botões de ícone, `aria-live="polite"` em search/player/counters, alt dinâmico no lightbox/media-panel, cards/photos/videos/deep como `role="button"` keyboard-acessíveis, focus-ring `*:focus-visible` por tema

### Fase 2: Polimento (commit `63bb2c4`)
- aria-live na filter-bar e boot-overlay, fix `_mpLoad`, code review do fix `978278b`

### Fase 3: Polish profissional sem mexer em layout/cores (commit `27debb9`)
- `lang="en"` automático em itálicos com palavras funcionais inglesas
- Transcrição de áudio (WCAG 1.2.1) com `<details>` colapsável
- `prefers-reduced-motion` global @media nuclear neutralizando 40+ transitions e 28+ animations
- SVGs acessíveis (LuckGauge com role/title/desc, chart-svg com aria-label)

### Sprint vistoria 2 + Lighthouse fixes (commits `d50aec1`, `81f718b`, `fdeb721`)
- aria-prohibited-attr fix, label-content-name-mismatch fix, audio preload="none", ESC topmost handler, JPGs Deep -20%, AbortController em fetch interpretations, audio-player aria-describedby, console.warn → GA4 events

### Métricas finais (2026-05-08, pré-redesign Deep)
| Métrica | Valor |
|---|---|
| Lighthouse Accessibility | **100/100** |
| Lighthouse SEO | **100/100** |
| Lighthouse Best Practices | 96/100 |
| Lighthouse Performance | 52/100 |
| Em-dashes em conteúdo | 0 |
| `outline:none` legados | 0 |

## 7.1. A11y, convenções e helpers

- **Helper de dialog**: `_a11yOpenDialog(el, focusTarget)` e `_a11yCloseDialog(el)`. Foco-trap global pega `[role="dialog"][aria-modal="true"]:not([hidden])`. Padrão usado pelo drawer, lightbox, media-panel, album-modal, lyrics-panel, **e o novo Deep reader**
- **ESC topmost** (commit `81f718b` + atualização `6ca0f0e` pra incluir Deep reader): ordem de fechamento por z-index/precedência: lightbox > media-panel > album-modal > drawer > deep-reader-stage. Cada handler local foi removido; o handler global topmost é a única source of truth
- **Tabs**: `role="tab"/aria-selected/aria-controls/tabindex` no botão, `role="tabpanel"/aria-labelledby/tabindex/hidden` na section. `activateTab()` cuida do resto
- **Botões com ícone único**: sempre `aria-label` no `<button>` e `<span aria-hidden="true">EMOJI</span>` por dentro
- **Toggles**: `aria-pressed="true|false"` sincronizado com classe `.active`
- **aria-label em elementos clicáveis**: começar com texto visível (WCAG 2.5.3 Label in Name)
- **Não usar aria-label em `<div>` sem role**: Lighthouse rejeita
- **Imagens**: alt sempre descritivo. Para mudança dinâmica, atualizar `img.alt` no load
- **Foco**: `*:focus-visible` define o ring; nunca `outline: none` sem providenciar substituto
- **`lang="en"`**: aplicar em qualquer container com texto em inglês; o parser MD faz isso automaticamente nos itálicos `*"..."*`

## 8. Convenções importantes

- **NÃO USAR EM-DASH (travessão longo) em conteúdo visível do site**. Regra obrigatória do dono. Aplicada em todos os 15 docs de álbum publicados, no rascunho do Lost Dogs, no ensaio de Covers, em interpretations.json, lyrics.json, notes de SHOWS, ANALYTICS.md, HANDOFF.md
- **Extras nunca entram nas stats**: rule 0. `filteredShows()` exclui `extra:true` automaticamente
- **Visibilidade do repo**: público (consciente)
- **Identidade git**: `eng.andrehz@gmail.com`
- **`.claude/`, `node_modules/`, `lighthouse-*`**: ignorados pelo git
- **Animações**: respeitam `prefers-reduced-motion` globalmente
- **Tema padrão**: light com toggle pra dark
- **`gh` CLI tem 2 contas**: `andrehz4` (este projeto) e `terra-gentil`. Antes de push, `gh auth status` e `gh auth switch -h github.com -u andrehz4` se a ativa for a errada. 403 no push = conta errada
- **Recaps fim de turno**: usuário pediu pra cortar (auto-memory `feedback_no_recaps.md`). Comunicação enxuta, sem balanços de "o que foi feito" salvo se ele pedir explicitamente

## 9. Cloudflare R2 (áudio)

| | |
|---|---|
| Bucket | `setlists-pj-ev-audio` |
| Region | ENAM |
| URL pública | `https://pub-4d99051b225d492fbf4ac3bfdbef7de4.r2.dev` |
| S3 endpoint | `https://c071f317813dd06ec00befa13d5c5684.r2.cloudflarestorage.com` |
| Account ID | `c071f317813dd06ec00befa13d5c5684` |
| Tamanho atual | ~5.8 GB (603 objetos) |

Estrutura: `<show-id>/<filename>.mp3`. Player lê constante `R2_AUDIO_BASE` no topo do bloco DATA do `index.html`.

Subir mais áudios:
```powershell
rclone copy "<pasta-local>" "r2-setlists:setlists-pj-ev-audio/<show-id>/" --s3-no-check-bucket --progress
```

API Token salvo no `%APPDATA%\rclone\rclone.conf`, perfil `r2-setlists`.

## 10. GitHub e GA4 (notas de migração)

- Repo migrado de `azimermann4/setlists-pj-ev` pra `andrehz4/setlists-pj-ev` em 2026-05-07
- Build settings do Pages: Framework preset `None`, build command vazio, output `/`
- GA4 property criada em 2026-05-08, ID `G-234ZL5MF0T`

## 11. Como rodar localmente

```bash
cd setlists-pj-ev
python -m http.server 8000
# abrir http://localhost:8000
```

## 12. Como editar conteúdo

**Adicionar/editar shows ou setlists**: editar objeto `SHOWS` em `index.html` (procura por `const SHOWS = [`). Cada show tem: `id`, `artist`, `date`, `venue`, `city`, `tour`, `confidence`, `source`, `songs`, opcionais `note`, `notes_audio`, `soundcheck`, `not_played`, `special`, `extra`.

**Adicionar interpretação**: editar `media/interpretations.json` direto. Formato: string (universal) ou objeto `{text, byShow:{showId: paragraph}}`. Para byShow novo, padrão do projeto é: `text` universal + `byShow.{show-id}` específico do show. Lookup faz lyrnorm: lowercase + strip `[^a-z0-9 ]`. **Keys no JSON têm que ser lyrnorm-friendly** (sem apóstrofo, ponto, vírgula).

**Adicionar análise de álbum**:
1. Salvar em `media/albums/<album.id>.md` (sem em-dashes)
2. Adicionar `'<album.id>'` ao Set `ALBUM_DOCS` no `index.html`
3. Commitar

**Adicionar revista Deep**:
1. `pip install --user pymupdf`
2. Rasterizar PDF a 150 DPI, JPEG quality 70
3. Adicionar entry em `DEEP_ISSUES`: `{ id, num, title, year, pages, cover, tag }` (campos `num` e `tag` foram adicionados no redesign de 2026-05-09 pra exibição na grid 3D)

**Adicionar byShow pra um show**: padrão é Python script que carrega `media/interpretations.json` com `OrderedDict`, modifica os keys necessários, dump com `json.dumps(d, indent=2, ensure_ascii=False)`, replace `\n` → `\r\n`. Vários scripts dessa sessão na referência git history.

**Publicar**:
```bash
git add .
git commit -m "<msg>"
git push origin main
```

## 13. Camadas de backup

| Camada | Onde | Status |
|---|---|---|
| 1. Cópia local | `C:\Gitlab_hz\pearljam\setlists-pj-ev` | OK |
| 2. Git remoto | github.com/andrehz4/setlists-pj-ev | OK |
| 3. Site live | setlists-pj-ev.pages.dev | OK |
| 4. R2 áudio | bucket `setlists-pj-ev-audio` | OK |
| 5. ZIP local em HD/pendrive | (não feito) | recomendado antes de formatar |
| 6. Cópia em outra nuvem | (não feito) | opcional |

## 14. Histórico de commits relevantes (sessão 2026-05-09)

```
0979454  i18n(interp): traducao PT batch 7 - 10 musicas (high-frequency cont)
82547b1  i18n(interp): traducao PT batch 6 - 10 musicas (high-frequency cont)
72be0a9  docs(handoff): registra sprint i18n PT (5 batches, 24%) e fix do count-up
47863a9  i18n(interp): traducao PT batch 5 - 10 musicas (high-frequency cont)
3f49076  fix(stats): count-up tween virava negativo gigante (perf.now() em vez do timestamp do rAF)
36ede1d  i18n(interp): traducao PT batch 4 - 10 musicas (high-frequency cont)
385b8f6  i18n(interp): traducao PT batch 3 - 10 musicas (Pacaembu remainder + high-frequency)
4b646e0  i18n(interp): traducao PT batch 2 - 10 musicas Pacaembu (parte 2)
b6d48ed  i18n(interp): traducao PT batch 1 - 10 musicas Pacaembu (parte 1)
3f483d6  ux(drawer): clicar no painel de letra/interpretacao fecha o card
df532bb  feat(i18n): piloto bilingue PT/EN para letras e interpretacoes (Pacaembu 2005)
794ddcf  docs(handoff): remove em-dashes residuais
bf122c8  docs(handoff): rewrite consolidado da sessao 2026-05-09
d636c26  docs(handoff): byShow 100% completo (28/28 shows, ~795 paragraphs)
24d3a0e  feat(content): byShow do pj-2022-07-25 (Amsterdam Ziggo Dome extra) + 4 universal text
09f88f0  feat(content): byShow do pj-2021-10-02 (Dana Point Ohana extra) + 8 universal text
1dc23a8  docs(handoff): 25/28 shows com byShow
fabb9dc  feat(content): byShow do ev-2018-03-30 (Citibank SP n3 final, Black com Sergio Vedder)
c181cc1  feat(content): byShow do ev-2018-03-29 (Citibank SP n2)
fe83502  feat(content): byShow do ev-2018-03-28 (Citibank SP n1, Wildflowers world debut)
3964126  feat(content): byShow do ev-2014-05-12 (Citibank RJ n2, Slater no encore)
2b0a065  feat(content): byShow do ev-2014-05-11 (Citibank RJ n1)
3a8bdd7  feat(content): byShow do ev-2014-05-08 (Citibank SP n3)
8d7f13d  feat(content): byShow do ev-2014-05-07 (noite das raridades)
f7d97ca  feat(content): byShow do ev-2014-05-06 + 8 keyfixes apostrofo EV
c876a76  feat(content): byShow do pj-2024-08-31 (Wrigley 2)
da2ef45  feat(content): byShow do pj-2024-08-29 + 3 keyfixes
e6495f8  feat(content): byShow do pj-2018-03-24 (Lolla Brasil SP)
41b660f  feat(content): byShow do pj-2018-03-21 (Maracana RJ) + key fix cant deny me
d6240cf  docs(handoff): 2015 completo
3134145  feat(content): byShow do pj-2015-11-22 + 2015 completo
32c8e73  feat(content): byShow do pj-2015-11-20
9135db2  feat(content): byShow do pj-2015-11-17 (35/35)
1b5d76a  fix(interpretations): rename 10 keys com apostrofo/ponto pra forma normalizada
18c0c9f  feat(content): byShow do pj-2015-11-14 (32/33, pos-Paris)
f35a054  feat(content): byShow do pj-2015-11-11 (33/34)
ea7e417  fix(deep): cores claras hardcoded no reader (visivel em ambos temas)
6ca0f0e  feat(deep): redesign do leitor com flip 3D e FLIP animation
1e07249  docs(handoff): registra 2013 completo
6c9e12f  feat(content): byShow do pj-2013-04-06 (Lolla CL Santiago)
583505b  feat(content): byShow do pj-2013-04-03 (Lolla AR Buenos Aires)
ab6e773  feat(content): byShow do pj-2013-03-31 (Lolla Brasil SP)
288ab7d  docs(handoff): atualiza status de byShow e bug de apostrofo
e84f8f2  feat(content): byShow do pj-2011-11-11 (Beira-Rio extra)
c6ca87e  docs(essay): salva rascunho do ensaio sobre covers do Pearl Jam
86e8fbb  feat(content): byShow do pj-2011-11-09 (Curitiba Vila Capanema)
05e0afe  feat(content): byShow do pj-2011-11-06 (Rio Apoteose)
2d34fa0  docs(album): salva rascunho do Lost Dogs (2003)
2b98c8c  feat(content): byShow do pj-2011-11-04 (Morumbi noite 2)
aeeaddc  feat(content): byShow do pj-2011-11-03 (Morumbi 1)
6d0542c  feat(content): expande byShow do pj-2005-12-02 para cobertura 27/27
```

### Commits anteriores (referência histórica, sessão 2026-05-08)
```
fdeb721  perf(deep): re-comprime 164 JPGs do flipbook a quality=70 (-20%)
81f718b  fix: aplica P1 e P2 da sprint vistoria 2
355cffa  chore(gitignore): exclui node_modules e relatorios lighthouse
092475f  chore(gitignore) + HANDOFF registra 100/100 a11y
d50aec1  fix(a11y): resolve 2 falhas do Lighthouse audit (96→100)
27debb9  feat(a11y): sprint fase 3 - lang=en, transcricao audio, reduced-motion, SVG
b736a54  feat(content): publica 3 analises de albuns solo do Eddie Vedder
63bb2c4  feat(a11y+content): sprint WCAG 2.2 AA fase 1+2 + 3 extras (POA/Dana Point/Amsterdam)
df62ff4  feat(content): publica 4 analises de album, 5 revistas Deep e og.jpg
```

---

## 15. Resumo da sessão 2026-05-09

Esta sessão entregou cinco blocos grandes:

1. **byShow 0% → 100%**: 28/28 shows agora têm parágrafos críticos específicos por show (~795 paragraphs no total). Antes da sessão, só 5 músicas do pj-2005-12-02 tinham. A expansão cobriu 2005, 2011 (4+1 extra), 2013 (3), 2015 (5), 2018 (2 PJ + 3 EV), 2024 (2), EV solo 2014 (5), e os 2 extras de acervo (Dana Point + Amsterdam). Estilo segue o pilot original do Pacaembu: data + venue + slot + função estrutural na noite, sempre em inglês.

2. **Deep reader redesign**: leitor antigo (scroll-snap horizontal inline na aba) substituído por overlay full-screen 3D com FLIP animation pra entrada e page flip 3D em torno da lombada. CSS+JS portado de protótipo React (vindo do Claude Design / claude.ai/design) pra vanilla JS dentro do `index.html` existente. Integrado com `_a11yOpenDialog`/`ESC topmost`/`prefers-reduced-motion`. Bug de cores escuras no claro corrigido (escopo local `--reader-*`).

3. **Bug de keys resolvido + 12 universals novos**: apóstrofos, pontos e vírgulas em keys do interpretations.json estavam silenciosamente quebrando o lookup do `_lyricsNorm` (que strippa esses caracteres). 22 keys renomeados em ondas conforme a expansão progrediu. 12 entradas universais novas adicionadas pra Gigaton (8 tracks), Brad cover, Avocado track, Binaural deep cuts, e covers raros de KISS/Prince.

4. **Sprint i18n PT (7 batches)**: piloto bilíngue (`df532bb`) introduz `LYRICS_PT` inline, formato dual `{text, text_pt, byShow, byShow_pt}` em interpretations.json, botão alternando PT/EN e UX onde clicar no painel fecha o card (`3f483d6`). Sete batches commitados (b6d48ed, 4b646e0, 385b8f6, 36ede1d, 47863a9, 82547b1, 0979454) trouxeram **73/221 músicas (33%)** com `text_pt` completo + `byShow_pt` espelhando os shows do byShow EN.

5. **Bug fix do count-up tween (`3f49076`)**: stats no header (Shows, Músicas únicas, etc.) viravam números negativos enormes (`-2.370 SHOWS`) após visitar a aba Raridades. Causa: o tick do tween usava o timestamp do callback de rAF e comparava com `performance.now()` capturado fora; em ambientes onde os clocks ficam dessincronizados, `p` virava negativo, `Math.pow(1-p, 3)` explodia, e o multiplicador final era enorme negativo. Fix: ler `performance.now()` dentro do tick e clampar `p` em [0, 1].

Plus: 2 documentos em rascunho salvos (Lost Dogs em `media/albums/lostdogs.md`, Covers em `media/essays/covers.md`), nova pasta `media/essays/` criada, HANDOFF reescrito.

**Próxima sessão sugerida**: continuar sprint i18n (próximo batch 8, restam 148 músicas sem `text_pt`, agora caindo pra deep cuts com 3 ou menos byShow entries cada); revisar Deep redesign no live (Lighthouse + browsers); revisar/publicar Lost Dogs; decidir como linkar o ensaio Covers; ou repastear conclusões dos álbuns truncados.

---

*Atualizado por sessão Claude Code em 2026-05-09 (HEAD `0979454`).*
