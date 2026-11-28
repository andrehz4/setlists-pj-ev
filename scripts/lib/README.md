# scripts/lib

Módulos compartilhados por todo o pipeline. Antes de escrever um helper novo, veja se ele já existe aqui.

| Arquivo | Pra quê |
|---|---|
| `estado.mjs` | `lerEstado(caminho, padrao, { valida })`: lê JSON de estado. Ausente vira o padrão; **corrompido derruba a run** (`EstadoCorrompido`). `gravarEstado`, `comLista("items")`. |
| `git.mjs` | `commitAndPush(paths, msg, { dry, tentativas, onRebaseConflict })`: único commit+push do projeto. Sempre aborta rebase que falhou; quem sabe reconciliar estado passa `onRebaseConflict`. |
| `pronuncia.mjs` | Memória de pronúncia das vozes do ElevenLabs: `checarFala(texto)` lista o que já soou estranho (bloqueia/suspeita, com a troca que funcionou). O gravador do story consulta; `scripts/regressao/pronuncia-narracao.test.mjs` barra frase fixa ruim. Fala estranha nova entra aqui. |
| `lib.test.mjs` | Testes dos dois, com repositórios git reais (inclui conflito). |

Regra: estado do pipeline (`media/news/*.json`, logs de story e reel, denylist, cooldown) NUNCA é lido com
`try { JSON.parse } catch { return vazio }`. Isso já apagou estado em silêncio e gerou repost.
