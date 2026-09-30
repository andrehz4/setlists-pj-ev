# citacao: slide de citação das cápsulas

Módulo apartado (Regra 0). Troca o slide de citação do carrossel das cápsulas do YouTube pelos desenhos que o Claude
Design fez e o Andre aprovou em 2026-09-30. Todos mostram a **foto de quem fala** e o `@smufdpj`.

| Estilo | Desenho | Como é |
|---|---|---|
| `editorial` | 1c + seta 3d | moldura fina, @smufdpj cortando a linha de cima, citação em itálico centralizada, nome em caixa alta, círculo com foto (ou iniciais) cortando a linha de baixo, "ARRASTE" em pé + selo com seta na lateral |
| `revista` | 2b | foto em duotone (P&B x cor do dia) no alto, nome gigante em Anton, citação em itálico com barra; sem foto, o nome gigante faz o papel da imagem |

## Liga e desliga

`CAPSULA_CITACAO` no ambiente do `run-publish-capsula.mjs` (workflow `publish-capsula.yml`):

- `rodizio`: um estilo por dia (BRT), igual às capas. A cápsula inteira usa o mesmo estilo.
- `editorial` ou `revista`: força um estilo.
- vazio: slide antigo (`buildQuoteSlide` em `slide-image.mjs`), sem nenhuma mudança.

Se alguma citação não couber na revista (nome enorme sem foto), a cápsula inteira sai no editorial.

## Arquivos

| Arquivo | Papel |
|---|---|
| `slide-citacao.mjs` | escolhe o estilo do dia, junta contexto + fonte, grava o JPG (`buildQuoteSlideCitacao`) |
| `estilo-editorial.mjs` / `estilo-revista.mjs` | o SVG de cada estilo (coordenadas do desenho original, 1080x1350) |
| `paleta.mjs` | cores por cor do ciclo (fundo, destaque, claro, apagado) |
| `texto.mjs` | fontes, medida real de largura, quebra de linha equilibrada, iniciais |
| `retratos.mjs` | lê o `autor` ("Eddie Vedder, em 1990") e devolve nome, contexto e foto |
| `fontes.mjs` | de onde veio a fala, por vídeo |
| `build-retratos.mjs` | recorta os retratos do catálogo (rodar só quando mudar foto/crop) |
| `citacao.test.mjs` | testes (entra no `npm test`) |
| `/media/band/retratos/retratos.json` + `<slug>-<n>.jpg` | retratos curados, recortados no rosto |
| `/media/news/youtube-acervo/_fontes.json` | fonte de cada vídeo ("MTV, 1994") |

## Regras

- A foto vem SEMPRE do catálogo curado, nunca da imagem da matéria.
- Linha embaixo do nome = contexto do autor + fonte do vídeo ("em 1990 · Apple Music, 2024"), só o que existir.
- Fonte: o ano é de quando a fala aconteceu, não de quando o vídeo foi postado. Sem certeza, sem ano ou vazio.
  Vídeo novo no acervo: acrescentar a entrada no `_fontes.json` (sem entrada, sai sem fonte, não quebra).
- Trocar/adicionar retrato: editar `retratos.json`, rodar `node scripts/publish/citacao/build-retratos.mjs` e `npm test`.
  Rosto com menos de ~110 px na foto original borra no círculo.
- Fontes: Playfair itálica 400/500/700 em `media/fonts/`. A Playfair Black reta NÃO foi instalada de propósito,
  pra não mudar os slides antigos. No Mac: `npm run fontes:mac`.
- Referência do desenho: `/Users/andrehz/Downloads/Citacoes smufdpj.html` (export do Claude Design, fora do repo).
- Arquivos `.mjs` daqui têm teto de 150 linhas (teste).
