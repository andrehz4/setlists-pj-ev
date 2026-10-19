# Testes de regressão

Todo bug que chegou ao ar (ou quase) ganha um teste aqui, pra não voltar. Regra: cada arquivo prova os dois lados,
a regra antiga reproduzindo o erro e o código atual fazendo o certo. Roda junto com `npm test`.

| Arquivo | Bug | Data |
|---|---|---|
| `recorte-rosto.test.mjs` | story e reel com o rosto cortado fora (fotos reais em `fixtures/`) | 18/10/2026 |
| `reel-sem-fantasma.test.mjs` | reel com fundo "CLIPE" e selo "CLIPE · MUDO" em notícia sem foto | 18/10/2026 |
