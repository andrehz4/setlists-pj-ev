# MOTION-SPEC · Reel "Agenda da semana" (@smufdpj)

Canvas 1080x1920, 30 fps. Todo valor é função de T (segundos). Código: `reel-core.jsx` (dados, tempos, mapa, peças comuns) + `layout-a.jsx` … `layout-d.jsx`.

## 0. Comum a todos os layouts

### Easings (só estes três)
- **enter** = easeOutCubic `1-(1-x)^3`
- **pop** = easeOutBack `1 + 2.70158(x-1)^3 + 1.70158(x-1)^2` (cruza 1 em x≈0,37)
- **move** = easeInOutCubic
- `p(s,d) = clamp((T-s)/d, 0, 1)`

### Paletas (variáveis CSS)
`--hl` destaque · `--bg` fundo · `--alert` alerta (pinos, carimbos) · `--paper` papel · `--paper2` papel2. Cada uma também em `--x-rgb` ("r,g,b") pra transparência: `rgba(var(--bg-rgb), 0.9)`.
- amarelo: #FFCC1A · #14110F · #E0361C · #f3efe6 · #E9E1CF
- laranja: #FF7A1A · #140C07 · #D7263D · #FFF1D6 · #F3DFC0
- azul: #4FC3F7 · #08111A · #FF4F79 · #EAF2F8 · #D5E4EF

Nenhum layout usa cor fixa. Transições de cor são feitas empilhando duas camadas (opacidade), nunca interpolando hex.

### Durações e cenas (iguais em A, B, C, D)
- Abertura 3,0 s · Mapa 3,5 s · Fecho 3,0 s
- Dia: `max(3, 0,9 + 1,8 × nShows)`; com narração, dura a fala.
- Semana real: Abertura 0–3 · Mapa 3–6,5 · Quinta 6,5–9,5 · Sexta 9,5–17,6 · Sábado 17,6–25,7 · Fecho 25,7–28,7

### Batidas (iguais em todos os layouts)
- Abertura: 4 cortes a cada 0,75 s (0 / 0,75 / 1,5 / 2,25)
- Mapa: corte em S; pino i toca o chão em `S + 1,5 + i·step + 0,15`, `step = min(0,22, (dur−2,1)/nCidades)`. Semana real: 4,65 · 4,825 · 5,0 · 5,175 · 5,35 · 5,525 · 5,7 · 5,875
- Dia: corte em S; troca pro show i em `voz_i − 0,15` (padrão `voz_i = S + 0,9 + i·(dur−0,9)/n`). Semana real: Sexta 12,05 / 13,85 / 15,65 · Sábado 20,15 / 21,95 / 23,75
- Fecho: corte em 25,7

### Mecânica compartilhada
- **Mapa** (`MapCanvas`, mesma em todos, muda só caixa e cores): projeção `x = 25,4 + (lon+73,99)·24,215`, `y = 12,5 + (5,27−lat)·24,99`. Câmera do Brasil inteiro ao recorte dos shows com move(S+0,2, 1,1), largura em log. Deriva 1 → 1,04 linear de S+1,3 ao fim. Estados com show: camada `--hl` com opacidade enter(S+1,1+0,15j, 0,3). Pino: translateY −180 → 0 pop(início, 0,4). Rótulo: pop(início+0,12, 0,3) de 0,5 → 1. Rótulos separados por 400 iterações determinísticas na montagem (não por quadro), linha guia se > 30 px.
- **Sanfona do dia**: pesos `w_i` somam 1; troca com move(0,35). Altura da linha = ROW + w·(HX−ROW), `HX = min(RH − (n−1)(ROW+GAP), HXmax)`. Conteúdo fechado: opacidade 1−w/0,45; aberto: (w−0,55)/0,45. Com 1 show, o card aberto ocupa HXmax centrado na região.
- **Fundo do dia**: clipe da banda em destaque (zoom 1,0 → 1,1 linear), crossfade pelos mesmos pesos. Sem clipe: `--bg` + logo 1480 px, opacidade 0,22, rot −8°.
- **Slam**: opacidade enter(s, 0,08); escala lerp(de, 1, pop(s, 0,4)).
- **Fita**: fundo scaleX enter(s, d) a partir da esquerda; texto opacidade clamp((e−0,5)·3).
- Assinatura Playfair 900 itálico 36 px, centrada, top 232.
- Áreas seguras: nada essencial em y < 220 nem y > 1540.

---

## A · Cartaz de show
Assinatura: `--paper` no escuro, `--bg` no mapa e no fecho.

**Abertura.** Escurecimento 0,55 → 0 (22–42%) → 0,9. Texto x 56, top 900, Anton, entrelinha 0,92: "ONDE TEM" 168 `--paper` slam(0,10, de 1,4) · "PEARL JAM" 214 `--hl` slam(0,75) · "AO VIVO" 168 slam(1,5) · fita "ESSA SEMANA?" Anton 104 `--bg` sobre `--hl`, rot −2°, enter(2,25, 0,25).

**Mapa.** Fundo `--paper2` + meio-tom 8 px. "9 SHOWS" Anton 220 `--bg`, x 56 top 326, slam S+0,05. Fita "EM 8 CIDADES · 24/11 A 29/11" Anton 52, rot −1,5°, enter(S+0,35, 0,3). Quadro x 40 y 645, 1000x840, borda 5 px `--bg`, fitas `--hl` 85% nos cantos. Terra `--paper`, rótulo `--bg`/`--paper`.

**Dia.** Escurecimento 0,92 / 0,55 / 0,35 / 0,9. Dia Anton 250 `--hl`, x 44 top 318, slam(S, de 1,35). Data fita `--paper` Anton 86, rot 3°, direita 52 top 466, enter(S+0,18, 0,28). Lista x 50, largura 980, RY 600, RH 930, ROW 96, GAP 12, HXmax 780. Linhas entram translateX 1100 → 0 enter(S+0,28+0,07i, 0,45); rot ±0,5°·(1−w). Fechada `--paper`, aberta `--hl`. Card aberto: cidade Anton `min(104, 880/((len+1,2)·0,5))`, banda Inter 800 52, @ Inter 600 32, casa (borda 3) e hora (Anton 34 `--hl` sobre `--bg`), logo `clamp(HX−fs−110, 130, 400)`.

**Fecho.** Fundo `--hl`. "TODA" Anton 250 slam S+0,05; "TERÇA TEM" 210 slam S+0,3; x 56 top 690. Selo 300 px, direita 70 top 330, escala 0,4 → 1 pop(S+0,45, 0,45), giro `(T−S)·10° − 12°`. Fita "SEGUE @SMUFDPJ" Anton 104 `--hl` sobre `--bg`, x 56 top 1170, enter(S+0,75, 0,3). URL x 60 top 1360, enter(S+1,15, 0,3) subindo 24 px.

---

## B · Ingresso
Linguagem: bilhete com picote tracejado, furos semicirculares nas pontas do picote, rótulos de campo (Inter 800 22, espaçamento 4, `--bg` 60%) e carimbos `--alert` (borda 7 px, Anton) que entram com escala 1,8 → 1 pop(0,35). Assinatura `--paper` em todas as cenas.

**Abertura.** Escurecimento 0,5 / 0 (25%) / 0,6 / 0,85. Ingresso `--paper` x 60 top 900, 960x560, rot −3°, sobe translateY 1100 → 0 enter(0,05, 0,5). Picote vertical em x 735 (canhoto 220 px). Campo "ENTRADA · BANDAS COVER" em 44,40. Linhas x 40 top 90, Anton, slam(de 1,25): "ONDE TEM" 116 `--bg` em 0,15 · "PEARL JAM" 150 `--alert` em 0,75 · "AO VIVO" 116 em 1,5. Canhoto girado 90°: "VÁLIDO DE" + "24/11 A 29/11" Anton 64. Carimbo "ESSA SEMANA?" Anton 92, rot −9°, em x 330 top 1380, pop(2,25).

**Mapa.** Fundo `--bg` + meio-tom `--hl` 10%. Ingresso x 50 top 300, 980x1220, sobe translateY 1300 → 0 enter(S, 0,35). Campo "INGRESSO · AGENDA DA SEMANA". "9 SHOWS" Anton 180 slam(S+0,15, de 1,25), em 44,70 do ingresso. Campos CIDADES / DATAS (Anton 56) enter(S+0,35, 0,25) em y 252. Picote horizontal em y 346 com furos nas bordas. Mapa x 80 y 660, 920x830, borda 4 `--bg`; terra `--paper2`, mar `--paper`, rótulo `--paper` com borda 3 `--bg`.

**Dia.** Escurecimento 0,9 / 0,6 / 0,5 / 0,9. Dia Anton 200 `--paper`, x 50 top 300, slam(S, de 1,3). Carimbo de data redondo 200 px, borda 7 `--hl`, "DATA" + data Anton 66, direita 56 top 300, rot −12°, pop(S+0,2, 0,35). Lista x 50, largura 980, RY 560, RH 970, ROW 100, GAP 14, HXmax 800, canhoto 250 px à direita com picote e furos (r 16) em cima e embaixo. Linhas sobem translateY 1400 → 0 enter(S+0,28+0,07i, 0,45). Fechada `--paper2`: cidade Anton 50 + banda Inter 700 28 | hora Anton 46 no canhoto. Aberta `--paper`: faixa `--hl` 56 px "ENTRADA · DIA DATA"; campos CIDADE (Anton `min(96, 640/((len+1,2)·0,47))`), BANDA (Inter 800 48 + @), LOCAL (Inter 700 34) distribuídos; canhoto com logo `clamp(HX−250, 110, 210)` e HORA Anton 64. Carimbo "AO VIVO" Anton 58, rot −14°, pop em `troca_i + 0,25` (show 0: S+0,9) — batida secundária.

**Fecho.** Fundo `--bg` + meio-tom. Ingresso `--paper` x 60 top 520, 960x900, rot −2°, sobe enter(S, 0,4). Campo "INGRESSO PERMANENTE". "TODA" Anton 220 slam S+0,1; "TERÇA TEM" 190 slam S+0,3. Picote em y 540. Faixa `--hl` y 590, 150 px, scaleX enter(S+0,75, 0,3) com "SEGUE @SMUFDPJ" Anton 112. Campo "AGENDA COMPLETA" + URL Inter 800 40 em y 772, enter(S+1,15, 0,3). Selo 250 px, borda 6 `--hl`, direita 70 top 300, escala 1,8 → 1 pop(S+0,5, 0,4), giro `14° + (T−S)·6°`.

---

## C · Lambe-lambe / xerox recortado
Linguagem: parede `--paper2` com meio-tom pesado (6 px, ponto 1,4) e restos de cartaz rasgados; letras de bilhete de resgate (cada letra num recorte, fundo sorteado entre paper/bg/hl/paper2/alert, 35% em Playfair itálico, rot ±4,5°, tamanho 0,88–1,10, deslocamento ±7 px, tudo com semente fixa); papéis com borda rasgada (polígono com semente fixa). Assinatura `--paper` no escuro, `--bg` na parede.

- **Letra de resgate**: cada letra aparece em `at + j·0,035` (0,03 nos textos longos), escala 1,6 → 1 pop(0,3).
- **Colar papel**: rotação (rot+5°) → rot e escala 1,12 → 1, pop(at, 0,32).

**Abertura.** Clipes com meio-tom extra `--bg` 35%. "ONDE TEM" 120 x 50 top 880 em 0,1 · "PEARL JAM" 150 x 40 top 1050 em 0,75 · "AO VIVO" 120 x 70 top 1250 em 1,5 · papel `--hl` "ESSA SEMANA?" Anton 92, rot −3°, x 60 top 1405, colado em 2,25.

**Mapa.** Parede. "9 SHOWS" letras de resgate 150, x 54 top 300, S+0,05. Papel `--bg` "EM 8 CIDADES · 24/11 A 29/11" Anton 50 `--hl`, rot 2°, x 60 top 520, colado S+0,4. Xerox do mapa x 60 y 660, 960x800, borda rasgada, rot 3° → −1,2° e escala 1,08 → 1 pop(S, 0,35); meio-tom por cima; três fitas `--paper2` 78%. Rótulos `--hl` com borda 3, rot ±3° alternado.

**Dia.** Clipe + meio-tom `--bg` 30% + escurecimento 0,75 / 0,35 / 0,7. Dia em letras de resgate 150, x 50 top 300, em S. Data em papel `--paper` Anton 80, rot −4°, direita 50 top 450, colado S+0,25. Lista x 40, largura 1000, RY 600, RH 930, ROW 96, GAP 16, HXmax 800. Tiras rasgadas `--paper2` (aberta `--paper`), entram translateX −1150 → 0 enter(S+0,28+0,07i, 0,45); fechadas com rot ±1,2° e recuo de 24 px nas ímpares. Na troca, o card novo é "colado": escala 1,035 → 1 pop(troca, 0,4). Aberto: cidade Anton `min(118, 920/((len+1,2)·0,47))` com "/UF" em `--alert`; logo `clamp(HX−fs−170, 120, 330)` sem aro; banda Playfair itálico 900 60; @ Inter 700 32; casa Inter 600 30; recorte "ÀS 23H" Anton 56 `--hl` sobre `--bg`.

**Fecho.** Parede. Selo colado em papel, rot 8°, direita 70 top 300, S+0,45. "TODA" letras 190, x 50 top 650, S+0,05. "TERÇA TEM" 140, top 900, S+0,3. Papel `--bg` "SEGUE @SMUFDPJ" Anton 100 `--hl`, rot −2,5°, x 50 top 1140, S+0,75. Papel `--paper` com URL, rot 1,5°, x 70 top 1340, S+1,15.

---

## D · Tipográfico
Linguagem: texto vazado (contorno, sem preenchimento) gigante, faixas de ponta a ponta (x 0–1080), entradas laterais `translateX(±1100 → 0)` com enter(0,32) alternando o lado. Assinatura `--paper`, `--bg` no fecho.

**Abertura.** Escurecimento 0,45 / 0 (25%) / 0,75 / 0,9. "ONDE TEM" Anton 200 vazado `--paper` 4 px, x 40 top 860, entra da esquerda em 0,1. Faixa `--hl` y 1070, 230 px, scaleX enter(0,75, 0,25) da esquerda, com "PEARL JAM" Anton 214 `--bg`. "AO VIVO" vazado, direita 40 top 1300, entra da direita em 1,5. Faixa `--paper` y 296, 130 px, scaleX da direita em 2,25, com "ESSA SEMANA?" Anton 110 `--bg` centrado.

**Mapa.** Fundo `--bg`. Número vazado `--hl` 6 px, Anton 580 (2 dígitos: 420), x 30 top 300, escala 1,3 → 1 pop(S, 0,45). À direita (x 50 + largura do número): "SHOWS" Anton 150 `--paper` S+0,1 · "8 CIDADES" Anton 72 `--hl` S+0,22 · datas Inter 800 40 S+0,34, todos entrando da direita. Mapa de ponta a ponta y 830, 1080x690, entre dois filetes `--hl` de 6 px (scaleX enter(S+0,15, 0,4)). Terra `--paper` 10%, contorno `--paper` 55%, rótulo `--paper`/`--bg`.

**Dia.** Escurecimento 0,85 / 0,7 / 0,55 / 0,85. Dia vazado `--hl` 5 px, Anton `min(300, 1000/(len·0,47))` (280 se tiver letra acentuada, pra o acento não tocar a assinatura), x 36 top 370, escala 1,25 → 1 pop(S, 0,45). Linha da data logo abaixo: data Anton 72 `--hl` à esquerda, "4 SHOWS" Inter 800 30 à direita, entra da esquerda S+0,15. Faixas x 0, largura 1080, RY 730, RH 800, ROW 92, GAP 0, HXmax 700, alternando `--paper`/`--paper2`; aberta `--hl`. Entram alternando lado, enter(S+0,28+0,06i, 0,4). Fechada: número "01" Inter 800 26, cidade Anton 52, banda Inter 700 28, hora Anton 48. Aberta: "02 / 04" Inter 800 26; cidade Anton `min(130, 1000/(len·0,47))`; logo `clamp(HX−fs−120, 120, 260)`; banda Inter 800 56; com HX < 420 (5+ shows): sem índice, padding 18/20, cidade ≤ HX·0,24, banda 46, logo `clamp(HX−fs−50, 120, 260)`; @; casa com filete; hora vazada `--bg` 4 px, Anton `min(170, logo·0,9)`.

**Fecho.** Fundo `--hl`. Três linhas Anton 330: "TODA" vazado `--bg` 6 px top 330 (esquerda, S+0,05) · "TERÇA" cheio top 620 (direita, S+0,2) · "TEM" vazado top 910 (esquerda, S+0,35). Selo 240 px x 740 top 960, pop(S+0,5, 0,45), giro `(T−S)·10° − 10°`. Faixa `--bg` y 1240, 150 px, scaleX enter(S+0,75, 0,3), "SEGUE @SMUFDPJ" Anton 112 `--hl` centrado. URL Inter 800 40 `--bg` centrada top 1420, enter(S+1,15, 0,3).

---

## Dados que o renderizador precisa além do JSON atual
- `lat`/`lon` por show (o protótipo usa tabela interna de cidades).
- `voz` por show (offset da fala dentro da cena do dia) e duração de cada cena vinda da narração.
- `clipe` por banda (arquivo, trecho início/fim). Sem clipe, usa o logo.
- `layout` (A/B/C/D) e `paleta` (amarelo/laranja/azul) da semana, pro rodízio.
