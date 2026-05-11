# PROGRESSO, setlists-pj-ev

## Data
2026-05-11

## O que foi feito (esta sessao)
- Batches 14 a 21 da sprint i18n PT commitados (mais 80 musicas dict traduzidas, formato bilingue text + text_pt + byShow + byShow_pt)
- Batch 22: as 7 entradas que estavam como string crua foram convertidas pro formato dict canonico (text + text_pt). Para 3 delas com show documentado em SHOWS, tambem foram adicionados byShow + byShow_pt:
  - `its ok` (tag de Black no pj-2015-11-14)
  - `fuckin up` (slot 33 do pj-2015-11-11)
  - `i want you so hard (bad boy news)` (pj-2015-11-20 e pj-2015-11-22)
- Para as 4 do Earthling 2022 sem show documentado (`long way`, `brother the cloud`, `invincible`, `the haves`), so text + text_pt (byShow opcional, codigo de _resolveInterpEntry trata ausencia)
- _meta atualizado: scope reflete 100% e data 2026-05-11

## Estado atual
- Sprint i18n PT 100% concluida: 220/220 musicas com text_pt
- 0 entradas em formato string crua (eram 7, agora todas dict)
- 216 com byShow (4 sem byShow sao as Earthling sem show documentado)
- HEAD: trabalho do batch 22 ainda nao commitado (proximo passo)

## Proximo passo
1. git commit do batch 22 + atualizacao do _meta + PROGRESSO.md
2. Sprint i18n encerrada. Proxima frente fica a criterio do Andre

## Arquivos chave
- `media/interpretations.json` (1.21 MB, 220 entradas, 220 com PT, 216 com byShow)
- `index.html` linha 6372 (`_resolveInterpEntry`) confirma que byShow e opcional

## Pipeline padrao por batch (referencia historica)
1. Listar top 10 sem `text_pt` por byShow count
2. Extrair fonte das 10 entradas pra `%TEMP%\batchN_src.json`
3. Traduzir pra `%TEMP%\batchN_pt.json` (text_pt + byShow_pt espelhando byShow)
4. Validar: 0 em-dash, 10 keys, byShow_pt counts batem com byShow
5. Merge no interpretations.json com OrderedDict, escrever com `\r\n`
6. Commit + push

## Blockers
Nenhum

## Comando exato pra continuar
cd C:\Gitlab_hz\pearljam\setlists-pj-ev && claude
