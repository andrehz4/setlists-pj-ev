# Transições do reel (trechos de clipe de 1 a 3 s)

Acervo SEPARADO do `clips.json` (fundo dos blocos). Aqui ficam cortes curtos que entram ENTRE as cenas do reel, como
passagem. Entra no reel só com a flag `REEL_TRANSICOES=1` no publish-reel.yml (desligada até o Andre aprovar).

## Como entra um trecho

1. O Andre corta no baixa-clipehz (http://localhost:8790, aba Cortes Reels): transição (1 a 3 s) ou **capa de reel**
   (pausa no quadro nítido, enquadra o guia 9:16, tecla C: corte de 1,5 s com o quadro no meio). O corte já sai exato,
   mudo, até 1080p e 30 fps em `/Users/andrehz/Documents/Githubhz/baixa-clipehz/downloads/transicoes/`.
2. O Claude traz pro projeto: `node scripts/publish/reel/trazer-do-baixa.mjs` (mostra) e `--aplicar` (copia e grava).
3. Corte avulso fora do baixa: `node scripts/publish/reel/importar-transicao.mjs <arquivo> <nome> [--ini s] [--fim s]`
   (tira o som e corta preciso).
4. **Automático (preferido):** `node scripts/publish/reel/acervo-auto.mjs <video> [--max 20]` acha transições com rosto
   (`t`), ação sem rosto (`a`) e capas de 4 s (`c`), com o recorte vertical seguindo o rosto (Apple Vision,
   `scripts/publish/reel/rosto/`), pula o que já está no acervo e gera folhas em `.momentos/<nome>/auto-*.jpg`. O
   Claude olha as folhas, descarta trecho com troca de câmera no meio ou repetido, e importa:
   `--importar t2,a1,c3 --musica "Even Flow"`. Depois preenche o `broll` de cada um.
   **Regras de curadoria:** fonte de no mínimo 720p (480p estica 4x no vertical e borra: World Wide Suicide e Oceans
   só existem em 480p no YouTube e ficaram de fora); descartar trecho com troca de câmera no meio, repetido ou dentro
   de uma capa; nada de imagem violenta ou sensível (do Do the Evolution só entraram fogo e luzes abstratos).
5. Só movimento, sem rosto: `node scripts/publish/reel/momentos.mjs <video>`.

## Como o reel usa (flag REEL_TRANSICOES=1, `scripts/publish/reel/transicoes.mjs`)

- Transição: 0,7 s de trecho por cima de cada troca de cena (não muda a duração; narração segue sincronizada).
- Abertura: a duração exata dela (com voz ~3,3 a 3,9 s, sem voz 3 s) dividida em 4 trechos. O trecho com `capa` cai
  com o quadro escolhido exatamente aos 2,4 s, que é a capa do reel (thumb_offset). Rodízio semanal.

## Campos do transicoes.json

`file` (nome do mp4 aqui), `musica`, `origem` (arquivo de onde saiu), `dur` (segundos), `tags` (mesmas das notícias),
`foco` (0 a 1, onde a ação está na horizontal; recorte 9:16), `capa` (segundo do quadro de capa dentro do corte),
`nota`/`motivo` (texto livre), `ini`/`fim` (posição no vídeo de origem; evita repetir trecho), `focoTrilha` (recorte
seguindo o rosto), `rosto` ({achou, cobertura}).

## B-roll (`broll`), pra achar trecho quando for editar

| Campo | Valores |
|---|---|
| `quem` | eddie, stone, jeff, mike, matt, banda, publico, baterista, guitarrista (sem nome quando não dá pra ter certeza), animacao, natureza |
| `plano` | close, medio, aberto |
| `acao` | canta, grita, guitarra, baixo, bateria, headbang, pula, stage-dive, mosh, crowd-surf, maos-pro-alto, giro, dança |
| `clima` | energia, intenso, calmo |
| `local` | palco, publico, estudio, natureza, rua |
| `era`, `fonte`, `descricao` | ano, de onde saiu, frase curta do que aparece |

Buscar: `node -e 'const d=require("./media/reels-clips/transicoes/transicoes.json");console.log(d.transicoes.filter(t=>t.broll.quem.includes("stone")).map(t=>t.file))'`
