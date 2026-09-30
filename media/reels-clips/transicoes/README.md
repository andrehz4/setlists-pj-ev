# Transições do reel (trechos de clipe de 1 a 3 s)

Acervo SEPARADO do `clips.json` (fundo dos blocos). Aqui ficam cortes curtos que entram ENTRE as cenas do reel, como
passagem. Ainda em teste: nada daqui entra no reel publicado até o Andre aprovar (flag `REEL_TRANSICOES`, desligada).

## Como entra um trecho

1. O Andre baixa e corta no baixa-clipehz (http://localhost:8790, aba Cortar). O corte sai em
   `/Users/andrehz/Documents/Githubhz/baixa-clipehz/downloads/<nome>_corte_<ini>-<fim>.mp4` (corte rápido, pode ter
   até ~1 s de sobra no começo).
2. O Claude importa, acertando o ponto exato se preciso:
   `node scripts/publish/reel/importar-transicao.mjs <arquivo> <nome-curto> [--musica "Alive"] [--ini 0.4] [--fim 2.1] [--tags mike,aovivo]`
3. O importador SEMPRE tira o som (direito autoral: o IG detecta clipe pelo áudio), converte pra H.264 até 1080p,
   30 fps, e registra no `transicoes.json`.

## Campos do transicoes.json

`file` (nome do mp4 aqui), `musica`, `origem` (arquivo de onde saiu), `dur` (segundos), `tags` (mesmas das notícias).
