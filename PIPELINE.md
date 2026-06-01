# Pipeline PJ News

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
- **Publicacao (so manual):** `publish-instagram.yml` posta o carrossel no feed.

**2. O GARGALO real do feed vazio = o scraper, nao a curadoria nem o feed.**
O `reddit-search` traz `article_text` VAZIO (so `"submitted by /u/x [link]
[comments]"`, <200 chars). Sem texto, a curadoria corretamente faz SKIP (regra
anti-invencao). Resultado: 56-61 itens por rodada -> 0 ou 1 aprovado. Ate a
noticia real do novo baterista (`a7233f622d`) e descartada toda rodada por
"texto vazio". **Pendente:** consertar o scraper pra seguir o link externo e
extrair o texto do artigo-fonte. Ver memoria `project_news_scraper_gargalo`.

**3. `publish-instagram.yml` NAO tem mais cron.** O schedule
`12,32,52 3,9,15,21` foi REMOVIDO (commit b3a5636, "acionado apenas pelo
TriggerAll", que nunca foi criado). Hoje o feed so posta via `workflow_dispatch`
manual (`gh workflow run publish-instagram.yml`). A secao 4 e a agenda abaixo
ainda descrevem o cron antigo.

**4. `news-merge.yml` esta morto.** So rodou 1x (13/05). A curadoria nao usa
mais o caminho `repository_dispatch` -> `news-merge`; ela commita em branch
direto (item 1). Ignore o news-merge na tabela de observabilidade.

**5. Observabilidade de curadoria (NOVO, 2026-06-01):** a Rotina agora grava um
log por rodada em `media/news/_curation-log/<TS>.json` com os aprovados E todos
os SKIP com razao, inclusive rodadas 100% SKIP. O **mock-ig** (Instagram fake
local, pasta `mock-ig/`, atalho "Mock Instagram" na area de trabalho do Andre)
le isso na aba **Rodadas**, alem das abas Curadoria, Simulador e Runs. Ver
memoria `project_mock_ig_abas`.

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

**Horario:** ⚠️ DESATUALIZADO. O cron `12,32,52 3,9,15,21` foi REMOVIDO (commit
b3a5636). Hoje so roda via `workflow_dispatch` manual. Ver Estado real no topo.
~~3 runs por janela, 12min apos cada rotina, BRT 00:12/32/52, etc.~~

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
| refresh-ig-token.yml | nao | nao |

---

## Troubleshooting

| Sintoma | Onde olhar | Causa provavel |
|---------|-----------|----------------|
| Digest/Spotlight zerado | Telegram alerta + Actions community.yml | Reddit proxy com erro |
| Publish nao posta | Telegram erro + Actions publish-instagram.yml | Token IG expirado ou fila vazia |
| Story cancelado | Actions publish-story.yml logs | 0 noticias nas ultimas 24h no index.json |
| Branch da rotina nao mergeado | Actions publish-instagram.yml step auto-merge | Validacao de committer falhou ou PR em conflito |
| Token IG expirado | Telegram erro de publish | Rodar refresh-ig-token.yml manualmente |

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
