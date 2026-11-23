# Reel "Agenda da semana" automático

Toda terça 11:07 BRT (TriggerAll -> `.github/workflows/publish-agenda-reel.yml`). Cobre terça a domingo.
Desligado sem a variável do repo `AGENDA_REEL=1`. Idempotente por semana ISO (`media/agenda/reel-log.json`).

## Como o vídeo nasce

O desenho é o próprio protótipo aprovado do Claude Design (projeto "Reel Agenda da semana"), copiado em
`media/agenda/reel-design/` (4 layouts x 3 paletas, `MOTION-SPEC.md` lá). Ele já vem pronto pra exportar vídeo:
cada quadro é função só do tempo. O `quadros.mjs` abre a `render.html` no Chrome headless (`cdp.mjs`, sem puppeteer),
manda o evento de seek do Design e tira um PNG transparente por quadro (30 fps, ~75 ms cada). O ffmpeg põe esse PNG
por cima do fundo (`fundo.mjs`: cortes do PJ na abertura, covers da banda nos dias) e do som (`audio.mjs`).

| Arquivo | Papel |
|---|---|
| `semana.mjs` | shows de terça a domingo -> formato do Design; rodízio layout x paleta (12 semanas sem repetir) |
| `falas.mjs` / `voz.mjs` | textos com a pronúncia aprovada de ouvido; ElevenLabs, voz FIXA Jessica, cache por texto |
| `tempos.mjs` | réguas do Design e do vídeo (corte da banda de 0,75 s antes de cada show) |
| `fundo.mjs` | trilha de vídeo de baixo; banda sem trecho = logo do Design, sem corte |
| `covers-r2.mjs` | acervo das covers no R2 (`acervo/covers/<conta>/`); `subir` / `conferir` |
| `legenda.mjs` | legenda no formato da W48 (marca banda e casa, teto de 20 @) |
| `render.mjs` | junta tudo: `node scripts/publish/agenda-reel/render.mjs --inicio AAAA-MM-DD [--layout B --paleta azul]` |
| `publicar.mjs` | R2 + IG + FB + Telegram; `--previa` só manda o link no Telegram; `--dry-run` só renderiza |

## Ajustes feitos no código do Design (marcados com `AGENDA_RENDER`/`AGENDA_WEEK`/`semClipe`)

1. `ClipPH` some no render (o clipe real entra por baixo no ffmpeg).
2. Fundo da peça transparente na abertura e nos dias.
3. Semana e cenas vindas de `window.AGENDA_WEEK` / `OM_SCENES` (a `render.html` põe pelo `#` da URL).
4. `DayBg` usa o logo quando o show tem `semClipe` (banda sem trecho no acervo).
5. Fim do fecho = duração da cena (`AGENDA_FECHO_DUR`); no original era fixo em 3 s e a fala longa ficava no preto.

Mudou o desenho no Claude Design? Baixe o zip (Share > Download project > Project archive), copie os `.jsx` pra
`media/agenda/reel-design/` e reaplique os 5 ajustes. Compare com `render.mjs` antes de subir.

## Testar

- `npm test` (`agenda-reel.test.mjs`)
- `node mock-ig/run.mjs agenda-reel --inicio AAAA-MM-DD` (publica no IG falso; não grava log nem commita)
- `gh workflow run publish-agenda-reel.yml -f modo=previa` (render no servidor, link no Telegram)
- Banda nova no acervo: trechos em `media/reels-clips/covers/<conta>/` + `node scripts/publish/agenda-reel/covers-r2.mjs subir`
