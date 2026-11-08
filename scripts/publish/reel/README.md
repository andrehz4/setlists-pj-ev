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

## Fallback do reel (preso no processamento do IG)

Em 08/11/2026 o IG deixou o container em `IN_PROGRESS` por 5 min e o reel da semana não saiu. Agora são 4 camadas:

| Arquivo | Papel |
|---|---|
| `fallback.mjs` | `publishReelComFallback`: espera 10 min; se travar, cria um 2º container do MESMO vídeo (8 min). Erro no `media_publish` NÃO vira outro container (falso-erro 2207051 duplicaria o reel). |
| `pendente.mjs` | Entrada de falha do `_reel-log.json` (containers, legenda, vídeo), achar a pendência (validade 20 h) e a janela de domingo BRT. |
| `retomar.mjs` | Próxima rodada: container terminou de processar = só publica (IG + FB), sem renderizar de novo. |
| `registro.mjs` | Alerta no Telegram quando o reel falha (`avisarFalha`) e aviso de reel retomado. |

Reservas no mesmo domingo (crons 12h07, 15h07 e 18h07 BRT, job de 45 min, `REEL_SO_DOMINGO=1` e `REEL_RESERVAS=1`):
só entram no `publish-reel.yml` aplicando `scripts/publish/reel/RESERVAS-WORKFLOW.md` (o acesso do Claude ao GitHub não tem o escopo
`workflow`). Sem elas, retomar é manual: Run workflow. `REEL_SO_DOMINGO` impede rodada atrasada na segunda de publicar a semana seguinte. Testar contra o mock:
`REEL_ESPERAS_MS=300,300 REEL_POLL_MS=30` + `storyPolls` alto no mock (container preso) e depois `storyPolls=0`.

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
