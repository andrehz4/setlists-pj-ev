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
├── README.md           este arquivo
└── mockups/            telas de revisão (NÃO faz parte do bundle de produção)
    ├── news-listing.html
    ├── news-detail.html
    └── _mock.css
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

## Próximos batches (aguardando aprovação)
- **2:** Timeline + Galeria (+ lightbox) + BANDA
- **3:** Cifras & Tabs (catálogo drawer, mixer sheet, transport, FAB)
- **4:** Fórum (wrapper do iframe) + páginas standalone
- **5:** Drawer de show + Deep reader + views auxiliares
