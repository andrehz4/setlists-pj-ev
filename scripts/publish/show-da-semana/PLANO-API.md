# Plano: publicar o Show da Semana pela API (sem Business Suite)

Status: PROPOSTA, não implementado. Decidir em 03/12/2026, depois de ver os números do #1 (01/12) e do #2 (03/12).

## Por que

- O Business Suite só agenda até 29 dias à frente: hoje são 3 levas manuais no navegador (#11 a #26).
- Cada post no navegador leva upload, legenda digitada, data, hora, checagem e Turbinar. Já deu 2 tropeços
  (área de transferência e sugestão de hashtag), barrados pela checagem.
- O projeto já publica carrossel no IG e no FB pela API, com fila, Telegram e mock. A cápsula do YouTube
  (`scripts/publish/run-publish-capsula.mjs`) é o modelo mais próximo.

## Como (Regra 0: módulo apartado, desligado por flag)

Tudo em `scripts/publish/show-da-semana/`, arquivos de até 160 linhas.

1. **Slides prontos antes, fora do Actions.** No Mac: `render.mjs` de cada ficha (precisa do Chrome e das fontes,
   que o Actions não tem igual) e envio pro R2 com `publicarViaR2` (`scripts/publish/midia-r2.mjs`), chave
   `show-da-semana/<NN>/01..04.jpg`. Novo `subir.mjs` faz render + R2 + grava as URLs na fila. Nada de JPG no git.
2. **Fila de estado** `media/show-da-semana/_fila.json` (lida com `lerEstado`, gravada com `commitAndPush`):
   por post `n`, `id`, `quando`, `urls[4]`, `legenda` (copiada da ficha), `postedAt`, `igId`, `fbId`, `erro`.
   #1 a #10 entram já marcados `canal: "business-suite"` pra nunca duplicar o que está agendado.
3. **`publicar.mjs`** (roteiro curto): pega o primeiro post com `quando <= agora` e sem `postedAt`, publica com
   `publishCarouselFromUrls` (IG) e `publishAlbumFromUrls` (FB), marca postado, avisa no Telegram. Um post por run,
   idempotente (rodar 2x não posta 2x; usa a mesma guarda de falso-erro 2207051 do feed).
4. **Workflow** `publish-show-da-semana.yml`: `workflow_dispatch` + cron de reserva; disparo principal pelo
   TriggerAll em ter e qui 17:07 e sáb 11:07 BRT (o cron do GitHub atrasa horas). Flag `SHOW_DA_SEMANA=1`
   (variável do repo); sem ela, sai sem fazer nada.
5. **Checagem antes de publicar** (mesma régua do navegador): 4 URLs públicas respondendo 200, legenda começa com
   "Show #N da série", 1 "Segue a gente", exatamente 4 hashtags, ficha com `status: aprovado`.

## Testes

- `show-da-semana/publicar.test.mjs`: escolhe o post certo, pula `business-suite`, não repete postado, barra
  legenda com 5 hashtags, barra ficha não aprovada.
- Mock: `node mock-ig/run.mjs show-da-semana` (novo alvo no `mock-ig/run.mjs`), com `ghostpublish` e `ratelimit`.
- Bug achado vira teste em `scripts/regressao/`.

## Arquivos (estimativa)

Novos: `subir.mjs`, `fila.mjs`, `publicar.mjs`, `publicar.test.mjs`, `.github/workflows/publish-show-da-semana.yml`.
Mexe: `mock-ig/run.mjs` (alvo novo), README daqui, PIPELINE.md (seção TriggerAll), PROGRESSO.md.
São mais de 5 arquivos: apresentar este plano ao Andre antes de codar.

## O que continua manual

- Música no carrossel: nem a API nem o Business Suite põem. Quem quiser, põe pelo celular depois de publicado.
- Cadastrar os 3 horários no TriggerAll (painel do TriggerAll, como os outros workflows).
- Pôsteres pendentes: #21 (La Plata, arquivo "mock") e #24 (Sydney, baixa resolução).

## Ordem sugerida na sessão

1. Ler este arquivo e o README daqui. 2. `fila.mjs` + teste. 3. `publicar.mjs` + teste + mock.
4. `subir.mjs` e subir #11 a #26 pro R2. 5. Workflow com a flag desligada, dry-run. 6. Ligar a flag, cadastrar no
TriggerAll e acompanhar o #11 (26/12) no Telegram.
