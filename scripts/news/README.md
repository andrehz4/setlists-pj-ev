# News bot, setlists-pj-ev

Pipeline de coleta + curadoria + publicacao de noticias PJ. 3 backends de curadoria a escolher.

## Backends disponiveis (selector)

| Backend     | Como aciona                  | Custo           | API key                |
|-------------|------------------------------|-----------------|------------------------|
| `anthropic` | GH Actions cron 6h (default) | ~$1-2/mes       | `ANTHROPIC_API_KEY`    |
| `gemini`    | GH Actions cron 6h           | gratis (1500/d) | `GEMINI_API_KEY`       |
| `routine`   | Claude routine via /schedule | quota plano     | nenhuma (usa Claude Code) |

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
