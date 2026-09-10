# Cápsulas do YouTube

Ferramentas pra transformar vídeos de PJ (entrevistas, docs, conversas, principalmente em outras línguas) em matérias ORIGINAIS PT-BR pro pipeline de notícias. O vídeo é só matéria-prima; o post é 100% nosso.

Roda LOCAL (o yt-dlp precisa dos cookies do navegador; no GitHub Actions o YouTube bloqueia por bot-detection). Precisa `yt-dlp` instalado (`brew install yt-dlp`).

## Fluxo de curadoria (reutilizável)

```bash
# 1. descobre candidatos (buscas multi-língua no yt-dlp, sem API key)
node scripts/news/youtube/descobre.mjs
#    -> /tmp/yt-candidatos.json  (edite as QUERIES no topo do script pra ampliar)

# 2. galeria visual pra curar: baixa thumbnails, abre HTML com botão de descartar
node scripts/news/youtube/galeria.mjs
#    -> descarta as ruins, clica "Gerar lista das que sobraram", cola a lista
```

As thumbnails são só REFERÊNCIA de curadoria (ficam em /tmp, não vão pro repo). Pra aumentar o acervo de fotos, a versão original de cada foto boa é buscada de fonte adequada, não recortada da thumbnail do criador.

## Seleção atual

`_selecao.json` = vídeos aprovados pra virar cápsula (curados manualmente pelo Andre). Campo `status`: pendente / extraido / publicado.

## Regra editorial (curador)

- Escrever 100% com nossas palavras, voz do @smufdpj, PT-BR.
- NUNCA incluir: nome do canal do YouTube, "se inscreve/like/comenta", saudações e bordões do apresentador, patrocínio, vinheta, autopromoção. A legenda automática captura isso; o curador joga fora.
- Atribuir só à fonte original jornalística quando agrega e está clara (ex: "em entrevista ao Howard Stern", "no Maracanã, 2015"), nunca ao canal de reupload.
- Aspas fiéis ao sentido (legenda automática erra; não citar como literal se duvidoso).
- Pegar a legenda no IDIOMA ORIGINAL do áudio (a tradução automática pt do YouTube falha no download); o Claude traduz/transforma.

## Próximo (a implementar)

Extrator (`youtube-extract.mjs`, porta o `legendas.mjs` do projeto baixa-clipehz) -> acervo `media/news/youtube-acervo/` -> curador Claude dedicado -> fila de rascunho -> publica IG+FB às 20h BRT.
