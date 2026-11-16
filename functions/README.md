# functions (Cloudflare Pages Functions)

Páginas do fórum legíveis pelo Google. Módulo apartado: só liga com a variável `FORUM_SEO=1` no painel do
Cloudflare Pages.

| Rota | Arquivo |
|---|---|
| `GET /t/<id>` | `t/[id].js`: tópico renderizado no servidor (título, corpo, respostas, JSON-LD `DiscussionForumPosting`). |
| `GET /sitemap-forum.xml` | `sitemap-forum.xml.js`: todos os tópicos (citado no `robots.txt`). |

`_lib/forum-seo.js` tem as funções puras (JSON da API vira HTML/XML). `_lib/cache.js` guarda na borda só resposta 200
(1 h a 6 h); com a API fora devolve 503 + Retry-After, nunca cacheado. Testes: `scripts/forum-seo/forum-seo.test.mjs`.

## Contador do gerador de setlist (Ibirapuera)

Contador interno (evento, noite 20/22 e se veio do navegador do Instagram) mais o primeiro nome digitado no gerador,
pro Andre acompanhar. Sem IP nem cookie. Módulo apartado: sem o binding `CONTADOR_DB` a coleta responde 204 e não
grava; sem os segredos `PAINEL_USUARIO` e `PAINEL_SENHA` o painel responde 503 e nunca abre.

| Rota | Arquivo |
|---|---|
| `POST /api/contador` | `api/contador.js`: soma um evento (lista fechada, corpo até 200 bytes, só do próprio site, robô fora). |
| `GET /painel-setlist` | `painel-setlist.js`: painel privado com usuário e senha (HTTP Basic Auth, 401 sem credencial), noindex, sem cache, atualiza a cada 30 s (`?json=1` devolve os números). |

- Quem manda os eventos: `../setlist-ibirapuera/contador.js` (escuta cliques, `sendBeacon`, falha em silêncio).
- Regras e chaves: `_lib/contador.js`. Desenho do painel: `_lib/painel-setlist-desenho.js` e `_lib/painel-setlist-pagina.js`.
- Banco: D1 `setlist-contador` (id `f7c1869d-5f24-4056-9240-a06db5bdc44d`), tabela `contador(chave, n)`, soma atômica
  (`n = n + 1`). Criar a tabela de novo: `npx wrangler d1 execute setlist-contador --remote --command "<SQL_TABELA do _lib/contador.js>"`.
- Ligação (painel do Cloudflare, Pages, projeto `setlists-pj-ev`, Settings, Bindings): D1 database, nome da variável
  `CONTADOR_DB`, banco `setlist-contador`. Vale a partir do deploy seguinte.
- Nomes: `_lib/contador-nomes.js`, tabela `nomes(nome, barrado, noite, evento, dentro_app, quando)` no mesmo banco
  (criada sob demanda; à mão: `npx wrangler d1 execute setlist-contador --remote --command "<SQL_TABELA_NOMES>"`).
  Vai com os eventos sorteou, baixou_video, baixou_imagem e compartilhou; `barrado = 1` é o texto bruto que o filtro
  do gerador recusou. O painel mostra os últimos 100 e sempre escapa o HTML (nome é entrada de visitante).
- Acesso ao painel: `_lib/painel-acesso.js`, segredos `PAINEL_USUARIO` e `PAINEL_SENHA` (trocar a senha, no app
  Terminal: `npx wrangler pages secret put PAINEL_SENHA --project-name setlists-pj-ev`). Segredo novo só vale no
  deploy seguinte. O acesso antigo por `?k=<chave>` foi removido em 16/11/2026.
- Testes: `scripts/contador-setlist/`.
