# News bot, setlists-pj-ev

Pipeline de coleta + curadoria + publicacao de noticias PJ. 3 backends de curadoria a escolher.

## Backends disponiveis (selector)

| Backend     | Como aciona                  | Custo           | API key                |
|-------------|------------------------------|-----------------|------------------------|
| `gemini` ⭐ | GH Actions cron 6h (default) | gratis (free tier cobre) | `GEMINI_API_KEY` |
| `anthropic` | GH Actions cron 6h           | ~$1-2/mes       | `ANTHROPIC_API_KEY`    |
| `routine`   | Claude routine via /schedule | quota plano     | nenhuma (usa Claude Code) |

### Gemini: opcoes de modelo

O modelo padrao eh `gemini-2.5-flash` (estavel, free tier 500 RPD >> 10/dia que usamos).
Pra trocar, defina a **GitHub repo variable** (nao secret) `GEMINI_MODEL`:

Settings → Secrets and variables → Actions → Variables tab → New repository variable

| Modelo                            | Custo/mes (300 nots) | Free tier  | Pra que serve                          |
|-----------------------------------|----------------------|------------|----------------------------------------|
| `gemini-2.5-flash-lite`           | ~$0.18               | ✅ 500 RPD | mais economico, qualidade ok           |
| **`gemini-2.5-flash`** ⭐ default | ~$0.77               | ✅ 500 RPD | melhor balanco custo/voz autoral      |
| `gemini-2.5-pro`                  | ~$3.11               | ⚠️ limit   | melhor prosa, mais caro               |
| `gemini-3-flash-preview`          | ~$1.07               | ✅         | flagship Flash 3.x, preview (instavel) |
| `gemini-3.1-pro-preview`          | ~$4.26               | ❌         | top atual, sem free tier              |

Local: `GEMINI_MODEL=gemini-2.5-pro node scripts/news/fetch-news.mjs --curator=gemini --dry-run`

NOTA: `gemini-2.0-flash` foi DEPRECADO em 2026-06-01. Nao usar.

Selecao:
- Local: `node scripts/news/fetch-news.mjs --curator <anthropic|gemini|routine>`
- Env: `NEWS_CURATOR=gemini node scripts/news/fetch-news.mjs`
- GH Actions: workflow_dispatch → input `curator` (default cron usa anthropic)

## Onde achar as chaves

**Anthropic** (`ANTHROPIC_API_KEY`):
1. https://console.anthropic.com/settings/keys → Create Key
2. GH: Settings → Secrets and variables → Actions → New repo secret

**Gemini** (`GEMINI_API_KEY`):
1. https://aistudio.google.com/apikey → Create API Key
2. Free tier: 15 RPM, 1500 req/dia (10 noticias/dia cabem facil)
3. GH: mesmo caminho

**Routine** (Claude Code): sem chave. Voce agenda via `/schedule` no Claude Code,
e a routine roda `fetch-news.mjs --curator=routine` (coleta + scrape + img),
depois cura cada item natively e roda `merge-curated.mjs` pra publicar.

## Fluxos

### Modo anthropic ou gemini (full auto, sem voce)
```
GH cron 6h → fetch-news.mjs --curator=<X> → curator API → media/news/index.json → git push
```

### Modo routine (zero API cost, gasta quota Claude plano)
```
Claude routine (cron via /schedule) →
  1. fetch-news.mjs --curator=routine    (coleta candidatos, escreve _pending.json)
  2. routine le _pending.json, curatela cada item nativamente
  3. routine roda: echo '<curated json>' | merge-curated.mjs --stdin
  4. git add/commit/push (routine faz)
```

## Arquivos

- `fetch-news.mjs`        orquestrador
- `sources.mjs`           lista de feeds (7 ativos: Stereogum, NME, Consequence, Pitchfork, Rolling Stone, Folha, Reddit r/pj)
- `relevance.mjs`         regex PJ + canonicalize URL + sha10 + filtro Reddit (score>=100 + flair)
- `extract.mjs`           cheerio scrape (OG image cascata + texto)
- `image-cache.mjs`       sharp resize 1280x720 cover JPEG q82, GC orfas
- `curators/_shared.mjs`  prompt loader, JSON validator, dispatcher
- `curators/anthropic.mjs` Claude Haiku 4.5 (cache_control ephemeral)
- `curators/gemini.mjs`    Gemini 2.0 Flash
- `curators/routine.mjs`   stub que retorna PENDING (modo routine)
- `merge-curated.mjs`     pra modo routine: merge dos itens curados pelo Claude routine
- `prompts/system-curator-fa.txt`  system prompt do curador-fa (PT-BR)
- `prompts/user-template.txt`      template do user turn

## Testar local

```bash
# dry-run sem chamar API (preferido pra testar pipeline)
node scripts/news/fetch-news.mjs --curator=routine --dry-run

# dry-run com Gemini (precisa GEMINI_API_KEY)
GEMINI_API_KEY=... node scripts/news/fetch-news.mjs --curator=gemini --dry-run

# dry-run com Anthropic (precisa ANTHROPIC_API_KEY)
ANTHROPIC_API_KEY=... node scripts/news/fetch-news.mjs --curator=anthropic --dry-run
```
