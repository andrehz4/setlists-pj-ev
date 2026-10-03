# scripts/contrib

Robô do painel de colaboradores (`colaborar.html` + `colab/`). Mapa completo do módulo, incluindo o backend:
`backend/app/contrib/README.md`. Roda no `contrib-curadoria.yml` a cada 10 min; sem o secret `CONTRIB_BOT_KEY`
termina em segundos sem fazer nada.

| Arquivo | Papel |
|---|---|
| `curar.mjs` | Curadoria por IA dos envios na fila. |
| `gemini-curador.mjs`, `midia.mjs`, `prompt-curadoria.md` | Chamada ao Gemini (ouve o áudio do vídeo, olha as fotos). |
| `veredito.mjs` | Análise da IA vira veredito final (funções puras, testadas). |
| `publicar.mjs` | Publica os aprovados às :30 no IG, FB e site (grava `media/news/index.json`, `img/`, `items/`). |
| `publicar-video.mjs`, `render.mjs`, `legenda-ass.mjs` | Vídeo do colaborador vira Reel com legenda queimada (libass). |
| `post.mjs` | Monta legenda, crédito e item do site. |
| `api.mjs` | Rotas do robô no backend e Telegram. |
| `git.mjs` | Delegam pro `scripts/lib/git.mjs`; `esperarRaw` espera o raw do GitHub servir o arquivo. |
| `smoke.mjs` | Fumaça com o Gemini de verdade (só no Actions). |
| `sync-terra-gentil.sh` | Copia o módulo pro backend do Terra Gentil (que é o que roda no Railway). |

Regra 0 vale aqui: arquivo com até 160 linhas e 130 colunas, testado em `curadoria.test.mjs`.
