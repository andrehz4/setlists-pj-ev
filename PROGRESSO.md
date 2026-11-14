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
- Ordem nova: sáb 14/11 G, H, I, J, K (Black Circle, Blaymorphed, Lost Dogs, Love Boat, PJ 90); dom 15/11 H, I, J.
- D, E, F do Claude Design continuam a caminho (pedido retomado 22:04): com eles o rodízio vai a 14.

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

## 2026-10-24: limpeza do HD e quiz migrado pro repo privado

- HD: apagados o backup de 30/09 (1 GB, já sem uso) e sobras fora do git (~30 MB: design-handoff.zip de junho,
  reel/story já publicados, previews, kit do X de 30/09, caches do Python).
- Quiz de Quarta (planejado na sessão web, branch `ccr-e9c8f370-u6acn6`) foi pro repo privado `fabrica-quiz` com o
  histórico; branches `ccr-e9c8f370-u6acn6` e `ccr-204cfbb4-e1ak68` apagadas daqui. Do que a branch tinha fora do
  quiz, só o `docs/PLANO-REPO-PRIVADO.md` (plano de deixar ESTE repo privado, nada executado) veio pra main.

## 2026-10-18/19: bugs do reel viram testes de regressão, carrossel da agenda, contas da ElevenLabs

- **Regra nova**: todo bug pego vira teste em `scripts/regressao/` (README lá), provando o erro antigo e o certo.
  11 arquivos hoje. CI de testes agora instala ffmpeg (testes de áudio e vídeo medem de verdade).
- **Reel/story corrigidos**: recorte sem rosto (cortava antes de achar o rosto), fundo fantasma "CLIPE" em notícia
  sem foto, última letra da manchete comida no card, selo "CLIPE · MUDO" num vídeo com som, voz "Fá" e "Mungo" e
  "agitada" em espanhol (frases trocadas e regravadas, conferidas no mlx_whisper do voz-hz), fala cortada pela
  próxima (teto de 9 s), música 2,3 dB acima da voz (agora trilha normalizada, voz 13 a 23 dB acima), selo final
  parado com ffmpeg 8+.
- **ElevenLabs, 3 contas** (`scripts/publish/narracao/chaves.mjs`): principal -> reserva -> agenda, pula sem saldo
  ou sem crédito no meio; variável `ELEVENLABS_CHAVE` força uma. Saldos em 19/10: principal 260 (renova 31/10),
  reserva ~9.186 (18/11), agenda 4.076 (05/11). Reel de 25/10 vai usar a reserva.
- **Agenda da semana em carrossel** (desenho do Claude Design, proposta 1b/2b, `scripts/agenda/redes/carrossel/`):
  capa em ingressos (2 páginas se passar de 9 shows) + 1 slide por banda com selo, horário e marcação própria +
  chamada final. LIGADO (`AGENDA_CARROSSEL=1`) a partir de 19/10 10:07. CONFERIR o 1º post no ar.
- Testes não deixam mais lixo em /var/folders (`scripts/lib/pasta-temp.mjs`). O projeto youtube-marcaregistrada
  deixa ~24 mil pastas `tmpXXXX` lá (não mexido).
- Pendente: rosto atrás da faixa borrada nas cenas cinéticas do reel (Andre ainda não decidiu).

## 2026-10-14: minutos do GitHub Actions, colaboradores em horários fixos

- Diagnóstico: setlists gastava 91% da franquia (1.550 de 1.709 min em 14 dias, rumo a ~3.700 de 3.000 no mês). Culpado:
  contrib-curadoria disparado 76x/dia (TriggerAll #6 em `5,20,31 * * * *` + resto do cron `*/10` do YAML). Cada rodada
  de 5 s só via fila vazia e era cobrada como 1 min (~2.300 min/mês). Em ~1.000 rodadas só 1 envio real (05/10).
- Mudança: post de colaborador sai no próximo de 8 horários fixos, News fetch + 30 min (23h30, 1h30, 5h30, 8h30, 11h30,
  13h30, 17h30, 19h30 BRT), com folga mínima de 30 min (`backend/app/contrib/agenda.py`, `HORAS_UTC`; espelho em
  `colab/api.js`, teste de casamento em `colab/colab.test.mjs`). TriggerAll #6 agora `11,31 2,4,8,11,14,16,20,22 * * *`
  UTC (:11 adianta a curadoria, :31 publica; 2a chance porque as 3 rodadas do envio real de 05/10 travaram) (alterado pela API do painel); cron do YAML removido. Mudou os horários? Mudar os 3 juntos.
- Produção: sync pro terra-gentil-app (commit dd3f3b8, deploy perpetual-energy OK, `/contrib/config` 200). Testes: backend
  234, Terra Gentil 257, npm 360, painel 7, todos ok. Fila estava vazia na troca.
- Encaixe conferido com todos os robôs do TriggerAll e do YAML (rotina 03/09/15/21 UTC, story 16:00, reel dom 12:07,
  agenda 12:17/13:07/13:37, cápsula 23:07, community 00:25/12:25): folga mínima de 29 min, rodada de contrib dura até 15.
- Consequência aceita: espera do colaborador até ~4 h; aviso de pedido de acesso no Telegram também só nesses horários.
- Painel do TriggerAll mostrava o próximo disparo só pelo 1º minuto do cron; corrigido (repo triggerall 2939945).
- Depois, no mesmo dia, gatilho PAUSADO a pedido do Andre (sem colaboradores ainda).
- CONFERIR 15/10: `gh run list -w contrib-curadoria.yml --limit 10 --json createdAt,event` NÃO pode ter nada depois de
  2026-10-14T04:05Z (nem `schedule`, nem `workflow_dispatch`). Ao religar: só disparos às :11 e :31 das 8 horas, `success`.

## 2026-10-10: desfoque atrás da manchete no reel, zoom no rosto no story

- Desfoque comum em `scripts/publish/desfoque-faixa.mjs` (story e reel). Reel: cards de foto e cenas cinéticas
  (com foto ou com clipe, via ffmpeg) desfocam a faixa da manchete (`reel/desfoque.mjs`, `REEL_DESFOQUE=0` desliga).
  Abertura, papel, final e fundo fantasma ficam como estavam.
- Story: foto do card ganhou aproximação lenta (1,00 a 1,12 no card) puxando pro rosto (blazeface), sem rosto vai pro
  centro (`story/fundo.mjs`, `STORY_ZOOM=0` deixa parada). O desfoque acompanha o zoom.
- Conferido: `npm test` (359 ok), story e reel renderizados em dry-run, cena de clipe testada à parte.
- Conferir no ar: reel de domingo 11/10 e story de domingo.
- Pendente: no reel de 11/10 a manchete do Jeff Ament (card) corta "NEM QUE FOSSE DE" na borda direita (quebra de
  linha do card no `reel/cenas-blocos.mjs`, problema antigo, não do desfoque). Andre aprovou o desfoque e o zoom.

## 2026-10-09 (noite): story mais legível, stories de banda variados, agenda no TriggerAll, cartão do site

- Story diário de notícias (`scripts/publish/story/card.mjs`): foto desfocada e escurecida só na faixa da manchete
  (calculada pelo mesmo layout do texto, borda em degradê de 160 px); máquina de escrever em ritmo constante (a curva
  que freava deixava a última letra ~1 s parada).
- Story por banda: bandas do mesmo dia não repetem mapa, cor de fundo, abertura nem frase final (`variacaoDoDia` com
  k e mapas já usados, `falasDoStory` com k, tema girando a partir da cor do ciclo). A voz fica a do dia (a fala da
  data só existe gravada nela). Sem rota de turnê (show a menos de 150 km) só sobram 2 mapas: a 3ª banda repete um.
  Fala de apoio (data, estado, hora) que não cabe sai do story em vez de cancelar o dia (08/10 não saiu por isso).
  `--dry-run` agora refaz story já publicado (pra testar).
- Horário: o cron do GitHub atrasava 5 a 6 h (story das 10:37 saía 16h). Criados 3 gatilhos no TriggerAll
  (Agenda Coleta 09:17, Agenda da Semana seg 10:07, Agenda Story por Banda 10:37); cron do YAML vira reserva.
- Analytics (Cloudflare Web Analytics, 7 dias): 92 visitas, ~30 de fora (resto é Mac de teste); Facebook 12,
  Google 8, IG 1; home e /agenda/ as mais vistas. Cartão "Site" no TriggerAll com esses números (repo triggerall,
  rota `/api/analytics/site`, variáveis CF_* no Railway "hearty-trust"). O git do triggerall commita como
  terra-gentil (a Vercel bloqueia outro autor).

## 2026-10-06 (madrugada, parte 2): story por banda LIGADO, 3 mapas em rodízio, logo da banda no mapa

- Story por banda ligado (`AGENDA_STORY_VIDEO=1`) e passado pra manhã: `agenda-story.yml` às 10:37 BRT (depois da
  coleta das 09:17 e do post de segunda das 10:07).
- Mapa em rodízio diário (`story-banda/variacao.mjs`), desenho do Claude Design (projeto "Pearl Jam Cover Story
  Video", retorno em `design-handoff/retorno/story-mapa/variacoes-2026-10-06/`, fora do git), aprovado pelo Andre:
  A pinos (`cenas-b.mjs`), B papel recortado com fita, círculo à caneta e nome à mão (`mapa-papel.mjs`, fonte
  Permanent Marker em media/fonts), C rota de turnê da cidade da banda até os shows com km contando
  (`mapa-rota.mjs`). Rota só com >= 150 km e cidades achadas no IBGE; senão, papel. `AGENDA_MAPA=C` força no teste.
- Logo da banda no mapa (`story-banda/viajante.mjs`): viaja pela estrada na rota (some antes do pino cair), cai e
  vira o pino em A, colado no círculo e vira o pino em B. Stickman andando ficou de opção (`AGENDA_VIAJANTE=boneco`).
- Busca de cidade (`mapa.mjs` `localizar`) completa nome cortado que só um município completa ("São Bernardo" ->
  São Bernardo do Campo) e marca `aproximado` o que cai no meio do estado (aí a rota não é usada).
- Voz: frase padrão quando a banda não deu horário, "Confere o horário no perfil da banda!" (gravada nas 2 vozes,
  2,2 a 2,3 s, menor que a do horário). Conta ElevenLabs da agenda: ~5.320 caracteres sobrando.
- Próxima semana: qui 08/10 papel, sex 09/10 papel (nenhuma banda viaja 150 km), sáb 10/10 pinos, dom 11/10 papel.
- Andre pediu: logo da banda viajando (feito); próximo passo é só acompanhar os stories reais.

## 2026-10-06 (madrugada): story em vídeo POR BANDA pronto

- Robô `scripts/agenda/redes/story-por-banda.mjs` (+ `story-banda/`): um vídeo de 21,3 s por banda com show no dia
  (abertura com b-roll do acervo, logo, mapa, shows, final), voz fixa gravada (114 falas, Bella/Chris pelo dia, conta
  ElevenLabs SÓ da agenda: secret ELEVENLABS_API_KEY_AGENDA, chave local /Users/andrehz/.elevenlabs-key-agenda),
  data cortada da gravação do story diário, whoosh sintético, trilha do story. Nunca passa de 21,3 s (encaixe.mjs).
- Publica story de vídeo com marcação (banda + casas) e plano B sem marcação (`ig/story-video.mjs`). Testado no mock
  (publicar, não repetir, plano B) e no GitHub (render real, artefato conferido).
- Liga com a variável do repo AGENDA_STORY_VIDEO=1 (troca o "Alô, pessoal de..." no agenda-story.yml, 10:37 BRT).
  Teste manual: workflow agenda-story, video=true + dry-run=true + dia, baixa os MP4 como artefato.

## 2026-10-06 (noite): story em vídeo do mapa no Claude Design, sites das bandas

- Claude Design (projeto "Pearl Jam Cover Story Video") fez o protótipo de 15 s: abertura com clipe, mapa com zoom e
  pinos, lista de cidades com @, final em papel creme. Retorno em `design-handoff/retorno/story-mapa/` (MOTION-SPEC +
  story.jsx, fora do git). Andre trocou o conceito: 1 STORY POR BANDA (banda e casa repostam), aprovado
  ("ficou muito bom"): `story-banda.jsx` + `MOTION-SPEC-banda.md` (abertura com clipe e nome da banda, logo,
  mapa só das cidades dela, shows, final "Compartilha com quem vai com você" + Siga @smufdpj; marca = carimbo A).
  Próximo: portar pro renderizador do reel (SVG puro, 30 fps), logo real (media/agenda/fotos), clipe do acervo,
  trilha e voz ElevenLabs (3 frases em rodízio + pedido de compartilhar no fim). Marcação em story confirmada no app.
- Rascunho estático do mapa já no repo (`scripts/agenda/redes/mapa.mjs`, `arte-mapa.mjs`, bases IBGE em
  `media/agenda/geo/`), não ligado na publicação.
- Card da banda na agenda com link do site (Blaymorphed, PJ 90). As outras só têm Instagram; o site da Ribeirão
  estava fora do ar.

## 2026-10-06: 4 bandas novas na agenda

- Entraram PJ 90 (@pjnoventa), Lost Dogs (@pearljamsp), Pearl Jam Cover Ribeirão e The Homer (@thehomerpj): 7 bandas,
  55 shows. Leitores novos: agenda em blocos (`extrair-blocos.mjs`), aviso solto de um show (`extrair-solto.mjs`),
  linha com "•" e "—". Vários shows no mesmo dia. Legenda semanal com teto de 20 menções.
- Push via SSH do Mac falhou ("Permission denied (publickey)") durante instabilidade do GitHub; foi por HTTPS com o
  login do gh. Conferir se o SSH voltou.

## 2026-10-05: QA do site inteiro e correções

- Tablatura (Cifras & Tabs) voltou a desenhar. Eram 3 travas em fila: CSP sem `'self'` em font-src (fonte Bravura
  bloqueada desde maio), `settings.file` do alphaTab falhando calado (agora baixa e usa `api.load`) e worker que
  não subia com a lib carregada sob demanda (`useWorkers: false`).
- Rodapé e /show/ contam só shows presenciados (25; os 3 "extra" são acervo). Destaques com o mesmo desempate
  do Ranking e datas BR. Medidor de Raridades sem arco cortado. Fotos da aba BANDA em versão leve (`media/band/web/`).
- Cápsula: imagem do site agora é a foto da capa, não a capa pronta (`scripts/news/youtube/imagem-site.mjs`; as 25
  publicadas refeitas). Tarja de vídeo (letterbox) removida no salvamento (`scripts/news/tarja.mjs`; 9 digests
  corrigidos). Placeholder sem "em curadoria". Selo do rodapé sem data fixa.
- Cifra tocando: letra e braço do acorde visíveis juntos (desktop em duas colunas, celular com o braço grudado no
  rodapé; só CSS no fim do `css/app.css`, vale quando o Visualizador está ligado).
- QA no celular (390px, todas as abas e páginas estáticas): sem rolagem lateral em nenhuma; corrigidos mixer de
  Cifras (largura e fotos dos integrantes), botão Cifra, acentos, busca, filtros da Galeria, barra de filtros só nas
  abas onde vale, atalhos da agenda. Teste em moldura de celular: página local com iframe 390x844 (ver sessão).
- Imagens de notícia têm cache de 7 dias: quem já visitou pode ver a versão antiga por alguns dias.

## 2026-10-04 (madrugada, parte 3): páginas com a cara do site, QA

- Todas as páginas estáticas (agenda, show, música, disco, banda, notícias) usam a casca do site: topo ticket,
  abas da home com a da seção ativa, tema claro/escuro compartilhado (`scripts/seo/casca-site.mjs` +
  `casca-site/*.html|css`). Home ganhou a aba Agenda (link). CSS com `?v=` pra furar cache.
- Agenda: card da banda com a foto de perfil do IG em duotone (hoje são logos); foto de verdade = salvar
  `media/agenda/fotos/<conta>-manual.jpg`. Calendário com semanas completas. Bloco "Primeira vez" no fim.
- Sergio Vedder (@sergiovedder, shows do Eddie solo): conta pessoal, a API não lê ("Invalid user id"). Entra
  se ele virar conta profissional (criador, grátis) ou por cadastro manual. Os shows "SV Solo" já aparecem
  quando a Blaymorphed anuncia.
- QA no navegador: abas, filtro por UF, tema, links pro SPA, cards, calendário, celular 360px.

## 2026-10-04 (madrugada, parte 2): agenda nas redes e turnê oficial

- Story "Alô, pessoal do RJ!" (um por estado com show no dia, 14:07) e post de segunda "Agenda da semana" com o
  @ da banda e o @ da casa (marcados na foto; se o IG recusar a marcação, sai sem ela). Fora do reel.
- Turnê oficial lida do JSON embutido em pearljam.com/tour (Bandsintown recusa sem app aprovado). Hoje: Eddie
  Vedder no Ibirapuera, 20 e 22/11. Data oficial nova avisa no Telegram.
- Página /agenda/ redesenhada pelo Claude Design e portada pro gerador (CSS em `scripts/agenda/agenda.css`,
  calendário em grade, filtro por estado só com CSS). Agenda no menu comum (816 páginas regeneradas), título
  pra busca "shows de Pearl Jam no Brasil", eventos completos, lastmod diário, indexação pedida.

## 2026-10-04 (madrugada): token restrito, Terra Gentil sem CVE, POC da agenda

- Token do refresh do IG trocado por fine-grained (só este repo, só Secrets); clássico revogado; teste ok.
- terra-gentil-app (produção do fórum): já tinha e-mail privado e JWT obrigatório; subiram as deps sem CVE
  (Pillow 12, authlib 1.8, PyJWT no lugar do python-jose, fastapi/starlette novos). 249 testes, deploy ok no
  Railway, fórum/login/painel conferidos no ar.
- POC da agenda de bandas cover com a @blaymorphed (API oficial, só legenda): `docs/agenda/PLANO-AGENDA.md`.
