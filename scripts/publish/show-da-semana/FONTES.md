# Fontes do Show da Semana: de onde vem cada dado e como baixar de novo

Leia isto antes de coletar qualquer coisa. Tudo abaixo já foi baixado uma vez (25/11/2026) e mora no SSD do Mac,
FORA do git (repo público: texto de fã e arte de terceiros não entram). Se a pasta sumir, os comandos refazem.

| Material | Fonte | Comando | Onde fica | Tamanho/tempo |
|---|---|---|---|---|
| Pôster (até 3 por show), artista do pôster, setlist com bis, galeria | site oficial pearljam.com/tour/history | `node scripts/publish/show-da-semana/oficial.mjs` e depois `... oficial.mjs --posters` | `media/show-da-semana/oficial/<ano>.json` e `media/show-da-semana/posters/` | 1.104 shows; ~20 min; pôsteres ~0,5 MB cada |
| História da noite (notas da moderação + setlist) | fórum oficial community.pearljam.com, tópicos "Fanviews Here" | `node scripts/publish/show-da-semana/forum.mjs` (`--resumo` só conta) | `media/show-da-semana/forum/<ano>.json` | 702 shows; ~10 min |
| Setlist de toda a carreira, show e bis separados (PJ + Eddie solo) | API do setlist.fm | ver seção 3 | `media/setlistfm/by-year/<ano>.json` (ESTE vai pro git; termos do setlist.fm pedem crédito) | 1.447 shows |
| Shows que o site cobre (Brasil + alguns de fora), pôster e fotos próprias | curadoria do dono da página | (manual) | `dados/shows.js`, `media/<id>/poster.jpg`, `photo-N.jpg` | 28 shows |

## 1. Site oficial (pôsteres): `oficial.mjs`

- Não existe API pública de pôsteres no pearljam.com. Mas cada página `https://pearljam.com/tour/history/show/<slug>`
  traz no HTML um JSON embutido `"show":{...}` (o mesmo que o site usa pra se desenhar) com `poster_file`,
  `poster_2_file`, `poster_3_file` (alta), `poster_artist*`, `sets` (Set 1, Encore 1, Encore 2...) e `gallery_id`.
- A lista de todos os shows (slug + data) vem embutida em `https://pearljam.com/tour/history`, em pares
  `"slug":"...","rawdate":"AAAA-MM-DD"`. ATENÇÃO: slug pode ser `sports-hall-prague` (sem número) ou
  `so-paulo-1737674941`; um filtro que exigia número no fim perdeu 465 shows na 1ª coleta (1996 inteiro).
- O coletor baixa o HTML direto (fetch, sem navegador), recorta o JSON contando chaves (`objetoApos`), 1 página
  por segundo. Rodar de novo só baixa os shows que faltam; `--posters` só baixa imagem que ainda não existe.
- Nome do arquivo: `<data>-<slug>[-2|-3].<ext>`, então a pasta fica em ordem cronológica.
- Artista do pôster só vem preenchido de 2018 em diante; antes, crédito = "Pôster oficial".
- Google Imagens NÃO serve: a Custom Search JSON API fechou pra contas novas e desliga em 01/01/2027.

## 2. Fórum oficial (histórias): `forum.mjs`

- O fórum (Vanilla) tem API v2 pública, sem login, pra leitura: `https://community.pearljam.com/api/v2`.
- Busca: `/search?query=fanviews&recordTypes=discussion&categoryID=5&limit=100&page=N` (categoria 5 = "Given To
  Fly (live)"). A busca corta o texto, então cada tópico é baixado inteiro em `/discussions/<id>` (campo `body`, HTML).
- A listagem por categoria para em 10.000 resultados (100 páginas); por isso a coleta parte da busca.
- O 1º post é da moderação (usuária Sea, id 67, e outros): setlist, horário de palco, música de entrada e notas
  entre as músicas. De 2011 em diante as notas são ricas; de 2005 a 2010 são quase só setlist (a história ali está
  nos comentários dos fãs, `/comments?discussionID=<id>`, ainda não coletados). Antes de 2005 quase não há tópico.
- Pelo navegador o fórum pede login (o Chrome do dono está logado), mas a API não precisa. Nunca postar nem
  mexer na conta.

## 3. setlist.fm (setlists da carreira)

- API oficial com chave (`SETLISTFM_API_KEY`, secret do GitHub; nunca no código). Artistas por MBID:
  Pearl Jam `83b9cbe7-9857-49e2-ab8e-b57b01038103`, Eddie Vedder `1a60d6dd-9d3e-40fc-a66d-3184f9ee0d61`.
- O dump foi feito por `scripts/news/setlistfm-dump.mjs`, apagado na limpeza do commit abeb1a660. Recuperar com
  `git show e6132811d:scripts/news/setlistfm-dump.mjs > /tmp/setlistfm-dump.mjs` e rodar com a chave.
  Alternativa no GitHub: workflow manual `estudo-setlistfm.yml` (baixa tudo como artifact).
- `scripts/news/setlistfm.mjs` é outra coisa (coleta de notícias), não refaz o dump.
- Crédito obrigatório: "Setlists via setlist.fm" (está em `media/setlistfm/index.json`).

## 4. Qual fonte vale quando divergem

1. Setlist: `dados/shows.js` (conferido pelo dono) > site oficial > setlist.fm > fórum.
2. Pôster: `media/<id>/poster.jpg` do repo > site oficial.
3. História: notas da moderação do fórum, site oficial, imprensa, Wikipedia com referência. Comentário de fã só
   como pista ou "relato de fã" sem nome de usuário (regras no README).

## Cópia de segurança

As pastas `forum/`, `oficial/` e `posters/` só existem no Mac. Os JSONs são pequenos e podem ir pro repo PRIVADO
`/Users/andrehz/Documents/Githubhz/fabrica-quiz` (nunca pro público). Os pôsteres (centenas de MB) vão pro Google
Drive, não pro git.
