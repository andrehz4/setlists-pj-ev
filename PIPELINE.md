# Pipeline PJ News

> Complementos mais novos que este doc: `CLAUDE.md` (mapa pra agentes) e `PROGRESSO.md`
> (mudancas por sessao: recuperacao do falso-erro 2207051, mergeQueueStates, stubs n/<id>, poda de media).


Documentacao oficial do pipeline de noticias do site Pearl Jam fan-to-fan
(setlists-pj-ev.pages.dev / Instagram @smufdpj).

> **Para proximos chats:** este e o documento de referencia do fluxo de noticias,
> postagem e do schedule de curadoria. Leia a secao de Estado real abaixo ANTES
> de mexer em qualquer parte do pipeline. Memorias relacionadas:
> `project_news_scraper_gargalo`, `project_mock_ig_abas`.

---

## ⚠️ Estado real e diagnostico (atualizado 2026-06-01) — LEIA PRIMEIRO

O resto do documento descreve o desenho ORIGINAL. Estes pontos refletem o que
de fato acontece hoje, com os achados da investigacao de 2026-05-31/06-01:

**1. As tres etapas, e quem faz cada uma:**
- **Coleta (ATIVA):** `news.yml` (autor de commit `pj-news-bot`) e `community.yml`
  rodam no GitHub Actions e enchem `media/news/_pending.json` com candidatos crus.
- **Curadoria (ATIVA, mas e o Claude schedule, NAO um Action):** a "Rotina Claude"
  e uma **scheduled task no Anthropic Cloud** (Claude Sonnet), 4x/dia (00/06/12/18
  BRT). Ela le `_pending.json`, cura, e commita em branch `claude/news-routine-*`,
  que o auto-merge mescla na main. Nos commits aparece autor **"Claude"**, msg
  "news: curadoria automatica via routine sonnet". O prompt dela vive em
  `scripts/news/routine-prompt.md` (mas a task usa um SNAPSHOT colado; editar o
  arquivo nao atualiza a task, tem que recolar).
- **Publicacao (ATIVA, disparada pelo TriggerAll):** `publish-instagram.yml`
  posta o carrossel no feed. Quem dispara nao e cron do YAML (nem manual): e o
  **TriggerAll** (ver secao dedicada abaixo).

**2. O GARGALO real do feed vazio = o scraper, nao a curadoria nem o feed.**
O `reddit-search` traz `article_text` VAZIO (so `"submitted by /u/x [link]
[comments]"`, <200 chars). Sem texto, a curadoria corretamente faz SKIP (regra
anti-invencao). Resultado: 56-61 itens por rodada -> 0 ou 1 aprovado. Ate a
noticia real do novo baterista (`a7233f622d`) e descartada toda rodada por
"texto vazio". **Pendente:** consertar o scraper pra seguir o link externo e
extrair o texto do artigo-fonte. Ver memoria `project_news_scraper_gargalo`.

**3. `publish-instagram.yml` NAO tem cron no YAML, mas roda automatico mesmo
assim** porque o **TriggerAll** dispara via `workflow_dispatch` da API GitHub.
O commit `b3a5636` que removeu o cron `12,32,52 3,9,15,21` migrou o controle
pro TriggerAll, que ja existe e esta em producao (Railway+Vercel). A frase
antiga "TriggerAll nunca foi criado" era imprecisa, ja foi corrigida. Ver a
secao **"7. Quem dispara cada workflow (TriggerAll)"** abaixo.

**4. `news-merge.yml` esta morto.** So rodou 1x (13/05). A curadoria nao usa
mais o caminho `repository_dispatch` -> `news-merge`; ela commita em branch
direto (item 1). Ignore o news-merge na tabela de observabilidade.

**5. Observabilidade de curadoria (NOVO, 2026-06-01):** a Rotina agora grava um
log por rodada em `media/news/_curation-log/<TS>.json` com os aprovados E todos
os SKIP com razao, inclusive rodadas 100% SKIP. O **mock-ig** (Instagram fake
local, pasta `mock-ig/`, atalho "Mock Instagram" na area de trabalho do Andre)
le isso na aba **Rodadas**, alem das abas Curadoria, Simulador e Runs. Ver
memoria `project_mock_ig_abas`.

**6. Poda do `_pending` (NOVO, 2026-06-01):** antes, o `merge-curated` removia do
`_pending.json` so os APROVADOS; os SKIP editoriais nunca saiam, acumulavam (63
itens, o mais antigo de 16 dias) e eram re-curados toda rodada. Conserto:
`scripts/news/prune-curated.mjs` le os logs de rodada (`_curation-log/`), junta
os ids ja julgados e remove do `_pending` + marca `seen[id]=curationSkip`.
Chamado no `fetch-news.mjs` e no `community-fetch.mjs` (compartilham `_pending`
+ `seen`). Dirigido por log (nao TTL): so remove o que foi explicitamente
julgado. Ver memoria `project_pending_accumulation_fix`.

---

## Arquitetura geral

```
Reddit r/pearljam ──► community.yml ──────────────────────┐
                                                           ▼
Sites de noticias ──► news.yml ──► _pending.json ──► Rotina Claude ──► branch claude/*
                                                                              │
                                                                              ▼
                                                             publish-instagram.yml (auto-merge)
                                                                              │
                                                                              ▼
                                                                        index.json
                                                                              │
                                                             ┌────────────────┘
                                                             ▼
                                               publish-instagram.yml ──► IG carrossel
                                               publish-story.yml ──────► IG story
```

---

## Agenda diaria (horario BRT)

```
BRT     NEWS.YML    COMMUNITY.YML    ROTINA CLAUDE    PUBLISH IG    STORY IG
────────────────────────────────────────────────────────────────────────────
00:00                                ★ commit
00:12                                                 ▶ run 1
00:32                                                 ▶ run 2
00:52                                                 ▶ run 3
01:00   📡 scrape
05:00   📡 scrape
06:00                                ★ commit
06:12                                                 ▶ run 1
06:32                                                 ▶ run 2
06:52                                                 ▶ run 3
08:00   📡 scrape
09:25               📡 digest
11:00   📡 scrape
12:00                                ★ commit
12:12                                                 ▶ run 1
12:32                                                 ▶ run 2
12:52                                                 ▶ run 3
13:00   📡 scrape                                                   ★ story
17:00   📡 scrape
18:00                                ★ commit
18:12                                                 ▶ run 1
18:32                                                 ▶ run 2
18:52                                                 ▶ run 3
19:00   📡 scrape
21:25               📡 spotlight
23:00   📡 scrape
```

---

## 7. Quem dispara cada workflow (TriggerAll)

> Esta secao foi adicionada em 2026-06-01 depois de uma sessao em que confundimos
> "publish-instagram.yml nao tem mais cron no YAML" com "o publish nao roda
> automatico". Sao coisas diferentes. Esta secao existe pra nao cair nessa de novo.

### O que e o TriggerAll
**TriggerAll** e um sistema separado (fora do repo `setlists-pj-ev`) que serve
como **central de cron e webhook** pros workflows deste projeto. Fica em:
- **Codigo:** `C:\Gitlab_hz\triggerall\` localmente e repo `andrehz4/triggerall`
- **Backend:** Fastify 5 + PostgreSQL no Railway (`triggerall-production.up.railway.app`)
- **Frontend:** React 18 + Vite 5 no Vercel (dashboard de controle)
- **Mecanismo:** tabela `triggers` no Postgres + `node-cron` em UTC + workers
  que disparam via `POST /repos/.../actions/workflows/.../dispatches` na API
  do GitHub, autenticando com **PAT do Andre** salvo nas env vars do Railway

### Por que existe (motivacao do TriggerAll)
- Permite **encadeamento** (`on_success_trigger_id`: trigger A conclui -> dispara B)
- Permite **webhook GitHub** (recebe `push` e `workflow_run`, reage)
- Centraliza a observabilidade num dashboard so (farol BRT, historico, retry)
- Retry 3x com backoff 2s/4s/8s + jitter, timeout 15s, dedupe 3min em push duplicado
- Watchdog: alerta no Telegram quando trigger fica >6h sem disparar
- Tira do GitHub Cron a responsabilidade (mais flexivel, menos quirks)

### Como identificar nos runs do Actions que veio do TriggerAll
- `event: workflow_dispatch`
- `triggering_actor: andrehz4` (o PAT e do Andre)
- Hora cravada com `:01` segundos (cron node-cron + propagacao API GitHub)

### Tabela de controle (estado em 2026-05-18, do PROGRESSO do TriggerAll)
| Workflow daqui | Quem dispara no TriggerAll | Periodicidade declarada |
|---|---|---|
| `news.yml` | TriggerAll cron | 8x/dia em UTC |
| `community.yml` digest | TriggerAll cron | 09:25 BRT diario |
| `community.yml` spotlight | TriggerAll cron | 21:25 BRT diario |
| `publish-story.yml` | TriggerAll cron | 13:00 BRT diario |
| `publish-instagram.yml` | TriggerAll webhook (push da routine claude/news-routine-*) + (provavelmente um cron extra adicionado depois) | sob demanda + ~06:00 BRT diario observado |

### Horarios mapeados do codigo do TriggerAll (2026-06-01)
Os triggers NAO sao hardcoded no repo: ficam na tabela `triggers` do Postgres
(Railway), criados via dashboard/API. Os crons abaixo vem do PROGRESSO do
proprio TriggerAll + do scheduler (`backend/src/services/scheduler.js`) e dos
webhooks (`backend/src/routes/webhooks.js`):

| Workflow | Cron UTC | BRT | Como |
|---|---|---|---|
| news.yml | `0 2,4,8,11,14,16,20,22 * * *` | 23/01/05/08/11/13/17/19h | cron |
| community.yml (digest) | `25 12 * * *` | 09:25 | cron |
| community.yml (spotlight) | `25 0 * * *` | 21:25 | cron |
| publish-story.yml | `0 16 * * *` | 13:00 | cron |
| **publish-instagram.yml** | (sem cron proprio) | **toda vez que a routine pusha** + ~06h | **webhook push** `claude/news-routine-*` (webhooks.js:127-177, dedup 3min) + encadeia publish-story no sucesso |

### ACHADO CRITICO (conecta com o bug de 2026-06-01) -- CAUSA REAL CORRIGIDA
O publish e disparado por **webhook quando a routine Claude faz push** de um
branch `claude/news-routine-*`. **Desde 2026-06-01 a routine commita um log POR
RODADA mesmo em 100% SKIP** (mudanca do `routine-prompt.md` pra observabilidade),
entao ela **pusha 4x/dia (00/06/12/18 BRT)** em vez de "so quando aprova algo".
Resultado: o webhook dispara o **publish 4x/dia** (+ o cron ~06h). Cada disparo
tenta postar os **community-spotlight maduros acumulados na fila** (porque
notícia regular = 0, gargalo do scraper).

**A causa do REPOST (corrigida 2026-06-01):** o `media_publish` devolve `code=4
subcode=2207051` ("atividade restringida / potential spam", NAO volume:
X-App-Usage 0%) **MESMO tendo publicado** o carrossel (falso-erro documentado
pela Meta). O cliente tratava como rate limit, nunca gravava `postedAt`, e o
item seguia maduro -> proxima janela re-postava. Por isso o historico da fila
mostra sempre `spotlight:0/N`. **Conserto:** `recoverPublishedPost` em
`instagram.mjs` confere `GET /<uid>/media` apos erro no publish e, se o post
saiu, marca como postado. Ver memoria `project_bug_repost_feed` e teste
`scripts/publish/recover-publish.test.mjs`.

**Pendente (origem do flag, nao do repost):** conta MEDIA_CREATOR -> converter
pra BUSINESS + reduzir frequencia de disparo (o log-por-rodada multiplicou os
webhooks do publish) reduz o 2207051 na origem.

### Onde olhar pra confirmar/editar um trigger
1. Dashboard React em Vercel (URL no painel do Andre)
2. Direto no Postgres do Railway:
   ```sql
   SELECT id, name, schedule, config->>'workflow_id' AS wf,
          on_success_trigger_id, status, last_fired_at
     FROM triggers
    ORDER BY schedule NULLS LAST, name;
   ```

### Aviso de manutencao
**O TriggerAll roda fora deste repo. Mudar workflows aqui pode quebrar
disparos la (ex: renomear `publish-instagram.yml` quebra o trigger no banco
do TriggerAll).** Sempre que tocar nome/inputs de workflow, conferir o
dashboard ou consultar a tabela `triggers`.

---

## Workflows

### 1. news.yml — News fetch
**Funcao:** scrapa sites de noticias (Stereogum, Pitchfork, pearljam.com, loja, etc.)
e escreve candidatos em `media/news/_pending.json`.

**Horario:** 8x/dia em BRT: 01h, 05h, 08h, 11h, 13h, 17h, 19h, 23h
(`0 2,4,8,11,14,16,20,22 * * *` UTC)

**Output:** `media/news/_pending.json` (acumula para curadoria da Rotina)

**Observabilidade:** Telegram + GitHub Step Summary

---

### 2. community.yml — Community fetch
**Funcao:** coleta conteudo do Reddit r/pearljam em dois modos:
- **Digest** (09:25 BRT): top posts das ultimas 24h, agrega em 1 materia
- **Spotlight** (21:25 BRT): melhor fan art/conteudo da semana com score >= 50 e imagem

**Horario:**
- Digest: `25 12 * * *` UTC = 09:25 BRT (1h antes da rotina das 12:00)
- Spotlight: `25 0 * * *` UTC = 21:25 BRT (1h antes da rotina das 00:00)

**Fonte:** Reddit r/pearljam via REDDIT_PROXY_URL (API JSON com OAuth)

**Output:** `media/news/_pending.json` com kind `community-digest` ou `community-spotlight`

**Observabilidade:** GitHub Step Summary + alerta Telegram quando Reddit retorna 0 posts por erro de API

---

### 3. Rotina Claude (Anthropic Cloud)
**Funcao:** IA curadora. Le `_pending.json`, traduz e reescreve em PT-BR no tom de fa veterano,
aplica regras de voz (sem travessao, sem mencionar Reddit, etc.), e faz push em branch dedicado.

**Horario:** 4x/dia em BRT: 00:00, 06:00, 12:00, 18:00
(`0 3,9,15,21 * * *` UTC)

**Modelo:** Claude Sonnet (Anthropic Cloud, ambiente remoto com proxy de rede)

**Output:** branch `claude/news-routine-YYYYMMDD` com `media/news/` atualizado

**Obs:** git push para main e bloqueado pelo proxy da Anthropic Cloud. A estrategia e push em branch, que o proxy libera. O auto-merge cuida do restante.

---

### 4. publish-instagram.yml — Publish Instagram
**Funcao dupla:**
1. **Auto-merge:** detecta branches `claude/news-routine-*`, valida (committer whitelist + path), abre PR, mescla em main, notifica Telegram
2. **Publish:** le fila `_publish-queue.json`, gera slides JPG, posta carrossel no IG via Graph API

**Horario:** o cron `12,32,52 3,9,15,21` do YAML foi REMOVIDO (commit b3a5636)
e migrado pro **TriggerAll** (ver secao 7 acima). Hoje quem dispara o publish e:
- Webhook do TriggerAll quando a routine Claude empurra um branch `claude/news-routine-*`
- (provavel) um trigger cron extra no banco do TriggerAll, observado ~06:00 BRT
- `workflow_dispatch` manual (`gh workflow run publish-instagram.yml`)

Pra ver o cron exato ou pausar disparo automatico: dashboard do TriggerAll, nao
mexer aqui no YAML.

**Observabilidade:** Telegram (sucesso e falha) + GitHub Step Summary

---

### 5. publish-story.yml — Publish Instagram Story
**Funcao:** seleciona ate 5 noticias das ultimas 24h do `index.json`, gera MP4 1080x1920
com sharp+ffmpeg, posta como story no IG.

**Horario:** 1x/dia, `0 16 * * *` UTC = 13:00 BRT

**Dependencia:** precisa que a rotina das 12:00 ja tenha comitado noticias frescas no `index.json`.
Sem conteudo das ultimas 24h, o story e cancelado automaticamente.

**Observabilidade:** Telegram + GitHub Step Summary

---

### 6. refresh-ig-token.yml — Refresh IG token
**Funcao:** renova o token long-lived do Instagram (expira em 60 dias).

**Horario:** dia 1 de cada mes, `13 6 1 * *` UTC = 03:13 BRT

**Pre-requisito:** secret `GH_PAT_SECRETS` com PAT de escopo `repo` configurado no repo.

---

## Fluxo de dados

```
_pending.json
  └── items[]
        ├── kind: undefined    → curador fa (noticias tradicionais)
        ├── kind: community-digest    → curador digest
        └── kind: community-spotlight → curador spotlight

Rotina Claude cura cada item e gera curated.json:
  └── [{ id, titulo_pt, intro_pt, corpo_pt, tags }]

merge-curated.mjs valida e publica:
  └── media/news/index.json   (top 30 itens, metadata sem body)
  └── media/news/items/<id>.json  (body_pt separado, max 15KB cada)
  └── media/news/archive/YYYY-MM.json  (overflow alem do top 30)
  └── media/news/seen.json   (deduplicacao)
  └── media/news/_pending.json  (itens aceitos removidos)

publish-instagram.yml le o index.json e enfileira em:
  └── media/news/_publish-queue.json

run-publish.mjs processa a fila:
  └── media/news/instagram-slides/<id>.jpg  (slides gerados)
  └── Posta carrossel via Graph API
```

---

## Observabilidade

| Workflow | Telegram | GitHub Step Summary |
|----------|----------|---------------------|
| news.yml | sim | sim |
| community.yml | sim (alerta de erro) | sim |
| news-merge.yml | sim | parcial (bash) |
| publish-instagram.yml | sim | sim |
| publish-story.yml | sim | sim |
| refresh-ig-token.yml | sim (alerta de falha) | nao |

---

## Troubleshooting

| Sintoma | Onde olhar | Causa provavel |
|---------|-----------|----------------|
| Digest/Spotlight zerado | Telegram alerta + Actions community.yml | Reddit proxy com erro |
| Publish nao posta | Telegram erro + Actions publish-instagram.yml | Token IG expirado ou fila vazia |
| Story cancelado | Actions publish-story.yml logs | 0 noticias nas ultimas 24h no index.json |
| Branch da rotina nao mergeado | Actions publish-instagram.yml step auto-merge | Validacao de committer falhou ou PR em conflito |
| Token IG expirado | Telegram erro de publish | Refresh so recupera token AINDA VALIDO. Token ja expirado: gerar token novo no painel Meta (Instagram > Configuracao da API com Login do Instagram > Gerar token, login com @smufdpj), `gh secret set IG_ACCESS_TOKEN`, e conferir se o ID mostrado ao lado do token bate com o secret IG_USER_ID (se mudou, atualizar). Checar tambem se GH_PAT_SECRETS existe (sem ele o refresh mensal falha e o token expira de novo). Historico: aconteceu em 30/jul/2026, IG parado 5 dias |

---

## Regras absolutas da curadoria (Rotina Claude)

1. **Nunca usar travessao** (qualquer variante). Usar virgula, ponto ou dois-pontos.
2. **Nunca mencionar Reddit/r/pearljam/subreddit/upvote/autor** no corpo. Usar "comunidade mundial" ou "forum global de fas".
3. **Nunca citar numeros de votos/curtidas** no corpo. Usar linguagem qualitativa.
4. **Tags por integrante** so quando o foco e aquele integrante. Tags validas: `turne lancamento tenclub memoria br bootleg comunidade eddie mike stone jeff matt boom josh`
5. **Secoes sempre em PT-BR**: Verso/Refrao/Ponte (nunca Verse/Chorus/Bridge).

---

*Desenho original atualizado em 2026-05-15. Secao "Estado real" adicionada em
2026-06-01 com o diagnostico do gargalo do scraper, o fim do cron do publish, o
log de curadoria e o mock-ig. Para mudancas no pipeline, atualizar este documento
junto com o commit, e manter a secao Estado real no topo como fonte da verdade.*
