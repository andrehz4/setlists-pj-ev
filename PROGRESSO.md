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

## Outras frentes pendentes (proximas sessoes)
- Retomada das my_photos 2015 show por show: usar `MEDIA_AUDIT_2026-05-11.md` como ponto de partida. Para cada show, baixar candidatos pra `media/_staging/`, Andre escolhe visualmente, move pra `mine/` e commita. Nunca importar bulk.
- Traducao PT 2B contextual em interpretations.json: "o tipo de" (221), "da cancao (...)" (31), "estruturada em torno de" (24).
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
