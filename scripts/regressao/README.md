# Testes de regressão

Todo bug que chegou ao ar (ou quase) ganha um teste aqui, pra não voltar. Regra: cada arquivo prova os dois lados,
a regra antiga reproduzindo o erro e o código atual fazendo o certo. Roda junto com `npm test`.

| Arquivo | Bug | Data |
|---|---|---|
| `recorte-rosto.test.mjs` | story e reel com o rosto cortado fora (fotos reais em `fixtures/`) | 18/10/2026 |
| `reel-sem-fantasma.test.mjs` | reel com fundo "CLIPE" e selo "CLIPE · MUDO" em notícia sem foto | 18/10/2026 |
| `card-letra-cortada.test.mjs` | card do reel comendo a última letra da manchete ("ENTROI") | 18/10/2026 |
| `selo-mudo.test.mjs` | selo "CLIPE · MUDO" na abertura de um reel que tem som | 18/10/2026 |
| `pronuncia-narracao.test.mjs` | voz lendo "Fá" (frase começando com Fã) e "Mungo" (mundo Pearl Jam) | 18/10/2026 |
| `selo-final-animado.test.mjs` | selo animado do final virando PNG parado com ffmpeg 8+ (-vsync removido) | 18/10/2026 |
| `fala-sobreposta.test.mjs` | narração da manchete longa cortada pela próxima fala (teto de 9 s) | 18/10/2026 |
| `agenda-arte-semana.test.mjs` | agenda: data vermelha sumindo no fundo vermelho, "+ N shows" no rodapé, cidade grudada no @ | 18/10/2026 |
| `voz-acima-da-musica.test.mjs` | reel narrado com a música 2,3 dB acima da voz (mede com as 16 trilhas) | 19/10/2026 |
| `narracao-chave-reserva.test.mjs` | reel ia sair mudo com crédito sobrando na conta da agenda (usa a chave reserva) | 19/10/2026 |
