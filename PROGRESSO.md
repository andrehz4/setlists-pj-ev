# PROGRESSO, setlists-pj-ev

## Data
2026-05-11

## Resumo da sessao (15 commits)

### Performance round 2 (3 commits)
- gtag.js deferido pra primeira interacao (scroll/pointerdown/keydown/touchstart). Stub gtag/dataLayer/window.track continua sincrono (fila preservada).
- Favicon SVG inline ("PJ" em #c1272d sobre #0a0908).
- Google Fonts: @import substituido por <link rel=stylesheet> com preconnects no <head>.
- CLS h1 zerado: --font-display do tema ticket eh "Big Shoulders Display", redefinido na linha 2898 do CSS. Segundo bloco de fontes (Big Shoulders, Oswald, IBM Plex Mono, Caveat, Stardos Stencil) trocado pra display=optional.

### Traducao PT interpretations.json passada 2A (1 commit)
- 201 substituicoes idiomaticas determinísticas (peças de escrita -> letras/composicoes, meditacao sobre -> reflexao sobre, figuras musicais -> termos corretos, ancorado em turne, acomodando em setlists, etc.).
- 2 fixes manuais onde regex generica cortou no "de escrita" errado.

### Letras transcriadas + ensaios do tradutor (10 commits)
- LYRICS_PT inline no index.html: 49 entradas (de 227 EN). Cobertura 21.6%.
- media/lyrics-notes.json: 49 ensaios interpretativos PT (240-290 palavras cada, 3-4 paragrafos, zero em-dash).
- Albuns completos: **Ten (11/11), Vs. (12/12), Vitalogy (13/14, 14a sem letra), No Code (13/13)**.
- Protocolo aplicado em todas: contagem de linhas EN==PT validada, falso-cognato check, nomes proprios e numeros preservados, sem em-dash.
- Estilo: transcriacao no nivel "equivalencia emocional/cultural", nao traducao literal. Leitor brasileiro deve sentir a mesma carga que um americano sente.

## Estado atual
- HEAD: `7b254c8` (apos commit deste PROGRESSO ficara mais a frente).
- Branch main sincronizado com origin.
- Lighthouse contra Cloudflare Pages (mobile): score **52 -> 67**, LCP 9.3s -> 5.5s, CLS 0.24 -> 0, TBT 68 -> 0, bytes 5293 KB -> 666 KB.
- Tradução PT interpretations.json: 220/220 entradas com PT, passada 2A aplicada.
- Letras: **49/227** (21.6%), 4 albuns completos.
- Notas do tradutor: 49 ensaios em media/lyrics-notes.json.

## Estrutura LYRICS_PT por album (cobertura atual)
- Ten (1991): 11/11
- Vs. (1993): 12/12
- Vitalogy (1994): 13/14 (faixa 14 'hey foxymophandlemama thats me' eh experimental sem letra)
- No Code (1996): 13/13

## Proximo passo
Continuar letras por album. Proximo album natural: **Yield (1998)**, 13 faixas:
1. Brain of J
2. Faithfull
3. No Way
4. Given to Fly
5. Wishlist
6. Pilate
7. Do the Evolution
8. Untitled (instrumental, sem letra)
9. MFC
10. Low Light
11. In Hiding
12. Push Me, Pull Me
13. All Those Yesterdays

Apos Yield, sequencia cronologica: Binaural (2000), Riot Act (2002), Pearl Jam/Avocado (2006), Backspacer (2009), Lightning Bolt (2013), Gigaton (2020), Dark Matter (2024) + albuns solo Vedder + covers + raridades.

## Outras frentes pendentes
- Traducao PT 2B contextual: "o tipo de" (221), "da cancao (...)" (31), "estruturada em torno de" (24).
- Performance round 3: 24 KiB unused-JS no index, 21 KiB unused CSS, render-blocking dos 3 links de fontes.
- MEDIA gap: 22 shows declaram my_photos sem nada em disco/Drive.
- Validacao visual: revisar musica por musica no site (letra + interpretacao + nota do tradutor) e ajustar manualmente o que precisar.

## Arquivos chave
- `index.html` linha 4402 (LYRICS EN, 227 entradas), linha 4403 (LYRICS_PT, 49 entradas).
- `media/lyrics-notes.json`: 49 ensaios do tradutor (~250-290 palavras cada).
- `media/interpretations.json`: 220 entradas bilingues (text + text_pt + byShow + byShow_pt onde aplicavel).
- `index.html` linhas 13-14 (Archivo Black optional + texto swap no head), linha 4135 (ticket fontes optional), linhas 21-42 (gtag deferido com loadGA so em interacao), linha 10 (favicon SVG inline).

## Blockers
Nenhum.

## Protocolo da transcriacao das letras (manter em proximas sessoes)
1. **Fonte canonica unica**: usar apenas o LYRICS inline do index.html. Nao buscar letras externas.
2. **Contagem de linhas casada**: cada linha EN tem 1 linha PT correspondente (validado por script Node antes de aplicar).
3. **Falso-cognato check**: lista mental dos classicos (temple/templo, take/aguentar, middle/centro, legal halls/tribunais, library, pretend, actually, sympathetic, etc.).
4. **Glossario consistente**: termos-imagem traduzidos igual em todas as ocorrencias da mesma letra.
5. **Nomes proprios, datas, numeros, marcas**: preservados literalmente. Sem licenca em fato.
6. **Sem em-dash** (—). Regra global do projeto.
7. **Estilo de transcriacao**: equivalencia emocional/cultural ("Carlos Renno traduzindo Cole Porter"). Nao literal, nao adaptada-leve, nao poetica-rimada.
8. **Ensaio por musica**: ~250-290 palavras, 3-4 paragrafos, foco em simbolismo/decisoes de traducao/camadas de leitura. Nao reciclar interpretations.json (que eh biografico/discografico). Ancorar em 1-2 fatos biograficos seletivos quando mudam a leitura.
9. **Backup antes de aplicar batch grande** (index.html.bak quando necessario).
10. **1 commit por album**, mensagem citando trecho por trecho as decisoes principais.

## Comando exato pra continuar
cd C:\Gitlab_hz\pearljam\setlists-pj-ev && claude
