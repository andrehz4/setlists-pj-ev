# PROGRESSO, setlists-pj-ev

## Data
2026-05-11

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
