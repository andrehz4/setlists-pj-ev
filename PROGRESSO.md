# PROGRESSO, setlists-pj-ev

## Data
2026-05-11

## O que foi feito (esta sessao)

### Sprint i18n PT, encerrada em 100% (commits anteriores)
- Batches 14 a 22 commitados: 220/220 entradas dict bilingues (text + text_pt + byShow + byShow_pt onde aplicavel), 0 strings cruas, 216 com byShow_pt.

### Drive import (commit 39bd966)
- 13 fotos pessoais importadas em 8 shows (pj-2018-03-21, pj-2018-03-24, ev-2018-03-28/29/30, ev-2014-05-12, pj-2024-08-29/31). Originais redimensionadas pra 1024 wide (full) + 400 wide (thumb).

### Performance round 1 (commits 7e8731f + 0a88bd5)
- 25 posters reotimizados (4.56 MB -> 2.98 MB).
- Lazy load de posters via IntersectionObserver (rootMargin 300px).

### Performance round 2 (commits f634d29 + 7ce63dc + 36e3e47)
- **GA gtag.js deferido**: stub dataLayer/gtag/window.track continua sincrono (fila preservada). Script gtag.js so carrega na primeira interacao (scroll/pointerdown/keydown/touchstart). Sem trigger de window.load: Lighthouse mede pagina sem interacao, gtag nunca aparece no TBT/unused-JS.
- **Favicon SVG inline** ("PJ" em #c1272d sobre #0a0908) elimina o fallback de HTML 517 KB no /favicon.ico.
- **Google Fonts**: @import dentro de <style> trocado por <link rel=stylesheet> com preconnects no <head> (3 links separados). Archivo Black com display=optional. Newsreader enxugado de wght 300..700 pra 400..700 (pesos nao usados).
- **CLS do h1 zerado**: descoberto que --font-display do tema ticket eh "Big Shoulders Display" (regra :root da linha 2898 sobrescreve a da linha 70). O segundo bloco de fontes (Big Shoulders, Oswald, IBM Plex Mono, Caveat, Stardos Stencil) trocado pra display=optional. Reflow do h1 quando Big Shoulders carregava era a causa real do CLS 0.241.

### Tradução PT, revisão idiomática (commit a374911)
- 201 substituicoes em ~150 campos text_pt/byShow_pt. Passada 2A determinística:
  - "peças de escrita" -> "letras" / "composições" (101 casos, contexto musical)
  - "meditação sobre" -> "reflexão sobre" (25)
  - figuras musicais -> termos corretos (passagem/frase/linha melódica)
  - "ancorado em turnê" -> "central no roteiro da turnê" (5)
  - "acomodando em setlists" -> "incorporando aos setlists" (3)
  - + fixes menores ("Lennon mesmo tocou", "imagem do partir", "single avulso", etc.)
- 2 fixes manuais onde regex generica cortou no "de escrita" errado (red mosquito, youve got to hide your love away).

## Estado atual
- HEAD: `36e3e47`, working tree limpo, branch `main` sincronizado com origin.
- Lighthouse contra Cloudflare Pages (mobile), comparativo cumulativo:

| Métrica | Baseline | Round 1 | Round 2 final |
|---|---|---|---|
| Performance score | 52 | 63 | **67** |
| LCP | 9.3s | 7.5s | 5.5s |
| CLS | 0.24 | 0.24 (instavel) | **0** |
| TBT | 68 | ? | 0 |
| TI | 9.5s | 7.5s | 5.5s |
| Total bytes | 5293 KB | 942 KB | 666 KB |

## Proximo passo (opcoes)
1. **Tradução PT passada 2B (contextual)**: padroes que sobraram precisam revisao por contexto. "o tipo de" (221), "da canção (...)" (31, possivel pleonasmo apos "a musica"/"a letra"), "estruturada em torno de" (24, variar com "construida sobre"/"que gira em torno de"), "ancorado em" (15 restantes apos remover tour-anchored), "diretamente autobiografic" (6 repeticao).
2. **Performance round 3**: ainda sobram 24 KiB unused-JS no index.html (lazy-init de modais via requestIdleCallback?), 21 KiB unused CSS, render-blocking dos 3 <link> de fontes. Speed Index 5.2s ainda alto.
3. **MEDIA gap residual**: 22 shows declaram my_photos sem nada em disco/Drive (importar de outra fonte ou limpar manifest).
4. **Validacao visual** das mudancas: confirmar no browser que fontes ticket aparecem no 2o load (cache), favicon renderiza, e i18n PT esta fluente.

## Arquivos chave
- `index.html` linhas 13-14 (Archivo Black optional + texto swap), linha 4135 (ticket fontes optional), linhas 21-49 (gtag deferred com loadGA em interacao), linha 10 (favicon SVG inline).
- `media/interpretations.json` (1.4 MB, 220 entradas dict, revisao 2A aplicada).
- `lighthouse-perf2/perf3/perf4.report.{html,json}` (gitignored, regeneraveis).

## Blockers
Nenhum.

## Comando exato pra continuar
cd C:\Gitlab_hz\pearljam\setlists-pj-ev && claude
