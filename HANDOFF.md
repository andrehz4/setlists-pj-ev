# HANDOFF · Setlists PJ + EV

Atualizado em **2026-05-08**.

Snapshot completo do projeto. Tudo aqui é versionado com o código. Ao abrir num novo chat, leia este arquivo primeiro.

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
| R2 áudio | bucket `setlists-pj-ev-audio`, ~3.6 GB de 10 GB | OK |
| Branch atual | `main`, último commit `7309ac6` | sincronizado |

## 2. O que é

Site estático single-file que cataloga shows do Pearl Jam + Eddie Vedder presenciados pelo dono (André). 25 shows catalogados, ~208 músicas únicas, ~190 interpretações críticas em inglês, 8 análises de álbum em português, áudio dos shows quando disponível, fotos oficiais e pessoais, posters, vídeos.

Visual: **Ticket Archive** (papel kraft, perfurações, stubs de ingresso). Navegação por 8 tabs: Timeline, Ranking, Cobertura por álbum, Destaques, Buscar música, Raridades, Galeria, Deep.

## 3. Features ativas (status 2026-05-08)

### Core
- 25 shows catalogados em `SHOWS` no `index.html`
- Setlists completos (full confidence em todos)
- Drawer com poster, fotos oficiais, fotos pessoais, vídeos, setlist clicável
- Filtros por artista (PJ / EV / Ambos) e ano
- Lightbox com carrossel
- Tema claro/escuro (default claro), `prefers-reduced-motion` respeitado
- Stats agregadas (total shows, músicas únicas, total cantado, anos, cidades)

### Conteúdo enriquecido
- **Letras** (`media/lyrics.json`): trechos curtos por música. Inline no drawer.
- **Interpretações** (`media/interpretations.json`): comentário crítico em inglês, ~190 entradas. Inline no drawer + cards no Buscar (default abertos).
  - Suporta formato dual: string (universal) ou objeto `{text, byShow:{showId: paragraph}}`
  - Pilot byShow em pj-2005-12-02 (5 músicas: Black, Yellow Ledbetter, Better Man, Even Flow, Alive)
- **Análises de álbum** (`media/albums/*.md`): docs longos em português. Modal fullscreen acessível pela tab Cobertura por álbum (botão "📖 Ler análise").

### Áudio
- Player no rodapé do drawer
- Áudio servido do R2 público (constante `R2_AUDIO_BASE`)
- Prefetch da próxima faixa (`<link rel=prefetch as=audio>`)
- Áudio importado em 16 shows (~500 MP3s, ~3.6 GB)

### Buscar música
- Busca por substring no nome
- Resulta cards com: contagem, lista de shows onde tocou, **letra** (default open) e **interpretation** (default open)

### Raridades
- LuckGauge SVG donut com luck score baseado em frequência histórica
- Once-ever (1× na carreira), Ultra-raras (2-5×), Histograma de distribuição
- Listagem ordenada de raridades pegas

### Destaques
- 9 cards de stats (música mais ouvida, in 80%+, show mais longo etc)
- Top 10 mais ouvidas (horizontal bar chart)
- Timeline de músicas-por-show (SVG area chart)

### Galeria
- Grid de capas + Comunidade (fotos coletivas)

### Deep (revistas Ten Club)
- Tab nova com flipbook horizontal scroll-snap
- `DEEP_ISSUES` config vazio, empty state com instruções pdftoppm
- Aguardando upload das 5 edições

### Extras / acervo (rule 0)
- Infra completa: shows com `extra: true` ficam fora de `filteredShows()` (todas as stats automaticamente excluem)
- Bloco "Acervo · extras" no fim da Timeline com nota explicativa
- Aguardando 3 entries: Dana Point 2021 EV (Ohana), Amsterdã 2022 PJ, POA 2011 PJ

### Analytics (GA4)
- gtag.js no `<head>` com ID `G-234ZL5MF0T` (stream `Site Pearl Jam`, URL `setlists-pj-ev.pages.dev`)
- `window.track()` wrapper
- 5 custom events: `tab_change`, `drawer_open`, `audio_play`, `search` (debounced 800ms, min 2 chars), `album_doc_open`
- Doc completa em `ANALYTICS.md`

### Segurança e SEO
- `_headers` com CSP (allowlist Google Tag, R2, Google Fonts), X-Frame-Options DENY, Permissions-Policy, X-Content-Type-Options, Referrer-Policy + cache rules por path
- `robots.txt` (Disallow `/media/`)
- `sitemap.xml` mínimo
- Open Graph + Twitter card + canonical + theme-color (placeholder `og.jpg` ainda não criado)

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
| Backspacer | 2009 | `backspacer` | **falta paste** | — |
| Lightning Bolt | 2013 | `lightningbolt` | **falta paste** | — |
| Gigaton | 2020 | `gigaton` | **falta paste** | — |
| Dark Matter | 2024 | `darkmatter` | **falta paste** | — |
| Lost Dogs | — | `lostdogs` | provavelmente skip | — |
| Into the Wild | 2007 | `intowild` | EV solo, futuro | — |
| Ukulele Songs | 2011 | `ukulele` | EV solo, futuro | — |
| Earthling | 2022 | `earthling` | EV solo, futuro | — |

Padrão de salvar: cola o texto, eu remove em-dashes (regra do projeto), salvo em `media/albums/<id>.md`, adiciono `<id>` ao set `ALBUM_DOCS` no `index.html`. Botão "📖 Ler análise" aparece automaticamente.

## 5. Estrutura de arquivos

```
setlists-pj-ev/
├── index.html              # 460 KB, ~6000 linhas — app completo (HTML+CSS+JS+DADOS+lyrics)
├── _headers                # Cloudflare Pages headers (CSP, cache, security)
├── robots.txt
├── sitemap.xml
├── ANALYTICS.md            # eventos GA4 + customizações
├── HANDOFF.md              # este arquivo
├── MEDIA_AUDIT_2026-04-29.md  # auditoria de gaps (gerada em sessão antiga)
├── media-manifest.json     # cópia humana do manifest interno
├── README.txt              # uso original
├── .gitignore
└── media/
    ├── albums/             # 16 capas .jpg + 8 análises .md (ten, vs, vitalogy, nocode, yield, binaural, riotact, pj2006)
    ├── lyrics.json         # 7.5 KB
    ├── interpretations.json  # 396 KB, ~190 entradas
    ├── deep/               # vazio (placeholder pra revistas Deep)
    ├── pj-YYYY-MM-DD/      # 17 shows PJ
    │   ├── poster.jpg
    │   ├── photo-N.jpg + thumb
    │   ├── mine/photo-N.jpg + thumb
    │   └── videos/video-N.mp4
    └── ev-YYYY-MM-DD/      # 8 shows EV
```

## 6. Pendências (em ordem de prioridade)

### Próxima sessão (Claude Code)
1. **Continuar pastes de álbuns**: Backspacer, Lightning Bolt, Gigaton, Dark Matter (paste do user, eu salvo). EV solo opcional depois.
2. **og.jpg**: criar imagem 1200×630 e colocar na raiz pra Open Graph funcionar
3. **3 extras data**: Dana Point 2021 EV (Ohana Sep 2021), Amsterdã 2022 PJ (Ziggo Dome Jul 2022), POA 2011 PJ (provavelmente 11/11/2011) — adicionar entries em `SHOWS` com `extra: true`
4. **5 PDFs Deep**: rodar `pdftoppm -r 150 -jpeg -jpegopt quality=82 issue.pdf media/deep/<id>/page` em cada PDF, depois preencher `DEEP_ISSUES` no `index.html`
5. **byShow expansion**: o pilot está em pj-2005-12-02 (5 músicas). Expandir progressivamente pros outros 24 shows quando der vontade
6. **#20 do tracker**: Bug do lightbox foi parcialmente fixado em `978278b`. Validar em rede lenta. Era: "depois de abrir poster no lightbox, fotos do show não abrem mais"
7. **Tarefa #28** (Interpretações EV solo): pode ser marcada como completed — 14 lotes feitos, 100% cobertura

### Pendentes legados (mídia, infra)
8. Procurar fotos pessoais antigas (2011-2015) em outro PC
9. Importar 12 arquivos do Drive (`MEDIA_AUDIT_2026-04-29.md`)
10. ZIP backup local + SHA-256 antes de qualquer formatação
11. Domínio custom no Cloudflare Pages
12. `pj-2024-08-31/poster-1.jpg` falta (manifest declara 2 posters)
13. Deletar repo antigo `azimermann4/setlists-pj-ev` (manual via web — gh local logada como andrehz4)

## 7. Sprint vistoria (commit `5c82032`, 2026-05-08)

Auditoria completa rodada e fixes aplicados. Resultado: 1 P1 + 5 P2 + 2 P3 fechados.

| Fix | O que | Status |
|---|---|---|
| P1-01 | MutationObserver global em document.body trocado por `window.refreshAfterRender()` explícito | aplicado |
| P2-01 | Self-XSS na busca: `escHtml()` aplicado em `q` antes de `innerHTML` | aplicado |
| P2-02 | Gallery observers reusam `_observer` estático com disconnect | aplicado |
| P2-03 | `audio.play().catch()` limpa loading state em erro | aplicado |
| P2-04 | `<meta description>`, Open Graph, Twitter card, canonical | aplicado |
| P2-05 | `_headers` com CSP customizado | aplicado |
| P3-03 | `robots.txt` + `sitemap.xml` | aplicado |
| P3-06 | Throttle scroll do deep-pages com rAF | aplicado |

Ainda pendentes (P3 cosmético, sem ação ou contexto): aviso GA4 "coleta não ativa" (cache externo, some em 24-48h), `_meta.updated` estagnado em interpretations.json (sem impacto).

## 8. Convenções importantes

- **NÃO USAR EM-DASH (—) em conteúdo visível do site**. Regra obrigatória do dono. Está no auto-memory. Aplicada em todos os 8 docs de álbum, lyrics.json, interpretations.json, notes de SHOWS, ANALYTICS.md já tem 0. **HANDOFF.md pode ter** (não é renderizado no site).
- **Extras nunca entram nas stats**: rule 0. `filteredShows()` exclui `extra:true` automaticamente.
- **Visibilidade do repo**: público (consciente)
- **Identidade git**: `eng.andrehz@gmail.com`
- **`.claude/`**: ignorado pelo git
- **Animações**: respeitam `prefers-reduced-motion`
- **Tema padrão**: light com toggle pra dark

## 9. Cloudflare R2 (áudio)

Áudios MP3 não vivem no repo. Cloudflare R2, mesma conta `eng.andrehz@gmail.com`, egress grátis, free tier 10 GB.

| | |
|---|---|
| Bucket | `setlists-pj-ev-audio` |
| Region | ENAM |
| URL pública | `https://pub-4d99051b225d492fbf4ac3bfdbef7de4.r2.dev` |
| S3 endpoint | `https://c071f317813dd06ec00befa13d5c5684.r2.cloudflarestorage.com` |
| Account ID | `c071f317813dd06ec00befa13d5c5684` |

Estrutura no bucket: `<show-id>/<filename>.mp3`. Player lê constante `R2_AUDIO_BASE` definida no topo do bloco DATA.

Subir mais áudios:
```powershell
rclone copy "<pasta-local>" "r2-setlists:setlists-pj-ev-audio/<show-id>/" --s3-no-check-bucket --progress
```

⚠️ Sempre `--s3-no-check-bucket` — token tem escopo limitado a esse bucket.

API Token salvo só no `%APPDATA%\rclone\rclone.conf`, perfil `r2-setlists`. Pra recriar: dashboard → R2 → API → Account API Tokens.

## 10. GitHub e GA4 (notas de migração)

- Repo migrado de `azimermann4/setlists-pj-ev` pra `andrehz4/setlists-pj-ev` em 2026-05-07. Cloudflare Pages reconectado mesmo dia.
- Repo antigo `azimermann4` ainda existe — deletar manual via web. CLI `gh` local só está logada como `andrehz4`.
- Build settings do Pages: Framework preset `None`, build command vazio, output `/`.
- GA4 property criada em 2026-05-08, stream "Site Pearl Jam" com URL `https://setlists-pj-ev.pages.dev/`, ID `G-234ZL5MF0T`.

## 11. Como rodar localmente

```bash
cd setlists-pj-ev
python -m http.server 8000
# abrir http://localhost:8000
```

Duplo clique em `index.html` também funciona, mas algumas features (fetch de interpretations.json) podem falhar por CORS.

## 12. Como editar conteúdo

**Adicionar/editar shows ou setlists:**
- Editar objeto `SHOWS` em `index.html` (procura por `const SHOWS = [`).
- Cada show tem: `id`, `artist`, `date`, `venue`, `city`, `tour`, `confidence`, `source`, `songs`, opcionais `note`, `soundcheck`, `not_played`, `special`, `extra`.

**Adicionar/editar manifest de mídia:**
- Editar objeto `MEDIA_MANIFEST` em `index.html` (procura por `const MEDIA_MANIFEST = {`).
- Por show: `poster`, `posters`, `photos`, `my_photos`, `videos`, `audio: ["arquivo.mp3"]`, `highlight_photos: [N]`.

**Adicionar interpretação:**
- Edite `media/interpretations.json` direto, ou rode script Python pattern (ver `add_*.py` em `%TEMP%`).
- Formato: string ou objeto `{text, byShow:{showId: paragraph}}`.

**Adicionar análise de álbum:**
1. Salvar em `media/albums/<album.id>.md` (sem em-dashes, sem `—`)
2. Adicionar `'<album.id>'` ao `Set` `ALBUM_DOCS` no `index.html`
3. Commitar

**Publicar:**
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

## 14. Histórico de commits relevantes

```
7309ac6  Riot Act (research) + Avocado 2006 docs
e33bb27  search cards default-open + clean em-dash dos H1 dos albums
4247c27  bumpa tipografia do modal de albums
5c82032  sprint vistoria: P1 + 5 P2 + 2 P3 aplicados
a5a959f  GA4 ID real
ec55895  tab Deep + flipbook viewer
0df3d9c  extras infra (rule 0)
9c3d2a5  charts mudanca 4/4 redesign
3366113  Binaural doc
ba2fc68  GA4 instrumentation + 5 custom events + ANALYTICS.md
02cd6be  album modal + Yield doc
978278b  fix lightbox state on close
7ed2a1b  No Code doc
d6ece3c  search lyric/interp cards + byShow infra (pilot pj-2005-12-02)
cd918be  fix medley split fallback (Daughter -> W.M.A.)
a21ccfe  Vitalogy doc
271ba05..f5c36f7  14 lotes EV solo interpretations
73a8407  audio: 26 mp3s do show pj-2005-12-02 Pacaembu
```

---

*Atualizado por sessão Claude Code em 2026-05-08. Próxima sessão: pastes de Backspacer/Lightning Bolt/Gigaton/Dark Matter, ou retomar de onde der vontade.*
