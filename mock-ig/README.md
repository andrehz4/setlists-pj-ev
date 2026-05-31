# mock-ig: Instagram fake local (Graph API mock)

Um servidor local que finge ser a **Graph API do Instagram**
(`graph.instagram.com/v21.0`) pra testar publicacao de feed, story e (futuro)
reels SEM postar de verdade e SEM tocar o git. Guarda os posts num store e tem
(em construcao) um front que mostra feed/stories como se fosse o app real.

> **Generico de proposito.** O mock nao sabe nada deste projeto. Qualquer
> aplicacao que publique no IG via Graph API (carrossel, single, story) pode
> testar aqui. Ver "Usando em outro projeto" abaixo (ex: Terra Gentil).

---

## Por que existe

Antes so dava pra testar de dois jeitos ruins:
- `--dry-run`: para antes da API, nao exercita publish / rate limit / story.
- postar de verdade no Instagram (queima quota, polui o feed real).

O mock fecha o meio: o pipeline REAL roda, faz as chamadas HTTP de verdade,
mas contra um IG falso que aceita tudo (ou falha sob demanda).

---

## Como funciona (contrato)

O segredo e que o cliente HTTP do pipeline le **duas env vars**:

| Env | O que faz | Default (producao) |
|---|---|---|
| `IG_API_BASE` | base da Graph API | `https://graph.instagram.com/v21.0` |
| `REPO_PUBLIC_BASE` | de onde o "IG" baixa as imagens/videos dos posts | `https://raw.githubusercontent.com/.../main` |

Apontando as duas pro mock (`http://127.0.0.1:8788`), o pipeline acha que esta
falando com o Instagram, mas e tudo local. **Sem as envs, roda identico em
producao** (nenhum workflow seta `IG_API_BASE`).

### Rotas Graph que o mock honra

| Metodo + rota | Resposta |
|---|---|
| `POST /:uid/media` (IMAGE/CAROUSEL/STORIES) | `{ id: "c_N" }` (container) |
| `POST /:uid/media_publish` | `{ id: "p_N" }` (postId; vai pro feed/stories) |
| `GET /:containerId?fields=status_code,status` | `{ status_code: "FINISHED" }` (story) |
| `GET /:uid/content_publishing_limit` | `{ quota_usage, config: { quota_total: 50 } }` |
| `GET /:postId?fields=id` | `{ id }` ou erro code 100 se apagado |
| `GET /me` | `{ id, username, account_type: "BUSINESS" }` |
| `GET /media/...` | serve o arquivo do disco (substitui o raw.githubusercontent) |

### Rotas extras (front + controle)

| Rota | Uso |
|---|---|
| `GET /_mock/feed` | posts do feed (pro front) |
| `GET /_mock/stories` | stories (pro front) |
| `GET /_mock/state` | store inteiro |
| `POST /_mock/reset` | zera o store |
| `POST /_mock/fail` (`fail=ratelimit\|quota\|videoerror`, `storyPolls=N`) | liga modo de falha sticky |

---

## Uso neste projeto (setlists-pj-ev)

```bash
# 1. zera o store do mock
npm run mock:reset

# 2. sobe o server (deixa rodando num terminal)
npm run mock:server

# 3. popula a fila com itens de teste (noticias reais ja curadas)
npm run mock:seed            # = seed-queue --count=6

# 4. roda o pipeline REAL contra o mock
npm run mock:publish         # feed (carrossel/single)
npm run mock:story           # story

# 5. ve o resultado
curl http://127.0.0.1:8788/_mock/feed
# (ou abre o front quando a Fase 2 estiver pronta)
```

Re-testar: a fila marca `postedAt`, entao nao reposta. Rode `mock:reset` + um
novo `mock:seed` (ou semeie ids diferentes).

### Injetar falhas (testar o hardening)

```bash
# liga rate limit (code 4) sticky
curl -X POST http://127.0.0.1:8788/_mock/fail -d "fail=ratelimit"
npm run mock:publish
# confirma que armou cooldown global:
cat media/news/_ig-cooldown.json     # deve ter until no futuro, code 4

# por request (sem sticky):
# o mock tambem aceita ?fail=ratelimit / ?fail=quota na URL da chamada
```

Modos: `ratelimit` (code 4, testa cooldown + markRateLimited), `quota` (49/50,
testa pre-check abort), `videoerror` (status ERROR no story), `storyPolls=N`
(video so fica FINISHED apos N polls, testa o waitContainerReady).

---

## Usando em OUTRO projeto (ex: Terra Gentil)

O mock e standalone. Pra testar qualquer app que publique no IG:

1. **Copie a pasta `mock-ig/`** pro outro projeto (ou rode este server e aponte
   o outro app pra ele, ja que a Graph API e a mesma).

2. **Garanta que o app le `IG_API_BASE` do ambiente.** Se ele tem
   `const API_BASE = "https://graph.instagram.com/..."` hardcoded, troque por:
   ```js
   const API_BASE = process.env.IG_API_BASE || "https://graph.instagram.com/v21.0";
   ```
   (foi exatamente isso que fizemos aqui em 4 arquivos).

3. **Configure de onde o mock serve as imagens.** O app gera as imagens em
   algum lugar do disco e manda a URL pro IG via `REPO_PUBLIC_BASE`. Aponte:
   ```bash
   MOCK_SERVE_ROOT=/caminho/do/projeto/terra-gentil   # raiz de onde servir media
   MOCK_IG_PORT=8788
   node mock-ig/server.mjs
   ```
   Entao rode o pipeline do outro app com:
   ```bash
   IG_API_BASE=http://127.0.0.1:8788 \
   REPO_PUBLIC_BASE=http://127.0.0.1:8788 \
   IG_USER_ID=fake IG_ACCESS_TOKEN=fake \
   node <script-de-publish-do-outro-app>
   ```

4. Os posts caem em `/_mock/feed` e `/_mock/stories` no mesmo formato, entao o
   mesmo front serve qualquer projeto.

### Config do server (todas por env, opcionais)

| Env | Default | Pra que |
|---|---|---|
| `MOCK_IG_PORT` | `8788` | porta do server |
| `MOCK_SERVE_ROOT` | `cwd` | raiz de onde servir os arquivos de `/media/...` |
| `MOCK_IG_STORE` | `mock-ig/_store.json` | onde guardar o estado |
| `MOCK_IG_FAIL` | (nenhum) | modo de falha default (sem precisar de `/_mock/fail`) |

---

## Arquivos

| Arquivo | Papel |
|---|---|
| `server.mjs` | a Graph API fake + serve media + API do front |
| `store.mjs` | load/save/reset do estado (`_store.json`) |
| `run.mjs` | roda o pipeline real com as envs do mock (`node mock-ig/run.mjs feed\|story`) |
| `reset.mjs` | zera o store |
| `mock.test.mjs` | testes do mock (`node --test mock-ig/mock.test.mjs`) |
| `_control.json` | modo de falha persistente (commitado, default null) |
| `_store.json` | estado runtime (gitignored) |
| `web/` | front React+Vite (feed grid, carrossel, stories, reels placeholder) |

## Front (ver a publicacao numa tela)

O front React+Vite vive em `mock-ig/web/` (package.json proprio, isolado).

```bash
cd mock-ig/web && npm install     # 1a vez
# dev (hot reload, proxy pro mock server):
npm run dev                        # abre http://127.0.0.1:5273
# ou build estatico servido pelo proprio mock server:
npm run build                      # gera web/dist
# entao acesse http://127.0.0.1:8788/ (o server.mjs serve o dist/)
```

Fluxo tipico: `mock:server` (terminal 1) + `mock:publish` (terminal 2) + abrir o
front. O front faz polling de `/_mock/feed` e `/_mock/stories` a cada 3s, entao
o post aparece sozinho apos publicar. Telas: Feed (grid 3 col + carrossel no
clique), barra de Stories (viewer fullscreen com progress bar), Reels (placeholder).

## Status

- [x] Fase 1: env `IG_API_BASE` + mock server (caminho feliz) + run/reset + testes
- [x] Fase 2: front React (feed grid + carrossel + stories bar/viewer + reels placeholder)
- [ ] Fase 3: gerar story real (`run-publish-story`) contra o mock e validar no viewer
- [ ] Fase 4: injecao de erro completa via `/_mock/fail` + reels de verdade

## Producao esta segura?

Sim. Os 4 arquivos do pipeline so passaram a LER `process.env.IG_API_BASE` com
fallback pro valor real. Nenhum workflow seta essa env, entao em producao o
comportamento e byte-a-byte o mesmo de antes.
