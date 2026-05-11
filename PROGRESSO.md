# PROGRESSO, setlists-pj-ev

## Data
2026-05-10

## O que foi feito (esta sessao)
- Batches 5, 6, 7, 8 e 9 da sprint i18n PT commitados (50 musicas traduzidas, formato bilingue text + text_pt + byShow + byShow_pt)
- Fix do count-up tween nas stats da Raridades (`3f49076`): tick passou a ler `performance.now()` em vez do timestamp do rAF, com clamp `p in [0, 1]`. Resolve `-2.370 SHOWS` que aparecia no header
- HANDOFF.md sincronizado em `e2121ee` (depois ja avancou mais 2 batches sem update do handoff)

## Estado atual
- HEAD: `60199c3`, working tree limpo, branch `main` sincronizado com origin
- Sprint i18n PT: 93/221 musicas com `text_pt` completo (42%)
- 9 batches feitos. Padrao: 10 musicas por batch
- Todos os high-frequency com 4+ byShow ja foram. Cauda agora e 3 byShow ou menos

## Proximo passo
Batch 10 da sprint i18n. Top 10 candidatas atuais (3 byShow cada): `parting ways`, `the needle and the damage done`, `trouble`, `driftin`, `brain damage`, `under pressure`, `bu$hleaguer`, `light years`, `betterman`, `sad`. Confirmar fila exata com `python -c "..." | head` antes de extrair fonte

## Arquivos chave
- `media/interpretations.json` (1.12 MB, 221 entradas, 93 com PT)
- `index.html` (linhas 7022-7044 e' o tween da statsline corrigido)
- `HANDOFF.md` (snapshot completo do projeto, esta um pouco atras: ultimo update foi no batch 7)

## Pipeline padrao por batch
1. Listar top 10 sem `text_pt` por byShow count (script em `python <<PY ... PY`)
2. Extrair fonte das 10 entradas pra `%TEMP%\batchN_src.json`
3. Traduzir pra `%TEMP%\batchN_pt.json` (text_pt + byShow_pt espelhando byShow)
4. Validar: 0 em-dash, 10 keys, byShow_pt counts batem com byShow
5. Merge no interpretations.json com OrderedDict, escrever com `\r\n`
6. Commit + push

## Blockers
Nenhum

## Comando exato pra continuar
cd C:\Gitlab_hz\pearljam\setlists-pj-ev && claude
