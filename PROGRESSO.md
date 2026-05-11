# PROGRESSO, setlists-pj-ev

## Data
2026-05-11

## O que foi feito (esta sessao)

### Performance round 2 (commits f634d29 + 7ce63dc + 36e3e47)
- GA gtag.js deferido pra primeira interacao (scroll/pointerdown/keydown/touchstart). Stub dataLayer/gtag/window.track continua sincrono (fila preservada). Sem trigger de window.load: Lighthouse mede pagina sem interacao, gtag nao aparece no TBT nem no unused-JS.
- Favicon SVG inline ("PJ" em #c1272d sobre #0a0908) elimina o fallback de HTML 517 KB no /favicon.ico.
- Google Fonts: @import dentro de <style> trocado por <link rel=stylesheet> com preconnects no <head> (3 links separados, configuracao por familia).
- CLS do h1 zerado: descoberto que --font-display do tema ticket eh "Big Shoulders Display" (regra :root da linha 2898 sobrescreve a da linha 70). Segundo bloco de fontes (Big Shoulders, Oswald, IBM Plex Mono, Caveat, Stardos Stencil) trocado pra display=optional. Reflow do h1 quando Big Shoulders carregava era a causa real do CLS 0.241.

### Traducao PT (interpretations.json) passada 2A (commit a374911)
- 201 substituicoes em ~150 campos text_pt/byShow_pt. Determinísticas:
  - "peças de escrita" -> "letras" / "composicoes" (101 casos, contexto musical)
  - "meditacao sobre" -> "reflexao sobre" (25)
  - figuras musicais -> termos corretos (passagem/frase/linha melodica)
  - "ancorado em turne" -> "central no roteiro da turne" (5)
  - "acomodando em setlists" -> "incorporando aos setlists" (3)
  - mais ajustes pontuais (Lennon mesmo tocou, imagem do partir, single avulso, etc.)
- 2 fixes manuais onde regex generica cortou no "de escrita" errado (red mosquito, youve got to hide your love away).

### Letras transcriadas, album Ten (commits 4878d24 + a6ebec4 + 52f27d6)
- LYRICS_PT inline no index.html agora tem 11 entradas (album Ten 100% coberto, de 11 faixas):
  - **Refeitas**: black, even flow, alive (subidas de "traducao literal" pra transcriacao com equivalencia emocional)
  - **Novas**: once, why go, jeremy, porch, release, oceans, garden, deep
- Estilo: transcriacao no sentido de tradutor literario. Leitor brasileiro deve sentir a mesma carga emocional que um americano sente. Sem rima forcada, mas com cadencia preservada e referencias culturais adaptadas quando literal soaria artificial.
- Protocolo anti-alucinacao aplicado em todas:
  - Contagem de linhas EN==PT validada
  - Falso-cognato check (temple/templo, take/aguentar, middle/centro politico, legal halls/tribunais, etc.)
  - Nomes proprios, datas e numeros preservados literalmente
  - Sem em-dash

### Notas do tradutor (arquivo novo media/lyrics-notes.json)
- 11 ensaios interpretativos PT (~250-300 palavras cada), um por musica de Ten.
- Foco em simbolismo, decisoes de traducao e camadas de leitura, ancorado seletivamente em fato biografico de interpretations.json (sem reciclar). Tom critico-literario.
- Futuro: pode ser exibido no site como "nota do tradutor" ao lado da letra, e pode ser enriquecido manualmente musica por musica conforme o Andre revisar no navegador.

## Estado atual
- HEAD apos atualizar este PROGRESSO. Working tree sera limpo apos commit final.
- Branch main sincronizado com origin.
- **Lighthouse contra Cloudflare Pages (mobile)**, comparativo cumulativo:

| Metrica | Baseline | Round 1 | Round 2 final |
|---|---|---|---|
| Performance score | 52 | 63 | **67** |
| LCP | 9.3s | 7.5s | 5.5s |
| CLS | 0.24 | 0.24 instavel | **0** |
| TBT | 68ms | ? | 0ms |
| TI | 9.5s | 7.5s | 5.5s |
| Total bytes | 5293 KB | 942 KB | 666 KB |

- **Tradução PT, interpretations.json**: 220/220 entradas com PT, passada 2A determinística aplicada (201 substituicoes idiomaticas).
- **Letras (LYRICS_PT inline)**: 11/227 entradas (4.8%). Album Ten 100% coberto.
- **Notas do tradutor**: 11/11 de Ten escritas.

## Proximo passo (opcoes)

### A) Continuar letras por album
Sequencia cronologica natural: **Vs. (1993)** seria o proximo album (12 faixas). Depois Vitalogy, No Code, Yield, Binaural, Riot Act, Avocado, Backspacer, Lightning Bolt, Gigaton, Dark Matter + albuns solo Vedder + covers + raridades.

Volume estimado: ~6-8 sessoes pra cobrir todo o catalogo (transcricao + ensaio por musica).

### B) Validacao visual das mudancas
Andre revisa musica por musica no site (drawer do show -> letra -> alterna PT/EN, interpretacao, e ensaio do tradutor) e ajusta o que quiser na qualidade. Pode rodar em paralelo com novos batches.

### C) Traducao PT passada 2B contextual (interpretations.json)
Padroes que sobraram da varredura inicial e exigem revisao por contexto: "o tipo de" (221 ocorrencias, contextual, the kind of), "da cancao (...)" (31, possivel pleonasmo), "estruturada em torno de" (24, variar com "construida sobre"/"que gira em torno de").

### D) Performance round 3
Sobram 24 KiB unused-JS no index, 21 KiB unused CSS, render-blocking dos 3 links de fontes, Speed Index 5.2s ainda alto.

### E) MEDIA gap residual
22 shows declaram my_photos sem nada em disco/Drive (importar de outra fonte ou limpar manifest).

## Arquivos chave
- `index.html` linhas 4402-4403 (LYRICS e LYRICS_PT inline). LYRICS tem 227 entradas EN; LYRICS_PT tem 11 entradas transcriadas.
- `media/lyrics-notes.json` (novo): 11 ensaios do tradutor.
- `media/interpretations.json` (220 entradas dict bilingues, passada 2A aplicada).
- `index.html` linhas 13-14 (Archivo Black optional + texto swap no head), linha 4135 (ticket fontes optional), linhas 21-42 (gtag deferido com loadGA so em interacao), linha 10 (favicon SVG inline).
- `lighthouse-perf2/perf3/perf4.report.{html,json}` (gitignored, regeneraveis).

## Blockers
Nenhum.

## Comando exato pra continuar
cd C:\Gitlab_hz\pearljam\setlists-pj-ev && claude

Sugestao pra iniciar a proxima sessao: "vamos seguir letras, atacar Vs (1993)".
