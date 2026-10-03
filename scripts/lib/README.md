# scripts/lib

Módulos compartilhados por todo o pipeline. Antes de escrever um helper novo, veja se ele já existe aqui.

| Arquivo | Pra quê |
|---|---|
| `estado.mjs` | `lerEstado(caminho, padrao, { valida })`: lê JSON de estado. Ausente vira o padrão; **corrompido derruba a run** (`EstadoCorrompido`). `gravarEstado`, `comLista("items")`. |
| `git.mjs` | `commitAndPush(paths, msg, { dry, tentativas, onRebaseConflict })`: único commit+push do projeto. Sempre aborta rebase que falhou; quem sabe reconciliar estado passa `onRebaseConflict`. |
| `lib.test.mjs` | Testes dos dois, com repositórios git reais (inclui conflito). |

Regra: estado do pipeline (`media/news/*.json`, logs de story e reel, denylist, cooldown) NUNCA é lido com
`try { JSON.parse } catch { return vazio }`. Isso já apagou estado em silêncio e gerou repost.
