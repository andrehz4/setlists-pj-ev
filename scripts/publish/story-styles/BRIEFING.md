# BRIEFING — Style novo do story diário @smufdpj

Cola esse arquivo no chat quando quiser que eu crie um padrão visual novo
pra intro + outro do story. Edita só a seção "REFERÊNCIA" no fim com tua
ideia.

---

## CONTEXTO

`@smufdpj` é a conta IG do site setlists-pj-ev.pages.dev (fan archive
Pearl Jam + Eddie Vedder). Posta 1 story diário às 09h BRT com as 5
manchetes do dia. Pipeline gera MP4 1080x1920 com timeline:

```
[0.0,  3.0)  intro    ← style.intro({ tRel, state })
[3.0,  6.5)  card 1
[6.5, 10.0)  card 2
[10.0, 13.5) card 3
[13.5, 17.0) card 4
[17.0, 20.5) card 5
[20.5, 22.0) outro    ← style.outro({ tRel, state })
```

Os cards têm style fixo (foto da matéria + headline typewriter + tags).
O que muda por **style** é só intro e outro. Ambos precisam ter
**continuidade visual** entre si (mesmo grid, mesma paleta, mesmas
âncoras tipográficas) e contrastar com os cards.

---

## REQUISITOS OBRIGATÓRIOS

### Arquivo
`scripts/publish/story-styles/<nome>.mjs`. Default-exporta um objeto:

```js
export default {
  intro: ({ tRel, state }) => "<svg ...>...</svg>",
  outro: ({ tRel, state }) => "<svg ...>...</svg>",
};
```

Registrar em `story-styles/index.mjs` adicionando ao objeto `STYLES`.

### Assinatura
- `tRel` (number): tempo dentro do segmento em segundos. Intro 0..3.0, outro 0..1.5.
- `state` (object) campos garantidos:
  ```
  W, H                 1080, 1920 (canvas vertical IG story)
  day                  número do dia do mês (1..31)
  monthShort           "JAN", "FEV", ..., "DEZ"
  monthLong            "JANEIRO", ..., "DEZEMBRO"
  year                 número do ano
  dayOfWeekShort       "SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"
  dayOfWeekLong        "SEGUNDA-FEIRA", ...
  edition              dayOfYear (1..366) — numeração da edição diária
  itemCount            quantos items vão nos cards (sempre 5 nas próximas semanas)
  tarjaColor           hex da cor do dia (vermelho/preto/ocre/azul, ciclo 4)
  ```

### Output
String SVG completa começando com `<svg xmlns=...>` e terminando com `</svg>`.
Renderizado por sharp (libvips), então:
- **Fontes**: só do sistema (Linux+Windows). Use `font-family` com fallback
  chain. Recomendado: `'Helvetica Neue','Helvetica','Arial Black',sans-serif`
  ou `'Newsreader','Playfair Display','Georgia',serif` ou
  `'Special Elite',Courier,monospace`. NÃO use Google Fonts diretamente.
- **NÃO usa CSS animations**: tudo é frame-a-frame. Cada chamada gera 1
  PNG estático com o estado em `tRel`. ffmpeg concatena depois a 30fps.

### Conteúdo OBRIGATÓRIO na INTRO (3.0s)

Cada style precisa mostrar em algum momento dos 3s:

1. **Marca**: "SMUFDPJ" em destaque (pode ser rotacionado, fragmentado, mas legível)
2. **Data**: `state.day` + `state.monthShort` + `state.year` (formato livre, ex: "13 MAI 2026" ou "13.05.2026" ou "13 / MAIO / 2026")
3. **Dia da semana**: `state.dayOfWeekShort` ou `state.dayOfWeekLong`
4. **Número da edição**: `state.edition` (criativo: "N° 0133", "ED. Nº 133", "Nº 133", etc)
5. **Contagem**: `state.itemCount` manchetes nesta edição (livre: "5 manchetes", "ITEMS / 05", etc)
6. **Cor accent**: usar `state.tarjaColor` em pelo menos UM elemento dominante (cria
   sincronia com o ciclo de cor da tarja do carrossel feed)

### Conteúdo OBRIGATÓRIO no OUTRO (1.5s)

1. **Continuidade visual com a intro**: pelo menos 2 elementos do layout da
   intro precisam reaparecer no outro (ex: barra accent vertical, número
   gigante na mesma posição, mesma tipografia masthead). O usuário deve
   sentir "é a mesma peça fechando".
2. **CTA central**: "LINK NA BIO" em destaque (instagram não permite link
   sticker em conta < 10k followers, então CTA é textual e dominante)
3. **Handle**: "@SMUFDPJ"
4. **Footer de continuidade**: "PRÓXIMA EDIÇÃO AMANHÃ 09H BRT" + URL
   `SETLISTS-PJ-EV.PAGES.DEV`
5. **Cor accent**: mesma `state.tarjaColor` usada na intro

### Animação

- Cada elemento entra em momento próprio com easing (helpers em `_shared.mjs`):
  `easeOutCubic`, `easeOutBack`, `easeInOutQuad`, `progress(t, start, dur)`,
  `clamp01`
- Padrões recomendados:
  - **Tarjas/blocos**: slide-in com `easeOutCubic`
  - **Texto crescendo**: typewriter (substring crescente com `Math.floor(easeOutCubic(p) * len)`)
  - **Elementos com personalidade**: pop-in com `easeOutBack` (overshoot)
  - **Fade simples**: opacity controlada por `easeOutCubic(progress(tRel, start, dur))`
- **Não congele o frame final**: nos últimos 0.5s da intro, deixe respiro
  estático pro olho descansar antes da transição pros cards.

### Restrições técnicas

- Renderização: sharp + libvips, suporta SVG 1.1 completo + filters básicos
- **Não funciona**: CSS animations, `<animate>` SMIL, JS embedded, foreignObject
- **Funciona**: `transform`, `opacity`, `filter` (drop-shadow), `linearGradient`,
  `clipPath`, gradient, pattern
- Performance: render leva ~80ms por frame com SVG complexo. Intro 3s = 90 frames =
  ~7s só intro. Outro 1.5s = 45 frames = ~3.5s. Total style ~10s da pipeline
  de 1m30s. Evite SVGs maiores que 100KB de string.

---

## TESTAR LOCALMENTE

```bash
STORY_STYLE=<nome> npm run publish:story:dry
```

Gera MP4 em `media/news/instagram-stories/<DATA>.mp4`. Abre no player default.
Pra ver só intro/outro isolados sem esperar render completo, posso adaptar
`intro-mockups.mjs` pra incluir o novo style (peça quando precisar).

---

## REFERÊNCIA (preencher antes de mandar)

Quando quiser style novo, edita esta seção com:

```
NOME PROPOSTO: <ex: vaporwave>

VIBE EM 1 FRASE:
<ex: anos 80 retrofuturista, neon roxo+ciano, grades 3D, type chromática>

PALETA (mín 3 cores):
- BG:        <hex>
- Texto:     <hex>
- Accent:    <usar state.tarjaColor>
- Extra:     <hex>

TIPOGRAFIA:
- Display:   <font-family chain>
- Body:      <font-family chain>

REFERÊNCIAS VISUAIS:
<link, descrição, screenshot anexado, ou nome de movimento/designer>

ELEMENTO DOMINANTE:
<o que precisa SER A CARA do style. Ex: "grade 3D em perspectiva com
SMUFDPJ como horizonte" ou "tarjas cromáticas separadas em RGB">

ANIMAÇÃO IDEAL (opcional):
<descreve a sequência de entradas dos elementos se tiver ideia clara>
```

Eu pego daqui, crio o `<nome>.mjs` + atualizo `index.mjs` + regiro MP4
pra você validar. Se aprovar, vira o default.
