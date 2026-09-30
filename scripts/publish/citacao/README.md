# citacao: slide de citação "moldura" das cápsulas

Módulo apartado (Regra 0). Troca o slide de citação do carrossel das cápsulas do YouTube por um layout com
moldura na cor do ciclo, aspas grandes nos cantos, etiqueta `@smufdpj` no topo e, embaixo, a **foto redonda de
quem fala** + nome + contexto. Referência: post do @igormirandasite, aprovado pelo Andre em 2026-09-30.

## Liga e desliga

- `CAPSULA_CITACAO=moldura` no ambiente do `run-publish-capsula.mjs` (workflow `publish-capsula.yml`) liga.
- Sem a variável, sai o slide antigo (`buildQuoteSlide` em `slide-image.mjs`), sem nenhuma mudança.

## Arquivos

| Arquivo | Papel |
|---|---|
| `retratos.mjs` | lê o campo `autor` da citação ("Eddie Vedder, em 1990") e devolve nome, contexto e foto |
| `slide-citacao.mjs` | monta o SVG e grava o JPG (`buildQuoteSlideMoldura`, mesma assinatura do antigo + `seed`) |
| `build-retratos.mjs` | recorta os retratos a partir do catálogo (rodar só quando mudar foto/crop) |
| `citacao.test.mjs` | testes (entra no `npm test`) |
| `/media/band/retratos/retratos.json` | catálogo: pessoa, apelidos, foto de origem e recorte do rosto |
| `/media/band/retratos/<slug>-<n>.jpg` | retratos prontos 600x600, versionados |

## Regras

- A foto vem SEMPRE do catálogo curado, nunca da imagem da matéria (que pode ser ruim).
- Autor sem retrato (Letterman, "Pearl Jam", duas pessoas juntas) sai sem o círculo. Não é erro.
- Eddie tem 4 retratos; a escolha é fixa por cápsula (`seed` = id da cápsula), o carrossel inteiro usa a mesma.
- Trocar/adicionar retrato: editar `retratos.json` (crop = `[left, top, lado]` na foto original de
  `media/band/subjects/`), rodar `node scripts/publish/citacao/build-retratos.mjs` e `npm test`.
- Rosto com menos de ~110 px na foto original borra no círculo; escolher outra.
- Arquivos `.mjs` daqui têm teto de 150 linhas (teste).
