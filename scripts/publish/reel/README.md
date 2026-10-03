# scripts/publish/reel

Reel semanal (domingo 09:00 BRT, `publish-reel.yml`) e o acervo de trechos de clipe usado no reel e no story.
Orquestrador: `scripts/publish/run-publish-reel.mjs`. Spec visual: MOTION-SPEC do Claude Design
(`design-handoff/retorno/movie/project/entrega/MOTION-SPEC.md`, só no Mac do Andre, gitignored).

## Render (o que roda no GitHub)

| Arquivo | Papel |
|---|---|
| `base.mjs` | Medidas, durações, marca, easings. |
| `plano.mjs` | Plano de cenas: cold open 3 s + blocos de 4,5 s + outro 2,5 s. |
| `cenas-abertura-final.mjs`, `cenas-blocos.mjs`, `atomos.mjs` | SVG de cada cena (cinética, card, papel) e peças comuns. |
| `midia.mjs` | Fotos de fundo (fallback de banda), Ken Burns, encode. |
| `transicoes.mjs` | Flag `REEL_TRANSICOES=1`: clipe de 0,7 s em cada troca de cena e abertura com capa. |
| `render.mjs` | Orquestra frames + ffmpeg. |

## Acervo de clipes (roda no Mac, à mão)

Lista em `media/reels-clips/transicoes/transicoes.json` (700+ trechos com tags de b-roll). Os MP4 ficam no R2
(`acervo/`), não no git.

| Comando | Pra quê |
|---|---|
| `node scripts/publish/reel/planos.mjs <video>` | Grade plano a plano; o Claude olha e escolhe. `--importar p3:nome --musica X` importa. |
| `node scripts/publish/reel/acervo-auto.mjs <video ou link>` | Acha trechos com rosto e movimento sozinho. |
| `node scripts/publish/reel/grade-auto.mjs .momentos/<nome>` | Grade dos candidatos do acervo-auto. |
| `node scripts/publish/reel/momentos.mjs` | Melhores momentos (muito movimento). |
| `node scripts/publish/reel/importar-transicao.mjs`, `trazer-do-baixa.mjs` | Trazem cortes prontos do baixa-clipehz (só leitura de lá; outra IA cuida dele). |
| `node scripts/publish/reel/acervo-r2.mjs` | Sobe e confere o acervo no R2. |
| `node scripts/publish/reel/camada-capa.mjs` | Exporta a camada da capa da abertura. |
| `rosto/` | Rastreio de rosto (Apple Vision, só Mac) pro recorte 9:16. |

Direitos autorais: trecho de clipe entra SEMPRE mudo e curto (2 a 6 s); a trilha é royalty-free própria.

## Testes

`transicao.test.mjs`, `rodizio.test.mjs`, `rosto/rosto.test.mjs` e `scripts/publish/reel.test.mjs`. Validar no mock:
`node mock-ig/run.mjs reel`.
