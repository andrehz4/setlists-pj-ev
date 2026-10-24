# Plano: deixar o repositório privado

Status: plano (23/10/2026), nada executado. Motivo: o Andre não quer que copiem o código.

## O que muda e o que não muda

- **Protege**: o pipeline (`scripts/`), o backend, os prompts da routine e de voz, o quiz, a história de commits.
- **Não protege**: o site em si. O navegador baixa `index.html`, `css/app.css`, `dados/*.js` e as letras; isso
  continua visível pra quem abrir o código-fonte da página. Não tem como esconder o que roda no navegador.
- **Não apaga o passado**: o repo é público desde 07/05/2026. Quem já clonou continua com a cópia. Hoje tem 0 forks.

## Bloqueios encontrados (resolver ANTES de virar a chave)

1. **Imagens e vídeos servidos pelo `raw.githubusercontent.com`.** Com o repo privado, esse endereço passa a pedir
   login e o Instagram e o Facebook não conseguem baixar a mídia: o post falha. Usam o raw como endereço padrão ou
   reserva: `scripts/publish/ig/http.mjs`, `run-publish-story.mjs`, `run-publish-reel.mjs`, `run-publish-capsula.mjs`,
   `fb-smoke.mjs`, `scripts/agenda/redes/post-semana.mjs`, `story-do-dia.mjs` e `scripts/contrib/publicar.mjs`.
   Workflows SEM as variáveis do R2 hoje (dependem 100% do raw): **`publish-instagram.yml` (o carrossel do feed)**,
   `publish-capsula.yml` e `contrib-curadoria.yml`. Os outros (reel, story, agenda) já sobem pro R2 e usam o raw só
   de reserva.
   Solução: todo publicador sobe a mídia pro R2 (`scripts/publish/midia-r2.mjs` já faz isso), os 3 workflows ganham
   as variáveis do R2, e a reserva do raw sai (sem R2 = a run para e avisa no Telegram, em vez de postar quebrado).
   A mídia fixa do `fb-smoke` vai pro R2 (`acervo/`).

2. **Minutos do GitHub Actions.** Repo público não gasta franquia; privado gasta. **Medido em 24/10**: 173 runs entre
   17 e 23/10 = 269 min cobráveis (cada job arredonda pra cima), **~1.150 min/mês** extrapolado. Maiores: News fetch
   ~240 (56 runs de ~40 s cobradas como 1 min), agenda-story ~150, Tests ~150, Story ~146, carrossel ~137. Fora da
   conta: contrib-curadoria desligado (ligado, 8 runs/dia somam ~250+) e o quiz (~5 min por quarta + métricas, ~40).
   Estimativa antiga (PROGRESSO 14/10) era 1.600 a 2.100. Conferir em GitHub > Settings > Billing > Usage se os minutos dele já entram na conta:
   - se já entram: nada muda;
   - se não entram: somar com os outros repos privados e ver se cabe na franquia (2.000 no Free, 3.000 no Pro).
     Estourar NÃO cobra (sem cartão), mas PARA os jobs até virar o mês: o feed, o story e o reel param juntos.
     Cortes possíveis: keep-db-awake num Worker da Cloudflare (~75 min/mês), juntar workflows pequenos, contrib pausado.

## O que continua funcionando sem mexer

- **Cloudflare Pages** (deploy do site no push da main): o app do GitHub da Cloudflare já tem acesso; repo privado
  funciona igual. Conferir no painel depois da troca.
- **TriggerAll**: dispara com o PAT do Andre; se for token "fine-grained", conferir se inclui este repo.
- **Routine de curadoria e sessões do Claude**: entram pelo app do GitHub; funcionam com repo privado.
- **Worker `news-merge-dispatch`**: usa token próprio. **Dependabot**: funciona.
- **Clones no Mac** (x-kit, baixa-clipehz lendo daqui): já usam login do git; continuam.

## Passo a passo

| # | Quem | O quê |
|---|---|---|
| 1 | Andre | Conferir os minutos do Actions (bloqueio 2) e o plano do GitHub. |
| 2 | Claude | Tirar a dependência do raw (bloqueio 1): R2 nos 3 workflows, reserva do raw removida, testes e mock. |
| 3 | Claude | Rodar o `run_secret_scanning` no histórico: o repo foi público, segredo vazado tem que ser trocado de qualquer jeito. |
| 4 | Claude | Opcional: `LICENSE` com "Todos os direitos reservados" (sem licença já é proibido copiar; isso só deixa explícito). |
| 5 | Andre | Validar 1 dia inteiro com o R2 em tudo (feed, story, cápsula, agenda) ainda com o repo público. |
| 6 | Andre | GitHub > Settings > General > Danger Zone > Change visibility > Private (só o dono consegue). |
| 7 | Os dois | Nas 48 h seguintes: deploy do site, carrossel, story, reel de domingo, cápsula, agenda, TriggerAll. |

**Volta atrás**: se algo quebrar, mudar a visibilidade de novo pra Public no mesmo lugar (imediato).
