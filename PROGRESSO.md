# PROGRESSO, setlists-pj-ev

Regra: este arquivo guarda o **estado agora** e as últimas ~2 semanas (teto de 300 linhas, testado em
`scripts/docs/docs.test.mjs`). Sessões mais antigas vão pra `docs/progresso/AAAA-MM.md`. Ao fechar sessão:
atualizar "Estado agora", escrever a sessão no topo e mover o que passar do teto pro arquivo do mês.

## Estado agora

- **TriggerAll com retentativa automática (21/11, commit 8989a6a no repo triggerall):** workflow disparado que FALHA no
  GitHub (failure/timed_out) é disparado de novo em 10 min, até 2x em 3 h, pra todo gatilho. Desliga num gatilho com
  `retry_on_failure: false` no config. Motivo: a cápsula de 20/11 falhou às 20h por erro passageiro do IG ("Please reduce
  the amount of data") e só saiu 0h54 pelo cron de reserva do GitHub. Código em `backend/src/services/retry.js`.
  Conferir na próxima falha se a execução `auto_retry` aparece no painel (depende do webhook workflow_run do repo).
- **Cobertura ao vivo do show do Eddie no Ibirapuera (20/11, tudo PUBLICADO, Andre pelo celular via remote control):**
  carrossel do pôster do Ian Williams detalhe por detalhe (`reels-especiais/poster-ian-williams/`, IG 18062550296799507
  + FB), story narrado "fica ligado" (`story-ao-vivo/gera.mjs`, voz Liam v4, IG 18110986712209764), story "Portões
  abertos" (`show-ibirapuera/story-chegada.mjs`, IG 18121710692060051) e reel do dia (`show-ibirapuera/reel-dia.mjs`:
  vídeos do Andre por horário com hora + artista da grade, IG 18090201788304973 + FB). Vídeos chegam pelo Drive
  (rclone `gdrive:`, pasta id 1qMIqGgbBD5ekB3ai8kMOYtxnt0gSPast); brutos e fotos fora do git. Story em vídeo = link
  do R2 `especiais/*.mp4` no input `imagem` do `story-avulso.yml`. Pôster baixado do IG pelo Chrome (download bloqueia
  na 2ª vez: copiar pro clipboard e salvar com osascript). **Próximo:** 6 fotos do show em `show-ibirapuera/fotos/` rendem
  carrossel; domingo 22/11 tem o 2º show (reusar `reel-dia.mjs` trocando a GRADE). Se o reel for silenciado, refazer sem
  som ao vivo.
- **Balanço da sexta + palpite pro domingo (21/11 00h54, PUBLICADO IG 18479406277119121 + FB):** `reels-especiais/eddie-balanco/`
  (`analisa.mjs` cruza a setlist de 20/11 com os 315 shows solo do setlist.fm em `eddie-carreira/bruto/`; 2a noite repete
  em média 42% da 1a). Setlist de sexta ainda "incompleta" no setlist.fm. **Domingo à noite:** conferir o palpite (Hard Sun,
  Porch, Far Behind ficam; Immortality, Last Kiss saem; Rise, Guaranteed entram) num post de "quem acertou".
- **Carrossel do merch oficial do Eddie em SP (19/11, PUBLICADO IG 18004509396043687 + FB):** `reels-especiais/merch-ibirapuera/`
  no modelo do carrossel, paleta azul. Capa com a foto do folheto da @mrtsurt (creditada), `recorta.py` endireita a foto
  (giro + perspectiva) e recorta cada produto em cartões. Mesmo fluxo de carrossel especial (R2 `especiais/` + `publicar.json`).
- **Série de reels "Som x Letra" (19/11, módulo `analise-musica/`, README lá):** som (MERT + 9 modelos treinados por
  segundo na DEAM) x letra (leitores de IA) em SD contra o disco, no tempo da música. **Black PUBLICADO** (reel
  Df7pVTaNFtL). **4 prontas no celular pro Andre agendar nas quintas** (Movies/somxletra-1..4 + legendas em Download/,
  nome do arquivo traz o minuto da música no IG): Better Man 2:54, Daughter 2:31, Jeremy 2:43, Oceans 0:01.
  Reel agora é AUTOMÁTICO: `node analise-musica/fazer_reel.mjs analise-musica/roteiros/<slug>.json` (voz, dados,
  clipes, render, mixagem PADRÃO do Black + golpes nas frases do gancho; saída no SSD `saida/reels/<slug>/`). Só o
  roteiro é manual. PRÓXIMO: mais 5 com o Andre (Given to Fly e seguintes do `saida/ranking.csv`). Ideia em espera:
  Olivia Vedder contra a régua do Eddie solo (memória). Chave ElevenLabs reserva7 com cota ZERO (Andre tirar o limite).
- **Gerador de setlist do Ibirapuera (16/11, NO AR sem link, noindex):** `setlist-ibirapuera/` copia o gerador oficial
  (REA completo em `docs/setlist-ibirapuera/REA-GERADOR-OFICIAL.md`) só pros shows de 20 e 22/11. 401 músicas (solo do
  setlist.fm + 173 oficiais) por disco/solo/covers; PNG oficial carregado do CDN deles (CORS liberado) e a NOSSA fonte v3
  nas 228 sem PNG; traço de bis; baixar folha/story; "Ouvir no YouTube" sem login (`watch_videos`, só as 173 com ID).
  Regenerar: `node scripts/setlist-ibirapuera/build.mjs` + `reels-especiais/letra-eddie/venv/bin/python
  reels-especiais/letra-eddie/ferramentas/gerar-ibira.py`. Teste local: `#sortear` na URL abre sorteada.
  16/11 tarde: `sorteio.js` LIGADO no app.js (abre/fecha/bis do modelo da era Earthling, 46 shows 2022+, gerado em
  `musicas.json.modelo` por `scripts/setlist-ibirapuera/modelo.mjs`; testado no Chrome com `#sortear`). Correções do
  Fable PUBLICADAS: folha pintada aos poucos (prazo de 9 s por imagem, vira letra simples e se ajeita), `salvar.js`
  (no navegador do Instagram mostra a imagem pra segurar e salvar), botão fixo "Ver minha setlist" no celular, PNGs
  recomprimidos (3,36 para 1,75 MB), cache de 1 dia em `_headers`. Claude Design: projeto "Gerador de setlist do Eddie"
  (claude.ai/design/p/863d6417-ec95-41c6-905e-893e6c0738b0). O pacote `design-handoff/setlist-ibirapuera/` agora tem
  prints do oficial (`referencia/oficial-*.png`, celular e desktop, todas as telas) e o VÍDEO DE FUNDO pedido pelo Andre
  (`referencia/fundo-eddie.mp4`: 8 trechos mudos do Eddie, 25 s em loop, P&B escuro, 1,1 MB; cópia já em
  `setlist-ibirapuera/fundo-eddie.mp4`); BRIEF atualizado. FRONT NOVO DO DESIGN NO AR (16/11): 3 telas (chegada "Qual é a sua
  setlist?" com painel de nome e noite, montar com gaveta, resultado com folha de fita crepe, cartões de sorte, ouvir e
  baixar) e o vídeo do Eddie atrás de tudo. `index.html` e `telas.js` vêm do Design (retorno em
  `design-handoff/retorno/setlist-ibirapuera-v1/`); o nosso app.js/folha.js/salvar.js/sorteio.js ficou como estava. No
  HTML novo entraram `#estado-folha`, `#atalho` (escondido) e a tela de salvar do Instagram, que o app.js usa. Testado no
  Chrome 390 px: chegada, sorteio, `#sortear` e montar sem erro de console.
  Traço de bis CORRIGIDO (16/11): ia em y+84 e riscava a música; agora vai em y+107 e empurra o resto da coluna 20 px
  (teto 40). Papel de 338 KB vem do glitch.ge.
  Story NOVO (16/11, `story.js`): título do resultado no topo ("A SETLIST ANDRÉ", nome em dourado), folha com
  fita no meio e as cartas de sorte embaixo (índice, rara, garantida, 2026, show típico, chance), lidas do DOM da tela.
  Resultado com UM botão só, "Baixar pro story" (pulsa e tem brilho passando; no celular abre o compartilhar, no
  computador baixa). Saíram "Baixar a folha" e "Compartilhar".
  Revisão de texto do Fable (16/11): título "A setlist de <nome>" (neutro), veredito no índice (Só raridade, Lado B
  puro, Show de verdade, Pé quente, Aposta segura), chamada "marca @smufdpj" e aviso pós-story. Ideias pendentes dele:
  sortear de novo perto do botão, veredito gigante, recorde pessoal, link que reabre a mesma setlist.
  Duas noites (16/11): o sorteio cria UMA SETLIST POR NOITE (`estado.listas` no app.js); a folha da outra noite é
  desenhada por trás, então trocar o seletor é instantâneo e as cartas de sorte acompanham. Montando à mão, a noite
  vazia copia a lista da outra na primeira troca.
  Bug corrigido (16/11): "Ver a minha folha" não fazia nada (data-gerar sem valor = dataset ''), teste em
  `scripts/regressao/setlist-ibirapuera-ver-folha.test.mjs`.
  Chegada (16/11): "Qual será a sua setlist?" (é previsão) e cartão animado: cai na mesa, fitas colam, título palavra
  por palavra ("setlist?" dourado), linha se risca, seta empurra, balança e reluz; "Montar a minha" acende a borda.
  Masculino e personalizado (16/11): "Qual será o seu setlist no Ibirapuera?" (com "ANDRÉ," em cima se já digitou o
  nome), resultado e story "ANDRÉ, O SEU / SETLIST NO IBIRAPUERA" (story em 2 linhas, quebra no <br> do #r-nome).
  `_headers`: página do gerador com max-age=0 (vale). Pros .js o Cloudflare manteve 4 h, então agora cada arquivo tem
  carimbo de versão: RODAR `node scripts/setlist-ibirapuera/versao.mjs` depois de mexer em qualquer .js ou no
  musicas.json (o `versao.test.mjs` falha se esquecer; importmap cuida dos imports entre módulos).
  Lista legível (16/11, `lista.js`): "As músicas" em texto ao lado da folha, SÓ no site (no story o Andre preferiu
  sem). Tela de salvar no Instagram: 3 passos (segure e salve, abra o story, escolha da galeria) + botão "Abrir o
  Instagram" (`instagram://story-camera`, falta testar no celular).
  Filtro do nome (`filtro.js`, 16/11): barra palavrão/crime/ódio/bizarrice (inclusive leet e espaçado), só letras,
  até 18; teste em `scripts/setlist-ibirapuera/filtro.test.mjs` (inclui nomes reais que NÃO podem cair: Fagner,
  Nigel, Ísis, Dickson). Rodapé do resultado com Acervo, Pra ler e Onde achar do site.
  QA do Fable (16/11) corrigido: grupo não fecha ao adicionar, busca vazia avisa, bis no máximo 2 e nunca na última,
  "Começar do zero" zera as duas noites, Instagram vai direto pros 3 passos, sortear de novo não empilha histórico,
  cartas (singular, chance por vezes/315, aposta certa some se igual à raridade, milhão/bilhão), folha cabe no
  notebook, nome longo quebra, localStorage e roundRect protegidos. PENDENTE: testar `instagram://story-camera` no
  Android e iPhone (no Android pode dar página de erro), voltar do navegador fechar painéis, acessibilidade dos
  painéis (inert, foco, Esc).
  Modelo do sorteio (16/11): só show completo (12+ músicas, 23 shows de 2022 pra cá) conta; participação de 1 música
  (Song of Good Hope em NY/Dublin, Ball Game no Wrigley) virava abertura e encerramento. Primeira do bis nunca é de fim.
  HOMENAGEM a Glen Hansard (`HOMENAGEM` no topo do `sorteio.js`): Song of Good Hope abre o bis em 70% dos sorteios.
  TIRAR depois dos shows de 20 e 22/11.
  EM ANDAMENTO (16/11 noite): sessão do Claude Code web revisando o story e testando STORY EM VÍDEO (fundo do Eddie
  animado, canvas + MediaRecorder, módulo `story-video.js`) no branch `claude/story-ibirapuera`, com PR pra main SEM
  merge. Conferir o PR, testar no celular (iPhone e Android, dentro e fora do Instagram) e só então fazer o merge.
  Depois: IDs do YouTube das 228 solo, link no site/post, fase 2 de playlist com login.
- **Letra do Eddie v3 (16/11):** agente Fable extraiu tinta de 29 setlists REAIS (`letra-eddie/fotos-reais`, baixadas pelo
  Serper do marcaregistrada): 241 palavras reais, t minúsculo, Q, chaves/traços/setas. `fable/escrever3.py` +
  `alfabeto-v3`. Falta garimpar 9 galerias e 12 fotos, Z, "w/", e igualar palavras v2 com as reais.
- **Carrossel do ranking do Eddie solo: AGENDADO ter 17/11 17:30 BRT (TriggerAll #018, cron `30 20 17 11 *`).**
  10 slides do Claude Design (projeto "Ranking Eddie Vedder Solo") no R2 `especiais/eddie-ranking-solo/01..10.jpg`,
  `reels-especiais/eddie-ranking-solo/publicar.json` (imagens + legenda). Mesmo workflow do reel especial: quando o
  publicar.json tem `imagens`, `scripts/publish/reel/especial.mjs` chama `scripts/publish/carrossel/especial.mjs`
  (confere os links, carrossel no IG, álbum no FB, idempotente). Teste seco no GitHub OK (run 43860887669). O painel
  do TriggerAll mostra "17:30 (8h)" porque ignora o dia (só visual; o node-cron do backend respeita o dia 17).
  CONFERIR ter 17:30 no Telegram/IG. Modelo do Design virou módulo reaproveitável: `scripts/publish/carrossel/`
  (paletas amarelo/laranja/vermelho/verde/azul/rosa + render em JPG, README). Arquivos locais (fora do git):
  `reels-especiais/eddie-carreira/postar/` e `design/`. Login do Claude CLI expira entre 20 e 23/11.
- **Letra do Eddie (16/11, EM ANDAMENTO):** o gerador oficial (glitch.ge) não usa fonte: 1 PNG à mão por música
  (173), por cidade (22) e 5 papéis; o traço de bis e o floreio do título vêm PINTADOS no papel. Tudo baixado em
  `reels-especiais/letra-eddie/` (FORA do git, repo público). Criamos a NOSSA "fonte": letras recortadas dos PNGs
  (`alfabeto-v2/`) + renderizador `ferramentas/escrever.py` (tinta uniforme, altura/base dos originais, limpeza de
  pedaços, abreviação "B. MAN") + `ferramentas/folha.py` (layout do gerador; usa PNG real quando existe). Agente Fable
  revisou e melhorou em `fable/` (`escrever2.py` usa PALAVRAS reais inteiras de `palavras-v2/`, encosto pelo contorno,
  `traco_bis()`, `afinar()` caneta fina; `folha2.py` acha apelidos tipo s-town). Prova: `fable/folha-depois.jpg`.
  Python: venv com numpy/scipy/pillow (recriar: `python3 -m venv venv && venv/bin/pip install numpy scipy pillow`).
  PRÓXIMO (lista do Fable, por impacto): recortar ligaduras/minúsculas (tH, ING, IGHT, tion, LL, OU) e mais variantes
  de R B K W (ks em `ferramentas/seg/segmentos.json`: R #24 #99 #119, B #73 #137 #140, K #56 #141 #155, W #47 #55 #88);
  tabela de abreviações; parênteses (#142) e barra (#138); riscado/seta/til desenhados; coluna "dançando" 10-30 px;
  ruído na borda. Q e Z não existem. Depois: usar no carrossel/posts dos shows de SP (Ibirapuera 20 e 22/11).
- **Reel especial Eddie no Ibirapuera v7: AGENDADO seg 16/11 17:30 BRT (16/11 madrugada).** TriggerAll #017
  dispara `publish-reel-especial.yml` com `{"pasta":"eddie-ibirapuera"}` (testado de ponta a ponta com pasta falsa,
  sem publicar). Vídeo no R2 `especiais/eddie-ibirapuera-v7.mp4?v=2` (o `?v=2` fura o cache de 4 h do Cloudflare),
  legenda e capa em `reels-especiais/eddie-ibirapuera/publicar.json` (script `scripts/publish/reel/especial.mjs`,
  idempotente, com testes). Montagem: `hf/cenas.mjs` + `hf/montar.mjs` (array CLIPES; rosto centralizado pelo foco do
  acervo), polaroide do Eddie (Commons, Raph_PH CC BY 2.0) na capa, fala 1 regravada (versão C), trilha hz-pj-01a,
  efeitos liberados no ACR (pancadas golpe-1/5/7/9 + coração do Terra Gentil, `efeitos.mjs`, lê do SSD). 11 trechos
  novos no acervo (Bridge School 2011, Water on the Road). Receita de agendar ficou em
  `/Users/andrehz/Documents/Githubhz/fabrica-quiz/docs/AGENDAR-PUBLICACAO.md`.
  CONFERIR seg 17:30 no Telegram/IG. Volume do reel em -19,7 LUFS (pode subir pra -14 nos próximos). PRÓXIMO da série:
  ter ranking completo (o CTA promete "amanhã"), qua Japão, qui Brasil, sex setlist provável.
- **Reel especial Eddie no Ibirapuera (15/11, histórico da montagem):** série de reels até o show (sex 20 e dom 22/11, Best of
  Blues and Rock). Pasta `reels-especiais/eddie-ibirapuera/`: `ficha.json` (estudo NOSSO no setlist.fm: 17 shows solo,
  seção `estudo_formato`; Ibirapuera é solo segundo a imprensa), `roteiro.json`/`.md` (roteirista Fable, v6 "As 5
  músicas certas" + "Mas e a Black? não tocou nos últimos 8 shows solo"; v1 a v5 arquivadas em subpastas), `clips/`
  (16 trechos mudos do R2), `gerar-voz.mjs` (ElevenLabs v4, chave reserva5, corta silêncio e acelera até 195 ppm,
  máx 1,2x, confere no mlx_whisper), `mixar.mjs` (trilha própria + sidechain; ajustar os golpes pros ids da v7), `hf/`
  (projeto HyperFrames começado, reaproveitar). REGRA DO ANDRE: não gravar voz sem ele dar ok no texto.
  FEITO 15/11 noite: roteiro v7 APROVADO (13 falas: "As cinco músicas que o Eddie Vedder sempre toca", contagem 5 a 1
  intercalada com pedidos negados Sirens/Invincible/Better Days/Black, critério "desde 2023", CTA "manda para quem vai
  com você"); vozes GRAVADAS em `voz/c1..c13.wav` (54 s, prévia `voz/previa-narracao.mp3`; whisper não confirma nomes
  em inglês, Andre ouve; c13 conferir se "para o show" saiu "pro show"). Fotos Commons do Eddie em `fotos/` (CC BY,
  créditos em `fotos/_creditos.json`, citar na legenda). 2 vídeos do YouTube pedidos pelo Andre (p3yPYHq2N1Y e
  pXwLF3QAi5o) rodando no `acervo-auto.mjs` (folhas em `.momentos/<nome>/`, escolher e `--importar`).
  PRÓXIMO: agente HyperFrames monta o v7 (MEGA dopamínico: fotos + clipes mudos + 9 bolinhas desde 2023 + contadores
  + carimbos ESQUECE/NÃO VAI/TALVEZ/DIFÍCIL, mapa Tempe -> Ibirapuera) -> golpes do `mixar.mjs` (c3 e c12) -> Andre
  aprova -> publicar. Série: seg ranking, ter Japão, qua Brasil, qui
  setlist provável. Chave da API do setlist.fm só no GitHub; Andre pode salvar em `/Users/andrehz/.setlistfm-key`.

- **Story por banda (14/11 noite):** rodízio com 25 layouts (A a Z), D/E/F do Claude Design portados e LIGADOS.
  23 aberturas por banda e 38 finais nas 2 vozes, roleta de chaves no reel e no story diário. Lapidar G a Z
  pela régua do Design foi DESCARTADO (14/11): piloto no O tirou a personalidade, Andre preferiu o antes. PRÓXIMO: conferir
  saldo da chave nova (reserva2/.elevenlabs-key-reserva6) depois de 15/12; fala da data curta só pra agenda (não cabe hoje, 1,2x) ainda sem resposta.
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

## 2026-11-19: série "Som x Letra" (engenharia reversa do post do datascrolls) + reel de Black publicado

- Feito: módulo `analise-musica/` (Python no SSD). MERT-95M + cabeças treinadas nas notas por segundo da DEAM bateram
  com o datascrolls em Black (erro médio 0,07 SD; MERT-330M piorou). Letra: LRCLIB + leitores de IA (5 no Ten, 1 nos
  outros discos). Ranking de 147 músicas. Reel feito no Claude Design (projeto "Reel animado som x letra", v3), render
  quadro a quadro pelo Chrome (`render_reel.mjs`), clipes 9:16 com rosto centralizado, narração Liam 1,2x (gancho +
  CTA; "Deixa nos comentários!" fixo e reaproveitável), poucos efeitos (coração do recorte do Andre, liberado por ele).
  Gemini e vidIQ deram 4/10 na v1 (texto técnico); v3 = gancho narrado + dados pequenos, sem método.
- Aprendido: música da biblioteca no Business Suite só vale pro Facebook; no IG só pelo app. No app o áudio original
  pode vir MUDO ao pôr música (ícone de alto-falante na faixa do vídeo).
- Próximo: Better Man (Vitalogy, trecho 3:22 do ranking): JSON pelo `aplicar_dados.py`, frases dos momentos, gancho e
  pergunta do CTA narrados, clipes da música, render, celular via `adb push`.
- Blockers: chave reserva7 do ElevenLabs com limite 0.

## 2026-11-18 (tarde): ferramenta de comentários do IG (guardada) + carrossel de ingressos cancelado

- **ig-comentarios.yml (manual, workflow_dispatch):** `listar` lê os comentários dos últimos posts e lista os de
  venda/procura de ingresso (só lê); `responder --ids --texto` responde SÓ os ids aprovados pelo Andre (4 s entre cada).
  Código em `scripts/publish/comentarios-ig/` (filtro testado com comentários reais). NUNCA rodado: a permissão de
  comentários do token ainda não foi testada (rodar `listar` primeiro).
- **Carrossel "Sobrou ingresso?" CANCELADO pelo Andre** (a página não vai mediar ingresso). Fonte local em
  `reels-especiais/ingressos-ibirapuera/` fora do git. Pesquisa: Senacon suspendeu BuyTicket, StubHub, TicketSwap,
  Viagogo e FunBuy em 28/10; Mercado Livre proíbe anúncio de ingresso. Não indicar nenhuma.
- **gh do Mac agora tem escopo `workflow`** (dá pra criar/editar YAML de workflow daqui).
- **Ideias de posts de curiosidade** (lista de 10 na conversa de 18/11): fortes = "Fãs x Eddie" (dados do gerador),
  "A sexta em números" e o setlist real na letra do Eddie (sáb 21).

## 2026-11-18 (manhã): carrossel "Eddie vai tocar com Roger no sábado?" PUBLICADO

- **Publicado 08:42 BRT** no IG (post 18102585260442352) e FB (álbum espelhado), Telegram avisou. 10 slides no modelo do
  ranking, paleta amarela: capa com a arte de divulgação do festival (uso liberado pelo Andre), 11 vezes juntos
  (1999 a 2025), The Who em números (378 vezes solo + PJ), Baba O'Riley, Quadrophenia, Simon Townshend, o que pesa
  contra, 79% (11 de 14 encontros, com a ressalva), CTA do gerador de setlist, final "rola ou não rola?".
  Fonte: `reels-especiais/eddie-daltrey/gera.mjs` (gera o HTML), `publicar.json`; R2 `especiais/eddie-daltrey/`.
  Fotos e a arte ficam fora do git (`design/`). Foto livre dos dois juntos (Rosemont 2015, swimfinfan CC BY-SA) guardada
  em `design/uploads/juntos-palco.jpg`, sem uso.
- **Glen Hansard morreu em 29/07/2026** (acidente de moto em Dublin). Não citar ele como atração do festival.
- **Lembrete:** o carrossel tem limite de 10 imagens no IG; CTA do setlist é o penúltimo slide de todo post da série.
- **Hoje 17h:** sai o story "Guia da sexta" (TriggerAll #020). Depois de sair, DESLIGAR o #020.

## 2026-11-17 (noite): guia da sexta agendado + parceria com o Fabio Corazza

- **Story "Guia da sexta" AGENDADO qua 18/11 17:00 BRT (TriggerAll #020, cron `0 20 18 11 *` UTC):** 6 telas no visual
  do ranking (capa, programação, o que esperar com números do setlist.fm, pode/não pode, MONTA O SEU SETLIST com o
  gerador, como chegar + CTA "manda pro amigo"). Artes em `media/news/stories-avulsos/2026-11-18-guia-sexta-0[1-6].jpg`,
  fonte em `reels-especiais/story-sexta-ibirapuera/` (`story.html` + `render.mjs`, fotos fora do git). Horários do
  festival vêm de matérias (Billboard, Trambicast 16/11), não do site oficial: "sujeitos a mudança" na tela.
- **story-avulso.yml aceita várias telas** separadas por vírgula no input `imagem` (valida todas antes de postar a 1ª;
  marcação só na 1ª). Testado no mock: 6 stories em sequência.
- **Parceria com @fabiopcorazza (ilustrador, pôster do Eddie):** DM rascunhada (concurso cultural, não sorteio: segue
  as duas contas, comenta no reel marcando 2 amigos + frase da música que não pode faltar, Fabio escolhe). Andre manda.
  Se ele topar: regulamento curto + reel com a arte dele (com autorização).
- **Próximo:** conferir qua 17h no IG/Telegram e depois DESLIGAR o #020 (cron sem ano repete em 2027). Guia do domingo
  (22/11) no mesmo molde: trocar a escalação (16h Vitor Kley, resto igual) e reaproveitar `story.html`.

## 2026-11-16 (tarde): carrossel tutorial do gerador PUBLICADO

- 8 slides no visual do ranking (capa com foto Commons do Eddie, Raph_PH CC BY 2.0, e "EDDIE VEDDER" enorme; 6
  passos com prints reais do gerador, nome de exemplo PAMELA). Postado 16/11 14:04 BRT: IG 17940159369402627, FB
  1119493787910103_122128070667322237 (run 43914146844). Telegram deu "fetch failed" (só o aviso).
- Pasta `reels-especiais/tutorial-carrossel/`: `carrossel.html` (render com `scripts/publish/carrossel/render.mjs`,
  precisa de `<helmet></helmet>` no head), `prints.mjs` (prints 390x844 DPR 3 do site LOCAL na 8123, pra não sujar
  o painel), `legenda.txt`, `publicar.json`. Imagens no R2 `especiais/tutorial-carrossel/01..08.jpg`.

## 2026-11-16 (noite): reel tutorial publicado no story, agendado no feed, painel e botão Compartilhar

- **Reel tutorial v4** (narração Charlie e Laura pelo gravador da fabrica, trilha -24 LUFS abaixando sob a voz, QA do
  Fable): story postado hoje (postId 18077899205774688, marcou eddievedder, pearljam, bestofbluesandrock). REEL agendado
  17/11 12:00 BRT: TriggerAll #019 -> publish-reel-especial.yml pasta tutorial-gerador (dry-run ok). Vídeo no R2
  `especiais/tutorial-gerador-v4.mp4`. Ponto a ouvir: whisper ouviu "Ó, é de toca" na fala 1 ("O Eddie toca").
- **story-avulso** aceita vídeo do R2 (`especiais/*.mp4`) no input `imagem` (commit e45cccca2).
- **Painel de uso do gerador** (Fable, commit 46c861210): eventos sem dado pessoal -> `POST /api/contador` (D1
  `setlist-contador`) -> `/painel-setlist` (desde 16/11 com usuário e senha, segredos PAINEL_USUARIO e PAINEL_SENHA; guarda também os nomes digitados).
  BLOCKER: Andre ligar o binding D1 no Cloudflare (Pages setlists-pj-ev > Settings > Bindings > D1, nome `CONTADOR_DB`,
  banco `setlist-contador`) e dar Retry deployment. Até lá o contador não grava.
- **Botão Compartilhar** (ícone do WhatsApp) ao lado de "Só a imagem": compartilhar do celular com a imagem e o texto da
  noite; dentro do Instagram abre wa.me só com texto. Falta testar em celular real.
- **Depois (16/11 noite):** D1 LIGADO (binding CONTADOR_DB, em produção). Painel com seção "Nomes" (últimos 100, selo
  vermelho no barrado pelo filtro, sem IP) e login por HTTP Basic (usuário andre, senha só nos segredos do Pages
  PAINEL_USUARIO/PAINEL_SENHA; ?k= removido, chave antiga apagada). Story: folha de volta a 55% da largura
  (`story-layout.js`, mesma geometria imagem e vídeo), respiro igual de 30 px entre os blocos. 567 testes verdes,
  fumaça no ar sem erro de console.
- **Próximo (antigo):** ligar o D1, conferir o painel contando, ver o reel sair 17/11 12h, testar no S23 (Compartilhar e o
  intent:// do Chrome). Tirar HOMENAGEM do sorteio.js depois de 22/11.

## 2026-11-16 (fim da tarde): reel tutorial do gerador (rascunho aprovado) + vídeo no navegador do Instagram

- **Reel tutorial (v2 APROVADO pelo Andre, não publicado):** HyperFrames em
  `/Users/andrehz/Documents/Githubhz/setlists-pj-ev/reels-especiais/tutorial-gerador` (LEIA.md lá). 46 s: abertura de 3 s
  com 8 cortes mudos do acervo R2 + chamada forte, perfil @smufdpj desenhado, site GRAVADO de verdade (Chrome headless
  390x844, toques reais, nome SMUFDPJ), brincadeira com a raridade (L.A. Woman), story desenhado com o MP4 real, dedinho
  em cada toque, efeitos da biblioteca de áudio (os mesmos da fabrica-quiz). Render v2 em `renders/` (mídia fora do git).
- **Fable (commit 1edebb4b7):** no navegador interno do Instagram o vídeo virou o caminho principal: link `?s=` reabre
  a MESMA setlist no Chrome (Android, `intent://`) ou Safari (iPhone, `x-safari-https://`). FALTA testar no S23 e iPhone.
- **"Sua sorte" vira "A sorte de <nome>"** (commit f31379cb5).
- **Próximo:** Andre testa no S23 o botão do vídeo dentro do Instagram; se ok, regravar o site (`ferramentas/grava.mjs`)
  pra o reel mostrar o passo "abre no Chrome" e o nome nas estatísticas, renderizar v3 e decidir quando publicar.

## 2026-11-16 (tarde): story do Ibirapuera em vídeo + segurança (PR #648 no ar)

- Chegada: cartão com 4 setas douradas animadas nas diagonais e seta num selo dourado ("Toque aqui e sorteie o seu").
- Story: 2 botões, imagem (sempre) e vídeo MP4 de 19 s (só onde o navegador grava MP4; dentro do Instagram ensina a abrir
  no navegador). Vídeo: folha escrita na hora, lista digitada, cartas contando, CTA "Segue a gente @smufdpj" com logo.
  Aviso "Palpite de fã" em letra de bula. Tela de resultado escreve a folha ao vivo (`folha-viva.js`, `?sem-escrita`).
- Segurança (revisão do Fable): frame-ancestors/X-Frame-Options, Permissions-Policy, escape de nomes, filtro de nome só
  latino, 173 PNGs oficiais copiados pra `img/oficial/` e CSP do gerador com img só do site.
- Cópia privada do gerador em `/Users/andrehz/Documents/Githubhz/fabrica-quiz/geradores/setlist-ibirapuera`.
- Depois do merge (16/11 tarde, direto na main): vídeo é o botão principal ("Baixar vídeo para o seu stories", imagem
  vira link "Prefere foto?"), loading 0 a 100% na gravação, 4 setas douradas no botão principal (só quando libera) e no
  "Postar no story", chance por extenso até vigintilhões, folha maior na imagem (400 px), logo com `?v=2` (CDN tinha
  cacheado HTML), nome comprido ganha linha própria, "Escrevendo a folha" só pra leitor de tela, chamada "marca
  @smufdpj que a gente compartilha o seu" (Andre precisa repostar quem marcar).
- PRÓXIMO PEDIDO: reel tutorial "como gerar o seu setlist" (do começo ao Postar no story), gravado do site no celular.
- Depois: Andre testar no iPhone e no Android (postar vídeo no story, abrir dentro do Instagram). Tirar a HOMENAGEM do
  `sorteio.js` depois de 22/11. Depois: gerador pra bandas cover com shows da agenda.
