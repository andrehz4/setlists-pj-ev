# Playbook: colocar um site no Google (SEO, Search Console, domínio, velocidade)

Aprendido no setlists-pj-ev (somaisumfadepearljam.com.br), setembro de 2026. Serve pra qualquer projeto
do Andre que precise aparecer na busca do Google. Os arquivos citados existem neste repo e podem ser
copiados como ponto de partida.

Situação de partida neste projeto: site no ar desde maio, 101 pessoas no GA em 4 meses, **zero visita
vinda do Google**, porque o Google não indexava nada. Em 3 dias ficou: 774 páginas no sitemap,
Lighthouse mobile SEO 100, velocidade 68 para 83, CLS 0,411 para 0,002, domínio próprio com
mudança de endereço confirmada no Search Console.

---

## 1. Checklist rápido (novo projeto)

1. Cada conteúdo tem uma URL própria **sem `#`**, com HTML completo já no servidor (seção 3).
2. Todas as páginas saem de um molde único: `<title>`, description, canonical, Open Graph, JSON-LD, breadcrumb, menu de seções e GA (seção 4).
3. A home tem links `<a href>` reais pros índices (ex: rodapé "Pra ler"). É por eles que o Google entra.
4. `sitemap.xml` lista tudo, e `robots.txt` aponta pro sitemap (seção 6).
5. Conteúdo que vem de API/banco é renderizado no servidor (Pages Functions) com cache de borda (seção 5).
6. Search Console: verificar, enviar sitemap e pedir indexação só das páginas-chave (seção 7).
7. GA4 em todas as páginas, carregado depois do load (seção 9).
8. Lighthouse mobile: CLS perto de 0, fontes sem travar a renderização, HTML leve (seção 10).
9. `og.jpg` 1200x630 bonito, feito a partir do próprio site (seção 11).
10. Domínio próprio desde cedo. Se trocar depois, seguir a seção 8 inteira.

---

## 2. Diagnóstico: o Google está vendo o site?

- **Search Console > Páginas**: quantas indexadas e o motivo das que não foram.
- **Search Console > Inspeção de URL**: "O URL está no Google" ou "não está", e o motivo.
  "O Google não reconhece o URL" quer dizer que ele nunca achou link pra essa página.
- **GA4 > Aquisição**: se "Organic Search" é zero, o site não aparece na busca.
- Busca manual `site:dominio.com.br` no Google.

Causas que encontramos aqui:
- **SPA com `#`**: tudo o que vem depois do `#` é ignorado pelo Google. `site.com/#news/123` é, pro Google, só `site.com/`.
- **Página que redireciona pra home**: as notícias `n/<id>.html` existiam só pra prévia social e mandavam
  o visitante pro `#news/<id>`. O Google seguia o redirect e descartava a página.
- **Home sem links reais**: menu feito em JS (botões com `data-view`) não conta como link pro robô.

---

## 3. Arquitetura: páginas estáticas geradas

O SPA continua sendo o site "de verdade" pro visitante. Em paralelo, um gerador escreve uma página estática
por conteúdo, só pra ser lida (visitante e Google).

| Conteúdo | URL | Gerador | Schema.org |
|---|---|---|---|
| Notícia | `/n/<id>.html` + índice `/noticias/` | `scripts/news/build-news-stubs.mjs` (roda no publish) | `NewsArticle` |
| Show | `/show/<id>.html` + `/show/` | `scripts/seo/build-seo-pages.mjs` | `MusicEvent` |
| Música | `/musica/<slug>.html` + `/musica/` | idem | (breadcrumb) |
| Disco | `/disco/<slug>.html` + `/disco/` | idem | `MusicAlbum` |
| Banda | `/banda/` | idem | (breadcrumb) |
| Tópico do fórum | `/t/<id>` (servidor) | `functions/t/[id].js` | `DiscussionForumPosting` |

Regras que funcionaram:
- **Texto completo na página**, não resumo. A notícia estática tem o texto inteiro, a fonte, a foto e um "leia também".
- **Conteúdo fino não ganha página**: música sem texto em PT ficou de fora (entraram 276). Página vazia atrapalha o site todo.
- **Direito autoral**: letra e cifra nunca vão pras páginas estáticas. Também tiramos as letras do HTML da home
  (ver seção 10). O Google indexaria letra de terceiros.
- **Teste de sincronia**: `scripts/seo/seo.test.mjs` regenera as páginas em memória e compara com o que está
  no disco. Se alguém mexer nos dados e esquecer de rodar o gerador, o teste falha.
- **Gerador idempotente**: rodar duas vezes seguidas não muda nada (fácil de revisar no diff).

---

## 4. Molde único de página

Arquivo: `/Users/andrehz/Documents/Githubhz/setlists-pj-ev/scripts/seo/layout.mjs` (90 linhas).
Toda página passa só o que muda (título, descrição, URL, JSON-LD, corpo) e ganha:

- `<html lang="pt-BR">`, `<title>Título | Nome do site</title>`, `<meta name="description">` com 150 a 160 caracteres.
- `<link rel="canonical">` com a URL absoluta definitiva (domínio final, https, sem `?`).
- `<meta name="robots" content="max-image-preview:large">`, que deixa o Google mostrar a foto grande.
- Open Graph completo (`og:type`, `og:title`, `og:description`, `og:url`, `og:image`, `og:locale=pt_BR`) e `twitter:card=summary_large_image`.
- JSON-LD: o tipo da página mais um `BreadcrumbList`. Escapar `<` como `<` dentro do JSON.
- **Menu de seções em toda página** (Início, Shows, Músicas, Discos, Notícias, Banda, Fórum): é por ele que o
  Google navega de uma seção pra outra.
- Trilha de navegação (breadcrumb visível) igual ao JSON-LD.
- CSS inline pequeno, sem fonte externa. A página estática é leve de propósito.
- Snippet do GA (seção 9).

A constante `SITE_BASE` fica em `scripts/seo/base.mjs`. Trocar o domínio é mudar uma linha e rodar os geradores.

---

## 5. Conteúdo vindo de API (fórum): renderizar no servidor

O fórum vive num backend (FastAPI no Railway), e a página `forum-topic.html` monta o tópico com JS. Pro Google:

- **Cloudflare Pages Functions** em `functions/`:
  - `functions/t/[id].js`: `GET /t/<id>` busca o tópico na API e devolve HTML pronto (título, corpo, respostas, JSON-LD).
  - `functions/sitemap-forum.xml.js`: sitemap dinâmico com todos os tópicos.
  - `functions/_lib/forum-seo.js`: funções puras (JSON para HTML/XML), testáveis em Node.
  - `functions/_lib/cache.js`: cache na borda (`caches.default`), 1h no tópico e 6h no sitemap. Só guarda resposta 200.
- **API fora do ar = 503 com `Retry-After: 600`**, nunca 404 nem página vazia. O Google volta depois sem tirar
  a página do índice. Resposta de erro nunca fica em cache.
- **Liga e desliga por flag**: variável `FORUM_SEO=1` no painel do Cloudflare Pages. Sem ela, a função chama
  `context.next()` e nada muda (regra 0: módulo apartado).
- O `forum-topic.html` interativo aponta o canonical pra `/t/<id>`, que é a versão que o Google deve guardar.
- Validar o `id` (UUID) antes de chamar a API, pra não virar proxy aberto.

Testes: `/Users/andrehz/Documents/Githubhz/setlists-pj-ev/scripts/forum-seo/`.

---

## 6. Sitemap e robots

- `sitemap.xml` com **seções marcadas** por comentário (`<!-- news:start -->`/`end`, `<!-- seo:start -->`/`end`).
  Cada gerador reescreve só a própria seção, então o publish de notícias e o gerador de SEO não se atropelam.
- Sitemap separado pro conteúdo dinâmico (`/sitemap-forum.xml`, gerado pela Function).
- `robots.txt`:
  ```
  User-agent: *
  Allow: /
  Allow: /media/news/img/
  Allow: /media/albums/*.jpg
  Disallow: /media/
  Sitemap: https://somaisumfadepearljam.com.br/sitemap.xml
  Sitemap: https://somaisumfadepearljam.com.br/sitemap-forum.xml
  ```
  Bloqueia a pasta de dados (`/media/` tem JSON de estado, letras etc.) mas libera as imagens que aparecem nas páginas.

---

## 7. Search Console, passo a passo

1. **Criar a propriedade** do tipo "Prefixo do URL" (`https://dominio/`).
2. **Verificar**: se o GA4 já está no site com a mesma conta Google, a verificação "via Google Analytics" é instantânea.
   (Com domínio no Cloudflare, dá pra usar também a propriedade "Domínio" via registro TXT.)
3. **Sitemaps**: enviar `sitemap.xml` e `sitemap-forum.xml`. O status deve ficar "Processado".
4. **Solicitar indexação** (Inspeção de URL > "Solicitar indexação") **só das páginas-chave**: home e índices
   (`/noticias/`, `/musica/`, `/show/`, `/disco/`, `/banda/`). As internas o Google acha pelos links e pelo sitemap.
   - A **cota diária é pequena**: na primeira sessão ela estourou depois de poucos pedidos. Priorizar.
   - Pedir de novo a mesma URL não acelera nada, diz o próprio Search Console.
   - Cada pedido roda um teste ao vivo de 1 a 2 minutos antes de confirmar.
5. **Acompanhar** em 1 a 2 semanas: Indexação > Páginas. Aqui a home já estava indexada 1 dia depois.

Dá pra fazer tudo isso pelo Claude in Chrome (o Andre logado no Chrome). A busca do topo do Search Console
("Inspecionar qualquer URL") aceita digitar a URL e Enter. Depois do modal de confirmação, apertar Escape
antes de digitar a próxima URL, senão o texto se perde.

---

## 8. Migração de domínio (ex: `*.pages.dev` para domínio próprio)

Ordem que funcionou (28/09/2026), sem perder nada:

1. **Registrar** o domínio (Registro.br, `.com.br`, 5 anos) e apontar os **servidores DNS pro Cloudflare**.
2. **Cloudflare Pages > Custom domains**: adicionar o domínio com e sem `www`. HTTPS sai automático.
3. **Código**: trocar a base em um lugar (`SITE_BASE`, `SITE` das Functions, canonicals e og da home, links em
   legendas e bots) e **rodar todos os geradores** (páginas, sitemaps). Aqui foram 774 páginas regeneradas num commit.
4. **Redirect 301 do endereço antigo**: Cloudflare > **Bulk Redirects** (nível de conta), preservando caminho e query.
   Testar com links profundos (notícia, show, tópico), não só a home.
5. **Backend e integrações que checam origem**:
   - CORS do backend com os dois endereços durante a transição (aqui: `SITE_ORIGINS` no Railway).
   - Google OAuth (Console do Google Cloud): adicionar a origem nova nas "Origens JavaScript autorizadas".
   - CORS do bucket (R2) com a origem nova.
   - Robôs que mandam header `Origin` podem continuar com o antigo, desde que o backend aceite os dois.
6. **Search Console**: criar e verificar a propriedade nova, enviar os sitemaps nela e, na propriedade ANTIGA,
   **Configurações > Mudança de endereço** apontando pra nova. Só é aceita com o 301 já funcionando.
7. **E-mail no domínio** (opcional): Cloudflare **Email Routing** (`contato@dominio` para o Gmail). Os registros MX e
   SPF do Cloudflare substituem o bloqueio de e-mail que o Registro.br cria. Leva alguns minutos em "Syncing" antes de "Enabled".
8. **Avisos pra gente**:
   - Login guardado no navegador é por endereço: quem estava logado no endereço antigo precisa entrar de novo.
   - Trocar o link da bio do Instagram e do Facebook e atualizar o catálogo do Hub HZ.

---

## 9. Métricas

- **GA4 em todas as páginas públicas** (SPA, páginas estáticas, fórum, `/t/`), com o mesmo ID. Snippet em
  `scripts/seo/analytics.mjs`: `gtag` enfileira na hora, e o script do Google só baixa **1s depois do `load`**.
  Assim não pesa na primeira pintura e não exige clique pra contar.
- **SPA**: cada troca de seção manda um `page_view` com `page_path`, senão o GA vê uma página só.
- **Cloudflare Web Analytics** ligado junto (sem cookie, segunda fonte pra comparar com o GA).
- **CSP** (`_headers`): liberar `googletagmanager.com`, `google-analytics.com`, `static.cloudflareinsights.com`
  e `cloudflareinsights.com`. Página com CSP que bloqueia script inline (aqui, `colaborar.html`) fica sem GA de propósito.

---

## 10. Velocidade (Lighthouse mobile e Core Web Vitals)

Números do projeto: velocidade 68 para 83, SEO 100, boas práticas 100, acessibilidade 98, CLS 0,411 para 0,002.
O que resolveu, em ordem de impacto:

1. **Tirar dado pesado do HTML**: as letras (316 KB) estavam embutidas no `index.html`. Foram pra
   `media/letras/en.json` e `pt.json`, carregadas em segundo plano depois da pintura. A home caiu de 333 KB para 215 KB,
   e o Google parou de ler letra de terceiros.
2. **Fontes do Google sem travar a renderização**: `<link rel="preload" as="style" ... onload="this.rel='stylesheet'">`
   com `<noscript>` de reserva, no lugar do `<link rel="stylesheet">` direto.
3. **Fontes do topo declaradas no `<head>`**: `@font-face` inline só das fontes do título e da manchete, mais
   `<link rel="preload" as="font" type="font/woff2" crossorigin>` dos `.woff2`. Sem isso, o título troca de fonte
   depois e empurra a página (era a maior parte do CLS).
4. **Nada de rolagem automática ao abrir**: a home rolava até a notícia em destaque, e isso contava como pulo de layout.
5. **Reservar espaço**: faixa de números já preenchida no HTML (antes vinha vazia e crescia).
6. **Pegadinha do Google Fonts**: pedir faixa de peso (`wght@300..600`) pra fonte que não é variável (IBM Plex Mono)
   faz a URL ser inválida, e o texto cai na fonte do aparelho sem nenhum erro visível. Usar pesos soltos (`wght@300;400;600`).
7. **O que NÃO compensou**: separar JS/CSS inline em arquivos. Na revisita o HTML já volta 304 com 0 bytes.

Medir sempre em produção, com o Lighthouse mobile. O local engana por causa do cache e da rede.

---

## 11. Prévia de link (`og.jpg`)

É a imagem que WhatsApp, Instagram, Facebook e Google mostram ao compartilhar o link. Ela vale pra home e é a
reserva de toda página sem foto própria (`layout.mjs` usa `og.jpg` quando a página não tem imagem).

- Tamanho **1200x630**, JPG de uns 60 KB.
- O jeito mais fiel é **fotografar o próprio topo do site** com o Chrome headless e recortar:
  ```
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
    --window-size=1200,630 --force-device-scale-factor=1 --virtual-time-budget=8000 --screenshot=/caminho/og.png https://dominio/
  ```
  `--virtual-time-budget` deixa as animações (contadores) terminarem antes da foto. Depois o sharp recorta só o
  bloco principal e centraliza sobre a cor de fundo do site.
- O WhatsApp guarda a prévia antiga por alguns dias. No Facebook dá pra forçar pelo Depurador de Compartilhamento.
- Aqui a de maio tinha fonte genérica e endereço antigo e passou meses no ar sem ninguém notar. Revisar a cada mudança visual grande.

---

## 12. Pegadinhas (não redescobrir)

- `#` na URL = invisível pro Google. Deep-link por hash serve pro visitante, nunca pro robô.
- Redirect de página interna pra home = página descartada.
- Links em JS (`onclick`, `data-view`) não contam. Precisa de `<a href>`.
- Canonical errado (http, www trocado, domínio antigo) faz o Google ignorar a página certa.
- Página de erro 404 quando a API cai tira a página do índice. Usar 503 com Retry-After.
- Conteúdo de terceiros com direito autoral (letra, cifra) não vai pra página indexável.
- Cota de "Solicitar indexação" é diária e pequena. Priorizar home e índices.
- Trocar de domínio sem 301 perde tudo o que já estava indexado. "Mudança de endereço" só com 301 ativo.
- Hash de aba: se o site usa `#forum` em links de divulgação, o boot do SPA tem que ler o hash (corrigido em 28/09).

---

## 13. Arquivos de referência neste repo

- `/Users/andrehz/Documents/Githubhz/setlists-pj-ev/scripts/seo/layout.mjs`: molde de página
- `/Users/andrehz/Documents/Githubhz/setlists-pj-ev/scripts/seo/base.mjs`: `SITE_BASE` e escape
- `/Users/andrehz/Documents/Githubhz/setlists-pj-ev/scripts/seo/analytics.mjs`: snippet do GA4
- `/Users/andrehz/Documents/Githubhz/setlists-pj-ev/scripts/seo/build-seo-pages.mjs`: gerador (show, música, disco, banda, índices, sitemap)
- `/Users/andrehz/Documents/Githubhz/setlists-pj-ev/scripts/seo/seo.test.mjs`: testes, incluindo o de sincronia
- `/Users/andrehz/Documents/Githubhz/setlists-pj-ev/scripts/news/news-page.mjs`: página de notícia (`NewsArticle`)
- `/Users/andrehz/Documents/Githubhz/setlists-pj-ev/functions/`: Pages Functions do fórum (SSR, sitemap, cache)
- `/Users/andrehz/Documents/Githubhz/setlists-pj-ev/_headers`: CSP e cache
- `/Users/andrehz/Documents/Githubhz/setlists-pj-ev/robots.txt` e `/Users/andrehz/Documents/Githubhz/setlists-pj-ev/sitemap.xml`
- Histórico detalhado: `/Users/andrehz/Documents/Githubhz/setlists-pj-ev/PROGRESSO.md`, entradas de 27/09 e 28/09/2026
