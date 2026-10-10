# PROGRESSO, setlists-pj-ev

Regra: este arquivo guarda o **estado agora** e as últimas ~2 semanas (teto de 300 linhas, testado em
`scripts/docs/docs.test.mjs`). Sessões mais antigas vão pra `docs/progresso/AAAA-MM.md`. Ao fechar sessão:
atualizar "Estado agora", escrever a sessão no topo e mover o que passar do teto pro arquivo do mês.

## Estado agora

- Site, fórum e pipeline no ar. Publish IG/FB, story diário, reel de domingo, cápsulas, contrib e X manual rodando.
- Instagram oficial (@pearljam, @eddievedder) é fonte de notícia desde 02/10 (`scripts/news/ig-oficial.mjs`).
- Vistoria de saúde executada em 03/10 (ver a sessão abaixo e `docs/VISTORIA-2026-10-02.md`, seção Status).
- Pendências vivas:
  - Agenda (POC no ar desde 04/10, reavaliar 11/10): `/agenda/` com 7 bandas e a turnê oficial, coleta diária
    09:17 (`agenda.yml`). Post "Agenda da semana" (segunda 10:07) e STORY EM VÍDEO POR BANDA (todo dia 10:37,
    `AGENDA_STORY_VIDEO=1` + `AGENDA_PUBLICAR=1`, ambos LIGADOS em 06/10). Marcação no story de vídeo OK
    (`marcou: true` nos 3 de 09/10). Desde 09/10 os 3 robôs da agenda são disparados pelo TriggerAll (ids 7, 8, 9):
    CONFERIR sáb 10/10 se a coleta rodou 09:17 e o story 10:37 (antes o cron do GitHub atrasava 5 a 6 h).
    Perguntar a uma banda se apareceu o botão de repostar. Conferir se /agenda/ entrou no índice do Google.
  - Google Analytics do site (G-234ZL5MF0T) não aparece na conta eng.andrehz: descobrir em qual conta Google está.
  - Ligar `RATE_LIMIT_IP=ultimo` no Railway depois de conferir o X-Forwarded-For nos logs.
  - Revisar os PRs do dependabot (abrem toda semana).
  - Conferir no ar o reel de domingo 04/10 (1º no padrão novo, agora às 09h07) e o story de hoje com o domínio novo.
  - Backup de 30/09 (`/Users/andrehz/Documents/Githubhz/_backup-setlists-pj-ev-2026-09-30.git`, 1 GB): decidir se apaga.
  - 2 contas "André Zimermann" no forum_users (a de 18/05 está vazia).
  - Pedido da abertura SMUFDPJ nas legendas está com a outra IA (baixa-clipehz).

## 2026-10-10: desfoque atrás da manchete no reel, zoom no rosto no story

- Desfoque comum em `scripts/publish/desfoque-faixa.mjs` (story e reel). Reel: cards de foto e cenas cinéticas
  (com foto ou com clipe, via ffmpeg) desfocam a faixa da manchete (`reel/desfoque.mjs`, `REEL_DESFOQUE=0` desliga).
  Abertura, papel, final e fundo fantasma ficam como estavam.
- Story: foto do card ganhou aproximação lenta (1,00 a 1,12 no card) puxando pro rosto (blazeface), sem rosto vai pro
  centro (`story/fundo.mjs`, `STORY_ZOOM=0` deixa parada). O desfoque acompanha o zoom.
- Conferido: `npm test` (359 ok), story e reel renderizados em dry-run, cena de clipe testada à parte.
- Conferir no ar: reel de domingo 11/10 e story de domingo.

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

## 2026-10-03: vistoria de saúde executada (15 commits)

- CI: ffmpeg com teto de tempo e reserva estática (o story de 02/10 morreu no apt), Node 22, actions por SHA,
  dependabot, crons fora do :00, CI do backend verde de novo.
- Estado: JSON corrompido derruba a run em vez de virar "vazio" (`scripts/lib/estado.mjs`); commit único que aborta
  rebase (`scripts/lib/git.mjs`); Telegram e fuso BRT únicos; `scripts/config.mjs` (scripts rodam de qualquer pasta).
- Backend (cópia deste repo): e-mail privado no perfil, JWT_SECRET obrigatório, PyJWT, deps sem CVE, Dockerfile sem
  root. Produção é o terra-gentil-app: falta portar.
- Site: CSS e dados fora do `index.html` (21 mil -> 10 mil linhas), conferido no Chrome (DOM e tela iguais) e no ar.
- Fatiados por responsabilidade (mesma API, conferido pixel a pixel, legenda a legenda e no mock): run-publish,
  slide-image, instagram, story-video, coletores, merge-curated, fila, auto-merge, mock-ig, story/reel.
- Bugs achados e corrigidos: poll de vídeo com status ERROR esperava 3 a 5 min; coletor fora do modo routine cortava o
  index pra 30 e apagava imagens; pearljam.com com HTML novo derrubava a coleta; story mostrava `SETLISTS-PJ-EV.PAGES.DEV`;
  ferramentas de cápsula quebradas pelo sharp 0.35.
- Removidos: 17 scripts sem uso, pastas `_design-*`, backup de maio, `media-manifest.json`. Docs antigos em `docs/arquivo/`.

## 2026-10-02: Instagram oficial vira fonte de notícia

- Posts da @pearljam e da @eddievedder entram na coleta pela API oficial da Meta (Business Discovery), sem navegador.
  Precisou: permissões instagram_basic, instagram_manage_insights e business_management no app "Setlists PJ EV Bot"
  (token gerado no Graph API Explorer e estendido pra não expirar), secret `IG_LEITURA_TOKEN`.
- Teste no GitHub: 10 posts da @pearljam dos últimos 7 dias chegaram. Curadoria: matéria original em PT-BR, fonte
  oficial, post vazio (emoji, agradecimento, propaganda) = SKIP, foto deles nunca (imagem do nosso acervo).
- Próximo: conferir a primeira curadoria com esses itens (pode vir bastante coisa do Ohana repetida; a seção de 72 h
  da curadoria deve juntar ou pular).
- Pendências da sessão (handoff): story de 02/10 e reel de 04/10 no padrão novo (conferir no ar); backup de 30/09
  (`_backup-setlists-pj-ev-2026-09-30.git`, único com o histórico ORIGINAL) ficou mantido, decidir depois; rotina do
  X às 11h (`/x-hoje`) rodando no Mac; pedido da abertura SMUFDPJ nas legendas está com a outra IA (baixa-clipehz).

## 2026-10-01 (manhã): acervo fechado em 752 trechos e 70 capas

- Entraram Even Flow (3ª passada), Thumbing My Way, 1/2 Full, e três shows inteiros em 1080p: Moline 2014, Roma 2018 e
  Ten Show (Philadelphia, 2016). Shows inteiros são a melhor fonte de capa (close parado, luz de palco). Closes de fãs
  ficam de fora (privacidade). Retrograde fora (atores, sem a banda).
- Rodízio sem repetir (lista embaralhada fixa, bloco novo por dia/semana): story 70 dias sem repetir capa, reel 70 semanas.
- Correções: download do YouTube agora prefere H.264 (VP9 não era lido pelo detector de rosto); importador usa caminho
  absoluto. Grade de candidatos: `node scripts/publish/reel/grade-auto.mjs .momentos/<nome>`.
- Acervo FECHADO por decisão do Andre. Reforço futuro: fase dos anos 2000 (Binaural, Riot Act, Avocado), mais Mike e Matt.
- Pedido pra outra IA (baixa-clipehz, legenda gravada nos shows): opção desmarcada "Abertura SMUFDPJ" com "Só Mais um Fã
  de PEARL JAM apresenta: <show>", marca nos intervalos sem legenda e "Só Mais um Fã IDIOTA de PEARL JAM agradece".

## 2026-10-01 (madrugada): acervo de clipes, transições no reel e no story, trilhas, R2 e limpeza do git

- Acervo de trechos de clipe (`media/reels-clips/transicoes/transicoes.json`): 576 trechos de 41 vídeos, 12 capas, todos
  com tags de b-roll (quem, plano, ação, clima, local, era). Os MP4 ficam no R2 (`acervo/`, sem regra de apagar); no git
  só a lista. Comandos: `scripts/publish/reel/planos.mjs` (plano a plano, o Claude escolhe), `acervo-auto.mjs` (rosto +
  movimento, aceita link do YouTube), `rosto/` (Apple Vision, recorte vertical segue o rosto), `acervo-r2.mjs`.
- Reel (`REEL_TRANSICOES=1`, ligado): abertura = clipe da capa (feita à mão ou automática), primeiro quadro = capa no
  auge, sem flash azul; 0,7 s de clipe em cada troca de cena. 1º reel assim: domingo 04/10.
- Story (`STORY_TRANSICOES=1`, ligado): mesma abertura do reel com tarja "AS NOTÍCIAS DO DIA" e transições entre os cards
  (`scripts/publish/story/padrao-reel.mjs`). 1º story assim: 02/10.
- Trilhas: 16 no rodízio (2 do Suno no clima do Ten, 9 do Pixabay sem Content ID). Sem crédito nenhum na legenda
  (decisão do Andre; tirado também o "voz: ElevenLabs" do reel). Ver `scripts/publish/assets/story-tracks/CREDITOS.md`.
- R2: regras de apagar em 3 dias agora só em `reels/` e `stories/`. Wrangler logado no Mac.
- Histórico do git limpo (vídeos antigos fora): 1,3 GB -> 774 MB no GitHub. Backup: `/Users/andrehz/Documents/Githubhz/_backup-setlists-pj-ev-2026-10-01.git`.
- Próximo: conferir o story de 02/10 e o reel de 04/10 no ar; seguir alimentando o acervo (clipes HD, outras eras);
  apagar o backup de 30/09 se o Andre confirmar; a pasta de downloads do baixa-clipehz (35 GB) é da outra IA.
