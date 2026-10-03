# functions (Cloudflare Pages Functions)

Páginas do fórum legíveis pelo Google. Módulo apartado: só liga com a variável `FORUM_SEO=1` no painel do
Cloudflare Pages.

| Rota | Arquivo |
|---|---|
| `GET /t/<id>` | `t/[id].js`: tópico renderizado no servidor (título, corpo, respostas, JSON-LD `DiscussionForumPosting`). |
| `GET /sitemap-forum.xml` | `sitemap-forum.xml.js`: todos os tópicos (citado no `robots.txt`). |

`_lib/forum-seo.js` tem as funções puras (JSON da API vira HTML/XML). `_lib/cache.js` guarda na borda só resposta 200
(1 h a 6 h); com a API fora devolve 503 + Retry-After, nunca cacheado. Testes: `scripts/forum-seo/forum-seo.test.mjs`.
