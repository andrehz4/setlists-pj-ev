# PROGRESSO, setlists-pj-ev

Regra: este arquivo guarda o **estado agora** e as últimas ~2 semanas (teto de 300 linhas, testado em
`scripts/docs/docs.test.mjs`). Sessões mais antigas vão pra `docs/progresso/AAAA-MM.md`. Ao fechar sessão:
atualizar "Estado agora", escrever a sessão no topo e mover o que passar do teto pro arquivo do mês.

## Estado agora

- **Agenda lê as casas de show (13/11):** post de colaboração (casa + banda) só aparece no feed da casa, e o show da
  Love Boat de 14/11 no Studio Rock Café escapou. Agora a coleta lê `media/agenda/casas.json` (25 casas) e entende
  "Sábado tem" sem data (`scripts/agenda/casas/`, flag `AGENDA_CASAS=0` desliga). CONFERIR sáb 14/11 10:37 o story da
  Love Boat. Vozes: `agenda-voz.yml` é MANUAL e quebrava sem ffmpeg (Jeremy nunca tinha voz); consertado e gravado.
  "pro" a voz lê PRÓ: frases trocadas, regra no teste de pronúncia.
- **Banda nova na agenda (13/11):** Love Boat Tribute (@loveboat_tribute, Santos/SP) cadastrada e no ar em `/agenda/`. Andre mandou DM pedindo ano de início, foto e história: quando responderem, completar
  `desde` e `resumo` em `media/agenda/bandas.json` e salvar a foto como `media/agenda/fotos/loveboat_tribute-manual.jpg`.

- **Trilha própria (13/11): LIGADA** no reel, no story diário e no story da agenda (flag `TRILHA_PROPRIA=1` nos 3
  workflows). 9 camas Suno Premier, 50 pistas em AAC 256k no R2 (`trilha/<cama>/<instrumento>.m4a`), kit no git
  (`scripts/publish/trilha/kit-publicado.json`); o Actions baixa só a cama do dia (~23 MB). Porta única
  `scripts/publish/trilha/ligar.mjs`: sem flag, sem kit ou R2 fora, volta pra trilha antiga sem derrubar o publish.
  Reel e story pulam o loudnorm com a trilha própria (apagaria o golpe); sob a narração entra com ganho fixo + sidechain.
  Testado no mock: reel W46 (golpe de -28 pra -17 dB aos 3 s e aos 25,5 s), story diário e 5 stories da agenda (dry).
  Suno grátis (06, 07) saiu da pasta; Pixabay fica só de reserva. Faixa nova: `node scripts/publish/trilha/r2.mjs subir`.
  PRÓXIMO: ouvir o reel de domingo 15/11 e o story de amanhã em produção (primeiro uso com narração ElevenLabs por cima).

- **Reel de domingo com fallback (08/11):** a run de 08/11 falhou (W45): container do IG ficou `IN_PROGRESS` além dos 5 min.
  Agora: espera 10 min, 2º container do mesmo vídeo (8 min), retomada sem renderizar na próxima rodada, crons de reserva
  12h/15h/18h BRT no domingo (TriggerAll #016 criado em 13/11, `7 12,15,18,21 * * 0` UTC) e alerta no Telegram (`scripts/publish/reel/{fallback,pendente,retomar}.mjs`). Testado
  ponta a ponta no mock (travou, retomou sem refazer o MP4, não duplicou).

- Site, fórum e pipeline no ar. Publish IG/FB, story diário, reel de domingo, cápsulas, contrib e X manual rodando.
- Instagram oficial (@pearljam, @eddievedder) é fonte de notícia desde 02/10 (`scripts/news/ig-oficial.mjs`).
- Vistoria de saúde executada em 03/10 (ver a sessão abaixo e `docs/VISTORIA-2026-10-02.md`, seção Status).
- Quiz de Quarta: mora no repo PRIVADO `andrehz4/fabrica-quiz` desde 24/10 (estado e próximo passo no PROGRESSO.md
  de lá). Aqui no público não fica nada do quiz.
- Pendências vivas:
  - Agenda (POC no ar desde 04/10, reavaliar 11/10): `/agenda/` com 7 bandas e a turnê oficial, coleta diária
    09:17 (`agenda.yml`). Post "Agenda da semana" (segunda 10:07) e STORY EM VÍDEO POR BANDA (todo dia 10:37,
    `AGENDA_STORY_VIDEO=1` + `AGENDA_PUBLICAR=1`, ambos LIGADOS em 06/10). Marcação no story de vídeo OK
    (`marcou: true` nos 3 de 09/10). Desde 09/10 os 3 robôs da agenda são disparados pelo TriggerAll (ids 7, 8, 9):
    CONFERIR sáb 10/10 se a coleta rodou 09:17 e o story 10:37 (antes o cron do GitHub atrasava 5 a 6 h).
    Perguntar a uma banda se apareceu o botão de repostar. Conferir se /agenda/ entrou no índice do Google.
  - Ligar `RATE_LIMIT_IP=ultimo` no Railway depois de conferir o X-Forwarded-For nos logs.
  - Revisar os PRs do dependabot (abrem toda semana).
  - Conferir no ar o reel de domingo 04/10 (1º no padrão novo, agora às 09h07) e o story de hoje com o domínio novo.
  - 2 contas "André Zimermann" no forum_users (a de 18/05 está vazia).
  - Pedido da abertura SMUFDPJ nas legendas está com a outra IA (baixa-clipehz).
  - Colaboradores PAUSADOS em 14/10 (ainda não há colaboradores): TriggerAll #6 sem horário (custo zero de Actions).
    O painel `colaborar.html` continua aberto, e um envio feito agora fica parado sem aviso no Telegram. Pra religar:
    colar `11,31 2,4,8,11,14,16,20,22 * * *` no horário do gatilho (está na descrição dele) e conferir o 1º disparo.
    Conta do Actions (todos os repos): ~2.080 min/mês com contrib ligado, ~1.600 pausado, antes ~3.900 (franquia 3.000).
    Outubro deve fechar ~2.700. Candidato a cortar depois: keep-db-awake (~75 min/mês) num Worker da Cloudflare.
    Nunca houve cobrança (Payment history vazio, sem cartão: estourar PARA os jobs até virar o mês, não cobra).

## 2026-11-13 (noite, parte 3): mais 4 layouts no story por banda (K, L, M, N), LIGADOS

- Rodízio foi de 7 pra 11: K setlist de palco (folha com fita crepe, "ENSAIO" riscado, BIS circulado), L fita cassete
  (deck, encarte com mapa, LADO A, rebobina), M lambe-lambe (cartazes colados na parede), N rádio FM (dial, visor,
  radar). Desenho do Claude Code, mesma régua de tempo; abertura deixa o clipe aparecer, b-roll igual.
- Fonte Permanent Marker (K, L) já estava em media/fonts. "de <cidade>" virou "base: <cidade>" (evita "de Rio").
- Layout O "Ten" (homenagem, sem copiar a capa): fundo rosa, placas de compensado, letreiro pintado à mão e 5
  bonequinhos em silhueta unindo as mãos no alto (`layouts/O/bonecos.mjs`), na abertura e no final. Rodízio vai a 12.
- Layout P "Vs." (homenagem): xerox P&B granulado, alambrado de arame e ovelha em cartum apertando o focinho na
  cerca (`layouts/P/ovelha.mjs`). Rodízio vai a 13. Próximo: Q "Vitalogy". D/E/F do Design retomados às 22h.
- Layout Q "Vitalogy" (homenagem, aprovado pelo Andre 13/11): livro velho de medicina caseira, capa de tecido com
  título em dourado, logo como "Fig. 1", estado como "Prancha II", índice com um capítulo por show, carimbo + ex-libris
  no final. 4 temas (ferrugem, musgo, couro, creme). Rodízio vai a 14. Refino pendente: pontilhado do índice (larguras
  estimadas, medir com sharp) e pinos empilhados em cidades vizinhas no mapa.
- Claude Design: D/E/F PRONTOS. Zip extraído em `design-handoff/retorno/story-mapa/layouts-DEF/` (gitignored):
  story-banda-D/E/F.jsx, MOTION-SPEC-banda-D/E/F.md, story-banda-comum.js. Falta portar como layouts/D, E, F.
- Layouts R a Z (homenagens, aprovados pelo Andre 13/11, feitos por agentes em paralelo): R No Code (mural de
  polaroides), S Yield (estrada e placas verdes), T Binaural (céu estrelado e osciloscópio), U Riot Act (ofício
  datilografado e carimbos), V Avocado (feira livre), W Backspacer (gibi e máquina de escrever), X Lightning Bolt
  (neon art déco), Y Gigaton (gelo e aurora), Z Dark Matter (pintura com luz). Rodízio vai a 22. Nenhum usa nome de
  disco na tela nem foto de capa. Cada um tem `medida.mjs` próprio (largura real do .ttf): juntar num módulo comum.
- ATENÇÃO render: R ~11 min, Z ~5,5 min, X ~4,5 min no Mac (blur/grão). Conferir se o story diário segue no horário
  no CI; se atrasar, aliviar o blur desses layouts.
- Pendências comuns: com 1 show sobra espaço embaixo; pinos de cidades vizinhas juntos; não há fonte mono de
  máquina de escrever em media/fonts (U e W usam Inter em grade).
- Ordem nova: sáb 14/11 G, H, I, J, K (Black Circle, Blaymorphed, Lost Dogs, Love Boat, PJ 90); dom 15/11 H, I, J.

## 2026-11-13 (noite, parte 2): 4 layouts novos no story por banda, LIGADOS

- Problema: com 9 bandas, os stories por banda só mudavam de cor. Agora o rodízio tem 7: A/B/C (mapas antigos) + G
  painel de embarque (split-flap, mapa de LED), H disco de vinil, I jornal "Edição Extra", J conversa de grupo.
  Desenho do Claude Code, mesma régua de tempo (`tempo.mjs`): voz, clipes, trilha e publicação não mudaram.
- Código em `scripts/agenda/redes/story-banda/layouts/<letra>/` (registro em `layouts/index.mjs`, 4 temas cada).
  Flag `AGENDA_LAYOUTS_NOVOS=1` no `agenda-story.yml`. Rascunho sem publicar: `rascunho.mjs --layouts G --mp4`.
- Sáb 14/11: Black Circle B, Blaymorphed G, Lost Dogs H, Love Boat I, PJ 90 J. CONFERIR os 5 stories às 10:37.
- Claude Design (projeto "Pearl Jam Cover Story Video"): pedido de mais 3 (D, E, F) enviado
  (`design-handoff/pedidos/story-banda-layouts-DEF.md`), PAUSADO no limite semanal (volta 22:00). Próximo: Resume,
  baixar o zip, portar cada um como `layouts/D` etc. (o `quadro(T, story, tema, logoUri)` dos layouts meus é o molde).
- Claude Design standalone fecha em 14/12/2026: mover os projetos pro Claude antes disso.
- Fala da data sai em todos os stories ("não cabe 1.211x"): conferir se em produção é igual.

## 2026-11-13 (noite): trigger do reel, CI verde, GA achado, dependabot

- **Reel no TriggerAll:** não existia (15 triggers, nenhum do reel). Criado o #016 "Publish Reel (domingo)", `7 12,15,18,21 * * 0`
  UTC (09:07, 12:07, 15:07, 18:07 BRT), token `GITHUB_ACTION`. O card mostra "09:07 (14h)" na sexta: bug só da tela
  (`TriggerCard.jsx` ignora dia da semana); o node-cron do backend respeita o domingo. CONFERIR dom 15/11 09:07.
- **CI vermelho desde 09/11:** `scripts/regressao/selo-final-animado.test.mjs` supunha que o ffmpeg 8 recusa `-vsync`; quem
  removeu foi o 9 (Mac 9.0.2, Ubuntu do CI 8.0.1). Prova do bug só no 9+, e checagem dos argumentos em qualquer versão.
- **Google Analytics achado:** G-234ZL5MF0T está na eng.andrehz, conta "Default Account for Firebase", propriedade
  "teste-15e8d" (240201637), fluxo "Site Pearl Jam". Recebendo tráfego. Vale renomear a propriedade.
- **Dependabot:** merge de #527, #548, #549, #551, #553 (backend, cópia atrasada) e #616 (got 16, CI verde). #615 (SDK
  Anthropic 1.4) passa nos 469 testes localmente; o dependabot não rebaseou, pedi `recreate`: dar merge quando o CI ficar verde. #506, #525, #526, #569
  mexem em workflow: o token do Claude não tem escopo `workflow`, merge à mão pelo Andre.
- **ALERTA Actions:** o TriggerAll projeta 4.786 min em novembro (2.039 até dia 13, franquia 3.000, estoura ~dia 20). Estourar
  PARA os jobs até virar o mês (sem cartão, não cobra). Investigar o que subiu (trilha própria nos stories?).

## 2026-11-08: reel W45 preso no IG, fallback no ar e reel no TriggerAll (HANDOFF)

- **O que houve:** a run de domingo (cron do GitHub, 14:53 BRT) criou o container do IG, ele ficou `IN_PROGRESS` por 5 min
  e o robô desistiu (`container ... nao ficou pronto em 300000ms`). Não foi cota (uso zerado) nem gatilho perdido.
- **Gatilho:** o reel NUNCA esteve no TriggerAll. Roda no cron do próprio GitHub (`7 12 * * 0`), que atrasa 3h40 a 5h47
  todo domingo (medido em 7 semanas). Run vindo do TriggerAll aparece como `workflow_dispatch` com `:01` nos segundos.
- **Feito (PR #621, squash):** `scripts/publish/reel/{fallback,pendente,retomar}.mjs`: espera 10 min, 2º container do
  MESMO vídeo (8 min), falhou = log guarda containers + legenda + vídeo e a próxima rodada só publica (validade 20 h);
  entrada `aprovado` nunca renderiza outro vídeo; erro no `media_publish` não vira outro container (2207051). Alerta
  de falha no Telegram. `REEL_SO_DOMINGO` (só no cron) barra rodada atrasada que caísse na segunda. 8 testes novos.
- **W45 publicado à mão:** o Andre assistiu o MP4 do R2 e aprovou; entrada `aprovado` no `_reel-log.json`, run nº 24
  (`workflow_dispatch`) retomou o container de 18:01Z: IG `18126603427692997`, FB `122126663043322237`. Conferir no perfil.
- **PENDENTE (Andre):** criar 1 trigger no TriggerAll (`publish-reel.yml`, `7 12,15,18,21 * * 0` em UTC = 09:07, 12:07,
  15:07 e 18:07 BRT; idempotente). O Claude não alcança o servidor nem tem a senha: script que copia o trigger do
  `publish-story.yml` está em `scripts/publish/reel/RESERVAS-WORKFLOW.md`. Depois: conferir no painel (ativo, próxima
  execução domingo 12:07 UTC) e fechar o item abaixo.
- **Depois do trigger:** (1) o alerta do Telegram só diz "tento de novo sozinho" com `REEL_RESERVAS=1`, variável que
  só entraria pelo workflow: trocar o default em `reel/registro.mjs` (`avisarFalha`); (2) apagar a opção de crons do
  `RESERVAS-WORKFLOW.md` ou marcá-la como alternativa; (3) o cron do YAML fica de reserva (run idempotente).
- **Armadilhas:** o acesso do Claude ao GitHub NÃO tem escopo `workflow` (não edita `.github/workflows/`); o
  classificador bloqueia `--force-with-lease` (resolver com cherry-pick sobre o tip remoto, push fast-forward).
  Download do R2 exige o host `midia.somaisumfadepearljam.com.br` liberado (ambiente pessoal "SMUFDPJ: site, quiz e
  baixa-clipe", criado em 08/11). 6 testes de recorte de rosto (`scripts/regressao/recorte-rosto`) falham no ambiente
  da nuvem e na `main` limpa: não são do reel.
- **Quiz:** vive no repo privado `andrehz4/fabrica-quiz` (estado e próximo passo no PROGRESSO de lá). Nada dele aqui.

