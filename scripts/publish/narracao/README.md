# narracao: voz lendo as manchetes do reel semanal

Módulo apartado (Regra 0). POC aprovada pelo Andre em 2026-09-30: ElevenLabs **Eleven v4** em português, vozes
**Jessica** e **Liam** revezando por semana ISO (par = Jessica, ímpar = Liam).

## Liga e desliga

No `publish-reel.yml`: `REEL_NARRACAO: '1'` e o secret `ELEVENLABS_API_KEY`. Sem os dois, ou com qualquer erro da API
ou da mixagem, o reel sai exatamente como antes (só música). Nunca derruba a publicação.

## Como funciona

1. `fala.mjs`: o que a voz lê em cada cena. Manchete = o **mesmo título da tela** (`title_pt`), com ajustes de fala
   (PJ = Pearl Jam, Jr. = Júnior, & = e, sem aspas). Abertura e encerramento são frases fixas.
2. `elevenlabs.mjs`: chama a API (modelo `eleven_v4`, `language_code: pt`). Nome em inglês sai com pronúncia nativa
   numa fala só. Erro 4xx (chave, plano, crédito) não repete.
3. `narracao.mjs`: gera as falas, mede a duração e devolve `sceneDurs`: **cada cena dura o tempo da sua fala**
   (+ folga, mínimo 3,5 s e teto 9 s por manchete). Depois do render, `mixarNarracao` põe as vozes e abaixa a trilha
   enquanto alguém fala (sidechain).
4. Abertura e encerramento de cada voz ficam guardados em `media/news/instagram-reels/narracao/` (nome com hash do
   texto) e são reaproveitados toda semana, sem gastar crédito.

Ganchos no código antigo (mínimos): `buildScenePlan(items, sceneDurs)` e `buildReelVideo({ sceneDurs })` em
`reel-video.mjs` (sem `sceneDurs` = durações fixas de sempre); o `run-publish-reel.mjs` chama a narração entre o plano de
cenas e o render.

## Crédito e plano

Plano grátis do ElevenLabs: uso não comercial com crédito. A legenda do reel termina com `voz: ElevenLabs` (discreto,
sem link nem domínio, a pedido do Andre). Se a página passar a ter receita, trocar pro plano Starter.
Custo: ~270 créditos por reel (10 mil por mês no grátis). Plano grátis não usa vozes da biblioteca (brasileiras) pela API.

## Testar local

```
REEL_NARRACAO=1 ELEVENLABS_API_KEY="$(cat /Users/andrehz/.elevenlabs-key)" node scripts/publish/run-publish-reel.mjs --dry-run --force
node --test scripts/publish/narracao/narracao.test.mjs
```
(o dry-run grava `media/news/instagram-reels/<semana>.mp4`: apagar depois, o reel de verdade sai no domingo)
