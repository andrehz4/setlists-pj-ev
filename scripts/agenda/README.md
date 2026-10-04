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
