# Frontend mobile apartado — Setlists PJ + EV

Skin mobile **CSS-only** para `setlists-pj-ev`. Carrega via media query, não toca no
`index.html` de 21k linhas, não adiciona JS, não renomeia nada.

## Como ligar (1 linha no `<head>`)

Adicione **depois** dos `<link>` de fontes que já existem no `index.html`:

```html
<link rel="stylesheet" href="mobile/mobile.css" media="(max-width: 768px)">
```

O atributo `media="(max-width:768px)"` garante que nada disso baixa nem aplica em
desktop. `mobile.css` é só um agregador com `@import` dos parciais. Cada parcial
**re-envolve** suas regras em `@media (max-width:768px)` (cinto + suspensório).

> **Por que `!important`?** O redesign "ticket archive" do desktop usa `!important`
> por toda parte e ainda existem blocos mobile legados (`@600/@640/@760`) também com
> `!important`. Como `mobile.css` carrega **depois**, vence os empates — mas só com
> `!important`. As regras estão escopadas o mais raso possível pra continuar editável.

## Arquivos

```
mobile/
├── mobile.css          entry-point (só @import)
├── mobile-core.css     BATCH 1 · nav, masthead, filter-bar, audio-player, footer
├── mobile-news.css     BATCH 1 · #view-news (fanzine)
├── mobile-timeline.css BATCH 2 · #view-timeline + drawer de setlist
├── mobile-gallery.css  BATCH 2 · #view-gallery + lightbox
├── mobile-banda.css    BATCH 2 · #view-banda (roster fliperama)
├── mobile-cifras.css   BATCH 3 · #view-tabs (catálogo/cifra/tab/transport) + FAB #9
├── mobile-forum.css    BATCH 4 · #view-forum (iframe) + páginas standalone do fórum
├── README.md           este arquivo
└── mockups/            telas de revisão (NÃO faz parte do bundle de produção)
```
Os mockups usam o DOM real + `_source/desktop.css` (CSS real extraído do `index.html`)
renderizados em viewport de telefone de verdade (375 / 414). Veja
`Batch 1 — Mobile Mockups.html` na raiz pra galeria com molduras de device.

---

## Decisões — Batch 1

### Nav superior (`.tabs`) — problema #1
- **Problema:** 12 abas quebram em 3-4 linhas em 375px.
- **Decisão:** vira tira horizontal com `scroll-snap` + `mask` de fade nas duas pontas
  (sinaliza "tem mais"), e fica **sticky no topo** ao rolar. Aba ativa = sublinhado
  vermelho `--pj`. Escolhido em vez de bottom-bar/hamburger porque **ambos exigiriam JS**
  (e o contrato é zero JS). Reaproveita o `scroll-snap` parcial que já existia em `@600`.
- **Trade-off:** abas fora da viewport ficam escondidas até rolar a tira; o fade ajuda
  a comunicar isso, mas não há indicador de "página".
- **HTML sugerido (não aplicado):** nenhum necessário. *Opcional:* um wrapper
  `<div class="tabs-scroller">` permitiria setas de scroll, mas não vale o custo.

### Masthead (ticket)
- **Problema:** título e stats ocupam altura demais antes do conteúdo.
- **Decisão:** compacta paddings, `clamp()` no h1, stats em 2 colunas, esconde o
  carimbo "ADMIT ONE…". Mantém as perfurações tracejadas e os carimbos de cor.
- **Trade-off:** consolida os breakpoints legados (`@760`) em `@768`; visual quase
  idêntico, só mais enxuto.

### Filter bar (`.filter-bar`)
- **Decisão:** label em linha própria, chips com wrap e alvo de toque ≥38px.
- **Trade-off:** em telas com muitos anos, a barra cresce um pouco em altura (aceitável).

### Audio player (`#audio-player`) — problema #5
- **Problema:** as 3 colunas (música | transporte | show+ações) apertam em 375px.
- **Decisão:** linha compacta `música | controles | fechar`. Esconde o nome do show e o
  separador; o **download some em ≤480px**. Controles ampliados (play 44px, demais 40px).
- **Trade-off:** nome do show e download ficam só no desktop. Som e navegação de faixa
  (o essencial) ganham espaço e alvo de toque.
- **HTML sugerido (não aplicado):** o FAB do cifra player precisa subir pra
  `bottom: 88px` quando o player está ativo (problema #9) — isso é do **Batch 3**.

### Footer (`.site-footer`) — problema #6
- **Decisão:** coluna única, nav vertical com divisores pontilhados e links grandes
  (19px, alvo ≥46px). Identidade e social empilham.
- **Trade-off:** footer fica mais alto, mas a hierarquia de toque melhora muito.

### Notícias — listagem (`#view-news`)
- **Problema:** chips de 14 tags estouram a linha (#4); bandeira/wordmark grandes demais.
- **Decisão:** chips viram tira `scroll-snap` horizontal (com `width:100%`+`min-width:0`
  pra não cair no *flexbox min-width trap* e gerar scroll lateral na página); bandeira
  empilha em 2 blocos; wordmark com `clamp()`; hero 1-coluna; cards full-width;
  paginação centralizada com botões ≥40px; lista compacta com altura de toque.
- **Trade-off:** "pág X de Y" some no estreito (a navegação ‹/› e os números bastam).

### Notícias — matéria (`.news-detail`)
- **Decisão:** corpo 16.5–17px / 1.7 pra leitura longa, drop cap reduzido, nav
  voltar/anterior/próxima com wrap e alvo ≥44px, "continue lendo" em coluna única.
- **Trade-off:** nenhum relevante; é refinamento sobre o que já existia em `@600`.

---

## Limitações conhecidas / a validar

- **Nav sticky:** depende de nenhum ancestral ter `overflow` ou `transform` que quebre
  `position:sticky`. Em `<main>` direto funciona; se em algum tema houver um wrapper com
  `overflow`, a nav só perde o "grudar" e continua rolável (degradação graciosa).
- **Tema escuro:** a view de Notícias mantém a paleta `--np-*` (papel xerox) mesmo no
  escuro — é o comportamento atual do site (jornal é sempre papel). O **chrome** (masthead,
  abas, footer, player) inverte normalmente.
- **Imagens nos mockups:** o `_mock.css` desenha placeholders halftone porque os
  `/media/...` não existem offline. No ar entram as fotos reais.

## HTML que SUGIRO mexer (separado, pra avaliação humana — nada aplicado)

1. **Nenhuma mudança é necessária para o Batch 1.** Tudo foi resolvido só com CSS.
2. *(Batch 3)* FAB do cifra player: precisará de um hook pra subir quando
   `#audio-player.active` — provavelmente um seletor irmão no CSS já resolve, confirmo lá.
3. *(Opcional, futuro)* `<meta name="theme-color">` por tema melhora a barra do iOS.

---

## Decisões — Batch 2

### Timeline (`#view-timeline`) + drawer de setlist
- **Timeline:** cards-ingresso em coluna única (o redesign ticket já tendia a isso);
  o rótulo-ano marca-d'água cai de **96px → 60px** (48px em ≤480) pra não engolir o
  primeiro card; alvo de toque ≥132px de altura no card.
- **Drawer:** já era tela cheia (`min(640px,100vw)`). Refinamos botão fechar pra **44px**,
  setlist em **16px/1.35** pra leitura, grade de fotos 2 col.
- **Tags por música (letra/tradução · análise · tab):** cada música no setlist ganha chips
  inline pequenos e discretos (8.5px, uppercase, ~15px de altura) que abrem painéis
  expansíveis. **Cores semânticas:** LETRA / LETRA-TRADUÇÃO / TAB em vermelho PJ (família
  "música/conteúdo"); **ANÁLISE em bege neutro** (`#8a7f6e`) por ser interpretação, não
  conteúdo da música. Os chips ficam inline com o título sem quebrar a linha (título do
  setlist a 15px pra dar folga). Os botões de idioma do painel (PT/EN/Tradutor) e a barra
  Cifra/Tab ganham alvo de toque (36–46px); letras bilíngues EN/PT colapsam pra 1 coluna.
- **Trade-off:** nenhum relevante; é refinamento sobre layout que já colapsava bem.

### Galeria (`#view-gallery`) + **lightbox**
- **Galeria:** thumbs viram **contact-sheet de 3 colunas** (antes colapsavam pra ~1 col
  gigante); cabeçalho do show com `flex-wrap` + alvo 44px; playlists YT em 1 coluna 16:9.
- **Lightbox — correção crítica (#)**: o CSS legado fazia `.lb-arrow{display:none}` em
  ≤600px. Sem swipe (exigiria JS), o usuário ficava **preso na 1ª foto**. Reativamos as
  setas como alvos de toque grandes (52px) nos cantos inferiores; fechar 48px; o painel
  "História" não cobre mais os controles. **O JS já estava ligado nas setas** — só o CSS
  as escondia, então é fix puramente de CSS.
- **Trade-off:** as setas no rodapé ocupam um pouco do espaço do painel de história
  (resolvido com `padding-bottom` e z-index).

### BANDA (`#view-banda`)
- **Decisão:** roster em 2 colunas (herdado). Ao abrir um membro (`.bm.is-open`), o card
  passa a **ocupar a linha inteira** (`grid-column: 1 / -1`) pra bio + sprite respirarem,
  em vez de espremer em meia largura; `max-height` da ficha ampliada pra não clipar.
  Atalhos de teclado (`.kbd`) escondidos no toque.
- **Trade-off:** ao abrir, os cards abaixo "pulam" pra reorganizar o grid — comportamento
  esperado de um acordeão; o scroll-into-view do JS já compensa.

**Nenhuma mudança de HTML foi necessária no Batch 2.**

---

## Decisões — Batch 3

### Cifras & Tabs (`#view-tabs`) — a view mais densa
- **Base já pronta:** o CSS legado em `@880px` já vira `.tabs-layout` 1 coluna, deixa o
  `.catalog-aside` static e **esconde o mixer** (hover não existe no toque). Mantivemos.
- **Catálogo:** busca com `min-height:46px` e **fonte 16px** (evita o zoom automático do
  iOS no foco); itens `.cat-item` ≥52px de toque; capa 40px; lista cresce pra 320px
  (catálogo é a navegação principal, não fica presa em 240px).
- **Cifra/tab:** partitura/cifra com scroll interno e altura útil (52vh/46vh, 48vh em
  ≤480); chord-chips ≥26px e versos 14px pra leitura.
- **Transport (top + bottom):** já usam `flex-wrap`; reforçamos quebra centralizada,
  sliders mais grossos (thumb 16px), botões-ícone ≥40px, play redondo 54px, trackbar
  (Lead/Rhythm/…) em largura total.
- **#9 · FAB × audio-player (resolvido só com CSS):** o FAB flutuante da cifra
  (`position:fixed; bottom:24px`) colidia com o `#audio-player` fixo no rodapé quando os
  dois apareciam juntos. Como o FAB é `document.body.appendChild` **depois** do player no
  DOM, o combinador irmão geral alcança ele: `#audio-player.active ~ .alphatab-fab`
  sobe o FAB pra `bottom:112px` (104px em ≤480). O braço da cifra flutuante sobe junto.
  **Zero JS.**
- **Trade-off:** o valor de subida (112/104px) assume a altura típica do player (~96px);
  se o player mudar muito de altura, ajustar a constante. (Ver "HTML que sugiro" abaixo.)

**Nenhuma mudança de HTML foi necessária no Batch 3.**

---

## Decisões — Batch 4

### Fórum — `#view-forum` (iframe) + páginas standalone
O fórum no `index.html` é só `<iframe id="forum-iframe">` carregando **`forum.html`** sob
demanda. A UI de verdade vive em 3 **páginas standalone**: `forum.html`,
`forum-topic.html`, `forum-profile.html` — documentos separados, com `<head>` e estilos
próprios, e que **já eram bem responsivos** (subnav rola, thread-row colapsa, highlights
somem, posts/composer empilham). O batch refina e conserta o que faltava:

- **`#view-forum` (index.html):** iframe **full-bleed** (tira o padding lateral da
  `.view`, já que o forum.html tem o próprio respiro) — entra pelo `mobile.css` principal.
- **Perfil (bug real):** `.profile-body` era `1fr 320px` e **não colapsava** — a coluna
  lateral de 320px espremia o conteúdo. Agora **1 coluna** (rail vai pro fim). As ações
  (Seguir/Mensagem), escondidas em ≤900, voltam em largura total e tocáveis.
- **Alvos de toque:** cats do subnav ≥46px, chips de ordenação, botões do header,
  ferramentas de post e reações ≥38px, linha de thread ≥64px.
- **Busca anti-zoom:** `.search-input` e textareas em **16px** (evitam o zoom automático
  do iOS no foco).

> ⚠️ **Única mudança de HTML do projeto até aqui:** as 3 páginas standalone do fórum
> **não** carregam o `mobile.css`. Cada uma precisa de **1 linha** no `<head>` (depois do
> `<style>` próprio):
> ```html
> <link rel="stylesheet" href="mobile/mobile-forum.css" media="(max-width: 768px)">
> ```
> O `mobile-forum.css` é **auto-contido** (não depende dos outros parciais), então pode
> ser linkado direto nessas páginas. No `index.html` ele já entra via `mobile.css`.

**Fora esse `<link>` nas 3 páginas do fórum, nenhuma mudança de HTML foi necessária.**

> **Correção pós-review do Batch 4** (CSS, ≤480): o botão **"Entrar com Google"** (~150px)
> não encolhia e estourava o header pra fora da borda direita (375 e 414). Em ≤480 ele
> vira um **botão-ícone compacto** (40px, silhueta de pessoa em SVG branco sobre o vermelho
> PJ; texto escondido com `font-size:0`). O botão completo volta acima de 480px.

> **Correções pós-review do Batch 3** (tudo CSS, ≤768/≤480):
> 1. Nav no iPhone SE (375): aba truncava com reticências — `text-overflow:clip` +
>    `overflow:visible` + `max-width:none`, fonte 9.5px/pad 8px; abas rolam até o fim.
> 2. Header da cifra: o pill `♩ = 86` aparecia como `♩ = 8`. **Causa real:** não era
>    overflow — o **FAB flutuante (z-index 9999) pintava por cima** do header quando ele
>    caía na faixa vertical do FAB no layout 1-coluna. Correção: pills com `flex-wrap` +
>    `overflow:visible`, FAB mais compacto/encostado no canto, e **reserva da coluna
>    direita do header só quando o FAB está visível** via `body:has(.alphatab-fab.show)
>    #view-tabs .cifra-header { padding-right }` (CSS puro, sem JS).
> 3. FAB: respiro interno (padding 12px, × em −10px) + **reserva de 96px no rodapé** do
>    `.cifra-detail-wrap` pra o transport (loop/nota) nunca ficar sob o FAB flutuante.
> 4. Item "em breve": a opacidade ia no item inteiro e sumia com o número — agora só o
>    thumb + badge ficam a 0.4; número/título permanecem legíveis.

---

## Próximos batches (aguardando aprovação)
- **5 (último):** views auxiliares — ranking, destaques, raridades, deep, álbuns, buscar
