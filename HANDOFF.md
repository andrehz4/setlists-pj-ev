# HANDOFF · Setlists PJ + EV

Atualizado em **2026-05-08**. Snapshot completo do projeto. Tudo aqui é versionado com o código. Ao abrir num novo chat, leia este arquivo primeiro.

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
| Branch atual | `main`, último commit `fdeb721` | sincronizado |
| Lighthouse | A11y 100, SEO 100, Best Practices 96, Perf 52 | validado live 2026-05-08 |

## 2. O que é

Site estático single-file que cataloga shows do Pearl Jam + Eddie Vedder presenciados pelo dono (André). **28 shows** catalogados (25 presenciados + 3 extras de acervo), **~208 músicas únicas**, **~190 interpretações críticas em inglês**, **15 análises de álbum** em português, áudio dos shows quando disponível, fotos oficiais e pessoais, posters, vídeos, **5 revistas Deep** do Ten Club.

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
- **Letras** (`media/lyrics.json`): trechos curtos por música, inline no drawer
- **Interpretações** (`media/interpretations.json`): ~620 KB, ~190 entradas em inglês. Inline no drawer + cards no Buscar (default abertos)
  - Suporta formato dual: string (universal) ou objeto `{text, byShow:{showId: paragraph}}`
  - byShow completo em **2005 + 2011 PJ20 BR + 2013 Lolla SAm + 2015 Latin AM**: pj-2005-12-02 (27/27), pj-2011-11-03/04/06/09 (presenciados) + 2011-11-11 extra, pj-2013-03-31/04-03/04-06 (Lolla), pj-2015-11-11/14/17/20/22 (BR). Total: ~420 byShow paragraphs em 14 shows
  - **Bug de apóstrofo/ponto resolvido (commit 1b5d76a)**: 10 keys foram renomeadas removendo apóstrofo/ponto pra casar com `_lyricsNorm` (baba oriley, rockin in the free world, fuckin up, im open, satans bed, my fathers son, its ok, i wont back down, i wont hold on, brain of j). Shows posteriores podem usar todas essas músicas sem skip
- **Análises de álbum** (`media/albums/*.md`): 15 docs longos em português. Modal fullscreen acessível pela tab Cobertura por álbum (botão "📖 Ler análise")

### Áudio
- Player no rodapé do drawer; `preload="none"` (só puxa do R2 quando user clica)
- Áudio servido do R2 público (constante `R2_AUDIO_BASE`)
- Prefetch da próxima faixa via `<link rel=prefetch as=audio>`
- 19 shows com áudio (incluindo os 3 extras), ~600 MP3s, ~5.8 GB no R2
- **Transcrição de áudio**: bloco `<details>` colapsável "🎧 Transcrição do áudio (N faixas)" no drawer. Aparece automaticamente em shows com áudio. Notas detalhadas pros 3 extras

### Buscar música
- Busca por substring no nome
- Cards com contagem, lista de shows onde tocou, **letra** (default open) e **interpretation** (default open)

### Raridades
- LuckGauge SVG donut com luck score baseado em frequência histórica (com `<title>`/`<desc>` acessíveis)
- Once-ever (1× na carreira), Ultra-raras (2-5×), Histograma de distribuição
- Listagem ordenada de raridades pegas

### Destaques
- 9 cards de stats (música mais ouvida, in 80%+, show mais longo etc)
- Top 10 mais ouvidas (horizontal bar chart)
- Timeline de músicas-por-show (SVG area chart com aria-label)

### Galeria
- Grid de capas + Comunidade (fotos coletivas)
- Thumbs e headers keyboard-acessíveis

### Deep (revistas Ten Club)
- Tab com flipbook horizontal scroll-snap
- 5 edições publicadas (Issues 8-12, 2011-2015), **164 páginas total, 48 MB**
- Navegação: scroll horizontal, setas/PageUp/PageDown/Home/End por teclado
- JPGs a 150 DPI quality 70 (re-comprimidos em sprint vistoria 2)
- Para adicionar nova edição: `pip install --user pymupdf` + script PIL com quality=70

### Extras / acervo (rule 0)
- Infra completa: shows com `extra: true` ficam fora de `filteredShows()` (todas as stats automaticamente excluem)
- Bloco "Acervo · extras" no fim da Timeline com nota explicativa
- 3 extras publicados: pj-2011-11-11 (POA Beira-Rio, 32 faixas), pj-2021-10-02 (Dana Point Ohana, 24 faixas), pj-2022-07-25 (Amsterdam Ziggo Dome, 21 faixas com covers raros KISS + Prince)

### Analytics (GA4)
- gtag.js no `<head>` com ID `G-234ZL5MF0T`
- `window.track()` wrapper
- 7 custom events: `tab_change`, `drawer_open`, `audio_play`, `audio_error`, `image_error`, `search` (debounced 800ms, min 2 chars), `album_doc_open`
- Doc completa em `ANALYTICS.md`

### Segurança e SEO
- `_headers` com CSP completa (allowlist Google Tag, R2, Google Fonts), X-Frame-Options DENY, Permissions-Policy, X-Content-Type-Options, Referrer-Policy + cache rules por path
- `robots.txt` (Disallow `/media/`)
- `sitemap.xml` minimal
- Open Graph + Twitter card + canonical + theme-color + **og.jpg 1200×630** (identidade Ticket Archive)
- **Lighthouse SEO 100/100**

### Acessibilidade (WCAG 2.2 AA)
- **Lighthouse Accessibility 100/100** validado no live
- 3 fases aplicadas em 2026-05-08 (detalhes em §7)

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
| Lost Dogs | 2003 | `lostdogs` | rascunho salvo, aguardando revisão (não no `ALBUM_DOCS`) | 45 KB |

### Ensaios temáticos (não-álbum)

| Tópico | Local | Status | Tamanho |
|---|---|---|---|
| Covers / reinterpretações | `media/essays/covers.md` | rascunho salvo, paste com seções degradadas marcadas, sem rota no site ainda | 52 KB |

**Conclusões truncadas** (Gigaton, Dark Matter, Into the Wild): paste original entrou em loop de adjetivos repetidos + texto não relacionado. Salvei só a parte coerente. Pode-se repastear as conclusões em sessão futura.

Padrão pra novo álbum: paste do user, eu removo em-dashes (regra do projeto), salvo em `media/albums/<id>.md`, adiciono `<id>` ao Set `ALBUM_DOCS` no `index.html`. Botão "📖 Ler análise" aparece automaticamente.

## 5. Estrutura de arquivos

```
setlists-pj-ev/
├── index.html              # 482 KB, ~6400 linhas (HTML+CSS+JS+DADOS+lyrics)
├── _headers                # Cloudflare Pages headers (CSP, cache, security)
├── robots.txt
├── sitemap.xml
├── og.jpg                  # 61 KB, 1200×630 OG image (Ticket Archive identity)
├── ANALYTICS.md
├── HANDOFF.md              # este arquivo
├── MEDIA_AUDIT_2026-04-29.md
├── media-manifest.json
├── README.txt
├── .gitignore              # exclui .claude/, node_modules/, lighthouse-*
└── media/
    ├── albums/             # 16 capas .jpg + 15 análises .md
    ├── lyrics.json         # 7.5 KB
    ├── interpretations.json  # 396 KB, ~190 entradas
    ├── deep/               # 5 edições, 164 JPGs, 48 MB
    │   ├── deep-08/        # 51 páginas (Issue 8, 2011 - número duplo)
    │   ├── deep-09/        # 28 páginas (2012)
    │   ├── deep-10/        # 28 páginas (2013)
    │   ├── deep-11/        # 28 páginas (2014)
    │   └── deep-12/        # 29 páginas (2015)
    ├── pj-YYYY-MM-DD/      # 19 shows PJ (16 presenciados + 3 extras só áudio)
    │   ├── poster.jpg
    │   ├── photo-N.jpg + thumb
    │   ├── mine/photo-N.jpg + thumb
    │   └── videos/video-N.mp4
    └── ev-YYYY-MM-DD/      # 8 shows EV
```

Tamanho total `media/`: ~270 MB (a maior parte: posters/photos dos shows + Deep magazines).

## 6. Pendências (em ordem de prioridade)

### Próxima sessão (precisa input do user)
1. **byShow expansion**: 2005 + 2011 + 2013 + 2015 completos (14 shows, ~420 paragraphs). Próximos shows: 2018 (3 shows BR + Lolla), 2024 (2 shows Wrigley), EV solo 2014 (5 noites Citibank Hall) e 2018 (3 noites). Falta universal text pra "I Want You So Hard" (cover Eagles of Death Metal, deployment de Paris-tribute em 2015) que apareceu em 11-20 BH e 11-22 RJ — skipado até paste universal
2. **Repaste das conclusões truncadas**: Gigaton, Dark Matter, Into the Wild tiveram paste degradado. Se quiser repastear só a Conclusão, eu acrescento na seção "Conclusão" dos respectivos `.md`
3. **EV solo extras**: faltam pastes de EV solo de outros shows ou releases (se houver)

### Decisões pendentes (precisam autorização do dono)
- **P2-02 Mover Deep pra R2**: 48 MB de JPGs no repo poderiam estar no R2 (já tem bucket configurado pra áudio). Reduz repo de ~270 MB pra ~220 MB e acelera deploys. Requer: (a) `rclone copy media/deep r2-setlists:setlists-pj-ev-audio/deep/`, (b) ajustar `cover` e `<img src=>` em `renderDeep`/`renderDeepReader` pra usar `R2_AUDIO_BASE + "/deep/" + ...`. Não fiz por mexer em paths em produção sem aviso
- **P2-03 GA4 + LGPD**: GA4 carrega sem banner de consent. Opções: (a) banner mínimo com `gtag('consent', 'default', {analytics_storage: 'denied'})` que vira `granted` ao aceitar (UI visível, +20 linhas de CSS+JS), (b) trocar pra **Cloudflare Web Analytics** (sem cookies, GDPR/LGPD-safe por design, ativar no dashboard do CF). Recomendo (b) pra simplicidade
- **Performance**: Lighthouse Performance 52/100. Maior peso restante: 650ms de "unused JavaScript" do Google Tag Manager. Resolve com (b) acima

### Validação manual (precisa ferramenta + você)
- **NVDA (Windows) ou VoiceOver (Mac/iOS)**: testar fluxo real de SR. Lighthouse pega 95% dos casos mas não substitui teste com humano usando SR
- **Lighthouse mobile** (não rodei, só desktop)
- **Browser stack**: testar em Safari iOS, Chrome Android, Firefox

### Pendentes legados (mídia, infra)
- Procurar fotos pessoais antigas (2011-2015) em outro PC
- Importar 12 arquivos do Drive (`MEDIA_AUDIT_2026-04-29.md`)
- ZIP backup local + SHA-256 antes de qualquer formatação
- Domínio custom no Cloudflare Pages
- `pj-2024-08-31/poster-1.jpg` falta (manifest declara 2 posters)
- Deletar repo antigo `azimermann4/setlists-pj-ev` (manual via web — `gh` local logada como andrehz4)

## 7. Sprint de acessibilidade (3 fases + vistoria, 2026-05-08)

### Fase 1: Fundação ARIA (commit `63bb2c4`)
- Skip-link "Pular para o conteúdo", landmark `<main id="main">`, `<header role="banner">`
- Tabs com pattern WAI-ARIA completo: `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, roving tabindex, navegação setas/Home/End
- Sections de view com `role="tabpanel"`, `aria-labelledby`, atributo `hidden` nos inativos
- 5 dialogs (drawer, lightbox, media-panel, album-modal, lyrics-panel) com `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, foco-trap global, save/restore de foco via helpers `_a11yOpenDialog`/`_a11yCloseDialog`
- `aria-pressed` nos toggles (theme, filter chips, gallery filters, play/pause)
- `aria-label` em todos os botões de ícone único; `<span aria-hidden="true">` envolvendo emojis decorativos
- `aria-live="polite"` em search-results, song-name do player, counters dos viewers
- Alt dinâmico no lightbox/media-panel; alt rico nas fotos da galeria (data + venue + cidade)
- Cards da timeline + photo wrappers + video cards + deep cards + gallery thumbs/headers = `role="button"` keyboard-acessíveis (Enter/Space)
- Setlist `<li>` com áudio = `role="button"` + `aria-label="Tocar X"` + Enter/Space
- Toggles letra/interpretation = `role="button"` + `aria-expanded` sincronizado
- Deep flipbook: container com `role="region"` + `tabindex="0"` + setas/PageUp/PageDown/Home/End
- Stats-strip: cada stat com texto natural ("25 Shows") como nome acessível
- Boot overlay: `aria-busy="true"` durante carga, vira `false` no final, foco vai pro `<main>` ao terminar
- Focus ring `*:focus-visible` por tema (PJ no claro, EV no escuro)
- Helpers: `.visually-hidden`, `_a11yOpenDialog`, `_a11yCloseDialog`, `_apSetPlayState`
- Removidos 3 `outline:none` legados (search-input, .media-panel video, .ap-progress)

### Fase 2: Polimento (commit `63bb2c4` continuação)
- aria-live na filter-bar anuncia "Filtro atualizado: X, ano Y. N shows"
- aria-live no boot-overlay anuncia status durante carregamento
- Bug bônus: `_mpLoad` removido `{ once: true }` (handler é trocado a cada load via `wrap._mpZoomHandler`)
- Code review do fix `978278b` do lightbox confirmou higienização completa do estado

### Fase 3: Polish profissional sem mexer em layout/cores (commit `27debb9`)
- **`lang="en"` automático**: parser MD detecta itálicos com palavras funcionais em inglês (the, you, I, are, etc.) e envolve em `<em lang="en">`. Letras (`lyrics-body` + inline drawer), interpretações (drawer + meta) e `lyric-row` ganharam `lang="en"`. SR em PT-BR pronuncia inglês corretamente
- **Transcrição de áudio (WCAG 1.2.1)**: novo campo opcional `notes_audio` no schema de shows, renderizado no drawer como `<section role="region">` com `<details>` colapsável "🎧 Transcrição do áudio (N faixas)". Aparece automaticamente em shows com áudio. Preenchido pros 3 extras com notas detalhadas
- **`prefers-reduced-motion` global**: `@media` nuclear neutraliza todas as 40 transitions + 28 animations + scroll smooth. Só ativa pra usuários com pref no OS
- **SVGs acessíveis**: LuckGauge ganhou `role="img"` + `<title>` + `<desc>` (com classificação e contexto). Chart-svg de "músicas por show" tem `aria-label` resumindo o gráfico

### Sprint vistoria 2 + Lighthouse fixes (commits `d50aec1`, `81f718b`, `fdeb721`)
- **`aria-prohibited-attr` resolvido**: removido aria-label/aria-hidden de div.stat (Lighthouse 96 → 100)
- **`label-content-name-mismatch` resolvido**: aria-labels reformatados pra começar com texto visível ("Pearl Jam 02 dez 2005..." ao invés de "Abrir setlist:..."). WCAG 2.5.3 Label in Name
- **P1-01 `<audio preload="auto"→"none">`**: elimina prefetch fantasma de metadata no boot
- **P1-03 ESC topmost**: dialog topmost fecha primeiro (lightbox > media-panel > album-modal > drawer). ESC handlers locais redundantes removidos
- **P1-02 JPGs Deep re-comprimidos**: 164 imagens a quality=70. **59 → 48 MB (-20%)**
- **P2-04 AbortController** em `_loadInterpretations` + abort em `beforeunload`
- **P2-05 audio-player aria-describedby**: aponta pra `audio-transcript-current` quando drawer está aberto com áudio
- **P3-01 console.warn** substituídos por `track('audio_error'/'image_error')` no GA4

### Métricas finais
| Métrica | Valor |
|---|---|
| Lighthouse Accessibility | **100/100** |
| Lighthouse SEO | **100/100** |
| Lighthouse Best Practices | 96/100 |
| Lighthouse Performance | 52/100 |
| `aria-label` instances | 61 |
| `role="button"` | 9 |
| `aria-pressed` | 15 |
| `aria-live` regions | 7 |
| `aria-modal` dialogs | 6 |
| `aria-expanded` | 4 |
| `lang="en"` containers | 5 |
| Em-dashes em conteúdo | 0 |
| `outline:none` legados | 0 |

## 7.1. A11y — convenções e helpers

- **Helper de dialog**: ao criar novo modal/painel, use `_a11yOpenDialog(el, focusTarget)` e `_a11yCloseDialog(el)`. Cuidam de remover/adicionar `hidden`, salvar foco anterior e devolver após fechamento. Foco-trap global pega qualquer `[role="dialog"][aria-modal="true"]:not([hidden])`
- **Tabs**: ao adicionar nova view, replicar o pattern: `role="tab" aria-selected="false" aria-controls="view-X" tabindex="-1"` no botão, `role="tabpanel" aria-labelledby="tab-X" tabindex="0" hidden` na section. `activateTab()` cuida do resto
- **Botões com ícone único**: sempre `aria-label` no `<button>` e `<span aria-hidden="true">EMOJI</span>` por dentro
- **Toggles**: `aria-pressed="true|false"` sincronizado com classe `.active` no handler de click
- **aria-label em elementos clicáveis**: começar com o texto visível (WCAG 2.5.3 Label in Name), terminar com a ação. Ex: `"Pearl Jam, 02 dez 2005, Pacaembu. Abrir setlist."`
- **Não usar aria-label em `<div>` sem role**: Lighthouse rejeita. Ou adiciona `role="group"`/`role="text"`, ou deixa o texto natural ser o nome acessível
- **Imagens**: alt sempre descritivo. Para mudança dinâmica (lightbox/media), atualizar `img.alt` no load
- **Foco**: `*:focus-visible` define o ring; nunca usar `outline: none` sem providenciar substituto
- **`lang="en"`**: aplicar em qualquer container que tenha texto em inglês (letras, interpretações, citações); o parser MD faz isso automaticamente nos itálicos `*"..."*` que contêm palavras funcionais em inglês

## 8. Convenções importantes

- **NÃO USAR EM-DASH (—) em conteúdo visível do site**. Regra obrigatória do dono. Está no auto-memory. Aplicada em todos os 15 docs de álbum, lyrics.json, interpretations.json, notes de SHOWS, ANALYTICS.md, HANDOFF.md
- **Extras nunca entram nas stats**: rule 0. `filteredShows()` exclui `extra:true` automaticamente
- **Visibilidade do repo**: público (consciente)
- **Identidade git**: `eng.andrehz@gmail.com`
- **`.claude/`, `node_modules/`, `lighthouse-*`**: ignorados pelo git
- **Animações**: respeitam `prefers-reduced-motion` globalmente
- **Tema padrão**: light com toggle pra dark
- **`gh` CLI tem 2 contas**: `andrehz4` (este projeto) e `terra-gentil` (outro projeto). Antes de push, `gh auth status` e `gh auth switch -h github.com -u andrehz4` se a ativa for a errada. 403 no push = conta errada

## 9. Cloudflare R2 (áudio)

Áudios MP3 não vivem no repo. Cloudflare R2, mesma conta `eng.andrehz@gmail.com`, egress grátis, free tier 10 GB.

| | |
|---|---|
| Bucket | `setlists-pj-ev-audio` |
| Region | ENAM |
| URL pública | `https://pub-4d99051b225d492fbf4ac3bfdbef7de4.r2.dev` |
| S3 endpoint | `https://c071f317813dd06ec00befa13d5c5684.r2.cloudflarestorage.com` |
| Account ID | `c071f317813dd06ec00befa13d5c5684` |
| Tamanho atual | ~5.8 GB (603 objetos) |

Estrutura no bucket: `<show-id>/<filename>.mp3`. Player lê constante `R2_AUDIO_BASE` definida no topo do bloco DATA do `index.html`.

Subir mais áudios:
```powershell
rclone copy "<pasta-local>" "r2-setlists:setlists-pj-ev-audio/<show-id>/" --s3-no-check-bucket --progress
```

⚠️ Sempre `--s3-no-check-bucket` (token tem escopo limitado a esse bucket).

API Token salvo só no `%APPDATA%\rclone\rclone.conf`, perfil `r2-setlists`. Pra recriar: dashboard → R2 → API → Account API Tokens.

## 10. GitHub e GA4 (notas de migração)

- Repo migrado de `azimermann4/setlists-pj-ev` pra `andrehz4/setlists-pj-ev` em 2026-05-07. Cloudflare Pages reconectado mesmo dia
- Repo antigo `azimermann4` ainda existe (deletar manual via web)
- Build settings do Pages: Framework preset `None`, build command vazio, output `/`
- GA4 property criada em 2026-05-08, stream "Site Pearl Jam" com URL `https://setlists-pj-ev.pages.dev/`, ID `G-234ZL5MF0T`

## 11. Como rodar localmente

```bash
cd setlists-pj-ev
python -m http.server 8000
# abrir http://localhost:8000
```

Duplo clique em `index.html` também funciona, mas algumas features (fetch de interpretations.json, fetch de albums/*.md) podem falhar por CORS.

## 12. Como editar conteúdo

**Adicionar/editar shows ou setlists**: editar objeto `SHOWS` em `index.html` (procura por `const SHOWS = [`). Cada show tem: `id`, `artist`, `date`, `venue`, `city`, `tour`, `confidence`, `source`, `songs`, opcionais `note`, `notes_audio`, `soundcheck`, `not_played`, `special`, `extra`.

**Adicionar/editar manifest de mídia**: editar objeto `MEDIA_MANIFEST` em `index.html`. Por show: `poster`, `posters`, `photos`, `my_photos`, `videos`, `audio: ["arquivo.mp3"]`, `highlight_photos: [N]`.

**Adicionar interpretação**: editar `media/interpretations.json` direto, ou rodar script Python pattern. Formato: string ou objeto `{text, byShow:{showId: paragraph}}`.

**Adicionar análise de álbum**:
1. Salvar em `media/albums/<album.id>.md` (sem em-dashes, sem `—`)
2. Adicionar `'<album.id>'` ao Set `ALBUM_DOCS` no `index.html`
3. Commitar

**Adicionar revista Deep**:
1. `pip install --user pymupdf` (se ainda não tiver)
2. Rodar script: rasterizar PDF a 150 DPI, JPEG quality 70, salvar em `media/deep/deep-XX/page-N.jpg`
3. Adicionar entry em `DEEP_ISSUES`: `{ id: "deep-XX", title: "Deep · Issue XX", year: YYYY, pages: N, cover: "media/deep/deep-XX/page-1.jpg" }`

**Publicar**:
```bash
git add .
git commit -m "<msg>"
git push origin main
# Cloudflare Pages re-implanta em ~1 min
```

## 13. Camadas de backup

| Camada | Onde | Status |
|---|---|---|
| 1. Cópia local | `C:\Gitlab_hz\pearljam\setlists-pj-ev` | OK |
| 2. Git remoto | github.com/andrehz4/setlists-pj-ev | OK |
| 3. Site live | setlists-pj-ev.pages.dev | OK |
| 4. R2 áudio | bucket `setlists-pj-ev-audio` | OK |
| 5. ZIP local em HD/pendrive | — | recomendado antes de formatar |
| 6. Cópia em outra nuvem | — | opcional |

Restauração após format:
```bash
git clone https://github.com/andrehz4/setlists-pj-ev.git
```

## 14. Histórico de commits relevantes (sessão de 2026-05-08)

```
fdeb721  perf(deep): re-comprime 164 JPGs do flipbook a quality=70 (-20%)
81f718b  fix: aplica P1 e P2 da sprint vistoria 2 (preload, ESC topmost, abort, transcript link, console)
355cffa  chore(gitignore): exclui node_modules e relatorios lighthouse
092475f  chore(gitignore) + HANDOFF registra 100/100 a11y
d50aec1  fix(a11y): resolve 2 falhas do Lighthouse audit (96→100)
269394b  docs(handoff): registra a11y fase 3
27debb9  feat(a11y): sprint fase 3 - lang=en, transcricao audio, reduced-motion, SVG
b736a54  feat(content): publica 3 analises de albuns solo do Eddie Vedder
2b10b79  docs(handoff): registra sessao de 2026-05-08
63bb2c4  feat(a11y+content): sprint WCAG 2.2 AA fase 1+2 + 3 extras (POA/Dana Point/Amsterdam)
df62ff4  feat(content): publica 4 analises de album, 5 revistas Deep e og.jpg
```

### Commits anteriores (referência histórica)
```
fa0cfa6  docs(handoff): atualiza pra 2026-05-08 (anterior a esta sessão)
7309ac6  Riot Act (research) + Avocado 2006 docs
5c82032  sprint vistoria 1: P1 + 5 P2 + 2 P3 aplicados
a5a959f  GA4 ID real
ec55895  tab Deep + flipbook viewer
0df3d9c  extras infra (rule 0)
ba2fc68  GA4 instrumentation + 5 custom events + ANALYTICS.md
978278b  fix lightbox state on close
d6ece3c  search lyric/interp cards + byShow infra (pilot pj-2005-12-02)
73a8407  audio: 26 mp3s do show pj-2005-12-02 Pacaembu
```

---

*Atualizado por sessão Claude Code em 2026-05-08 (HEAD `fdeb721`). Próxima sessão: byShow expansion, ou repaste das conclusões de Gigaton/Dark Matter/Into the Wild, ou decisão sobre Deep→R2 e GA4→Cloudflare Web Analytics, ou retomar de onde der vontade.*
