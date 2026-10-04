# scripts/agenda

Agenda de shows das bandas cover de Pearl Jam (POC desde 2026-10-04). Plano e perfis das bandas em
`docs/agenda/PLANO-AGENDA.md`. Workflow `agenda.yml` (diário 09:17 BRT).

| Arquivo | Papel |
|---|---|
| `ler-instagram.mjs` | Lê posts públicos pela API oficial da Meta (só legenda, data e link). |
| `extrair.mjs` | Funções puras: post "Agenda de MÊS" vira shows; post do dia completa casa e horário. A API tira o @ das menções, então a casa vem como palavra colada (`rocknbeerpub`). |
| `montar.mjs` | Junta os posts de uma banda numa lista de shows de hoje em diante. |
| `coletar.mjs` | Roda tudo, grava `media/agenda/shows.json`, gera `/agenda/` e avisa os novos no Telegram. |
| `pagina.mjs`, `sitemap.mjs` | Página estática com JSON-LD `MusicEvent` e a seção `agenda:start/end` do sitemap. |
| `poc-ig.mjs` | Avaliar banda nova (workflow manual `agenda-poc.yml`). |

Banda nova: rodar `agenda-poc.yml` com a conta, conferir se a agenda dela é legível e acrescentar em
`media/agenda/bandas.json`.

## Redes (`redes/`): story do dia e agenda da semana

Só publicam de verdade com a variável do repo `AGENDA_PUBLICAR=1` (Settings > Variables). Sem ela, geram a arte e
mostram no log o que sairia.

| Peça | Script | Workflow | Quando |
|---|---|---|---|
| Story "Alô, pessoal do RJ!" (um por estado com show hoje) | `redes/story-do-dia.mjs` | `agenda-story.yml` | todo dia 14:07 BRT |
| Post "Agenda da semana" (seg a dom, @ da banda e @ da casa) | `redes/post-semana.mjs` | `agenda-semana.yml` | segunda 10:07 BRT |

- Marcação: banda e casa entram em `user_tags`. Se o IG recusar a marcação, publica de novo sem ela e avisa no Telegram.
- Idempotência: `media/agenda/_story-log.json` (dia + estado) e `_semana-log.json` (semana ISO).
- Bandas cover nunca entram no reel semanal: estas peças não passam pela fila de notícias.
- Testar no mock: `npm run mock:server`, depois `IG_API_BASE=http://localhost:8788 IG_USER_ID=x IG_ACCESS_TOKEN=x
  REPO_PUBLIC_BASE=http://localhost:8788/mock-media/.. AGENDA_PUBLICAR=1 node scripts/agenda/redes/post-semana.mjs --no-git`
  (falha injetável `storytags` simula a recusa da marcação no story).
