# PROGRESSO, setlists-pj-ev

Regra: este arquivo guarda o **estado agora** e as últimas ~2 semanas (teto de 300 linhas, testado em
`scripts/docs/docs.test.mjs`). Sessões mais antigas vão pra `docs/progresso/AAAA-MM.md`. Ao fechar sessão:
atualizar "Estado agora", escrever a sessão no topo e mover o que passar do teto pro arquivo do mês.

## Estado agora

- **23/11 manhã, BUG NA AGENDA (CORRIGIDO):** agenda semanal do @santorockbar (4 dias, 4 bandas) virou show da Blaymorphed na QUINTA 26 (o certo é sexta 27): o extrator pegava a 1ª data da legenda inteira. Agora post de casa com várias datas entrega à banda só o bloco dela; sem bloco claro, o post é ignorado (`scripts/agenda/casas/index.mjs`, teste `scripts/regressao/agenda-casa-varios-dias.test.mjs`). Carrossel W48 apagado pelo Andre e republicado certo (post 18143020099625641). PJ 90 mudou horários em 22/11 20h26 (23h30 e 22h30, post sem cidade: cidades em `correcoes.json`). Reel de ter 24/11 trocado pelo render automático com os dados certos (`reels-especiais/agenda-semana/publicar.json`). PENDENTE: render do reel automático falhou 1x por tempo esgotado esperando a página do Design (2ª tentativa ok); pôr nova tentativa antes de 01/12.
- **23/11, acervo das covers reforçado (FECHADO):** Andre mandou 6 vídeos do YouTube; viraram trechos novos da Singles (Sirens 15 anos, Rise acústico), Blaymorphed (clipe de Sirens, tarja de cinema tirada do bruto) e Love Boat (Sirens, Evenflow São Roque, Yellow Ledbetter). Singles saiu do vermelho (22 trechos, 8 close forte); 10 de 10 bandas OK, 156 trechos no R2 (`covers-r2.mjs conferir`). Commits 30c62f352 e ab4ddf9c1. Brutos em `media/reels-clips/covers/_brutos/<conta>/` (fora do git).
- **22/11 noite, cobertura da 2ª noite do Eddie (PUBLICADO):** (1) carrossel "A guitarra verde de Sérgio Vedder" (`reels-especiais/guitarra-sergio/`, 8 slides, IG 18034022780882037 + FB): história da Brazilcaster (2014 camiseta do Fear e pedestal, 2015 a guitarra feita pelo Sérgio, 2018 Black), fonte entrevista Aléxia Loren no YouTube (vídeo em `video/`, fora do git), foto Eddie+Sérgio crédito @sergiovedder, marca @blaymorphed e @bestofbluesandrock. (2) setlist de domingo (`reels-especiais/setlist-dom/`, 9 slides, IG 18025468820947609 + FB): setlist.fm ficou vazio, usamos a imagem do @concertpants (`setlist.json` manual, fonte no `fonte`). PADRÃO aprovado pelo Andre: capa = chamada com a folha de fundo, slide 2 = folha inteira, depois estatística (`stats.mjs`: quem foi viu, palpite conferido, duas noites, as 5 novas, essas não falham), momento, pergunta. Vigia do setlist.fm desligada.
- **Reel "Agenda da semana", PRÉVIA APROVADA (22/11 tarde, "ficou muito bom"):** `reels-especiais/agenda-semana/`.
  `gera.mjs` (prévia por código), `design/montar.mjs` (MP4 exportado do Claude Design + narração + trilha + cortes do PJ
  na abertura = `design/reel-exemplo.mp4`), `falas.mjs` (textos e pronúncia aprovada de ouvido: "Na quinta", "Ozasco",
  "São nove shows"), `audicao.mjs` (página de audição com Whisper; Whisper só filtra, o Andre decide).
  Claude Design: projeto "Reel Agenda da semana" (https://claude.ai/design/p/fc29f18d-fad2-4d99-bdf1-3654061e498e),
  4 layouts (A cartaz, B ingresso, C lambe-lambe, D tipográfico) x 3 paletas (amarelo, laranja, azul), MOTION-SPEC
  por layout. Pedido em `design-handoff/reel-agenda/`. Claude Design muda de lugar em 14/12 (mover o projeto).
  Acervo de vídeo das COVERS sendo montado por agentes (22/11 noite) em `media/reels-clips/covers/<conta>/`
  (`clips.json` por banda, MP4 9:16 mudos centrados no rosto, fora do git). Placar: `node media/reels-clips/covers/placar.mjs`
  (meta 6 trechos + 3 close forte); cortador do agente guardado em `media/reels-clips/covers/cortar.mjs`.
  22/11 14h30: 9 de 10 bandas com trechos; deficientes (falta close forte): Alive, Black Circle, Singles, Jeremy (Jeremy:
  vídeos de 2012 talvez com vocalista antigo, conferir); Love Boat ainda rodando. Andre vai procurar na mão o que faltar.
  4 layouts EXPORTADOS do Design e montados com narração: `reels-especiais/agenda-semana/design/reel-{a-azul,b-amarelo,
  c-laranja,d-azul}.mp4` (`montar.mjs --video layout-X.mp4 --saida reel-X.mp4`; export do Design: Share > Video > Original).
  22/11 noite: Andre APROVOU OS 4 LAYOUTS ("adorei todos") = rodízio dos 4 x 3 paletas. Recebeu no celular os vídeos de
  revisão dos 96 trechos das covers (um por banda, linha do meio pra conferir rosto); aguarda retorno de trecho a refazer.
  22/11 noite: ronda no Instagram das 10 covers = 133 trechos, 9 de 10 OK. Singles fica com 2 close forte (banda quase sem
  show; Andre procura na mão depois). Conferir: Blaymorphed camisa branca (talvez outra formação), Love Boat logo Venatrix
  nos 4 trechos novos (tag marca:venatrix).
  22/11 19h: covers de cada show no FUNDO DOS DIAS (`design/covers.mjs` + máscara dos cartões no `montar.mjs`):
  `design/reel-<layout>-covers.mp4` nos 4 layouts, mandados pro celular do Andre.
  22/11 19h20: PADRÃO APROVADO ("perfeito, sensacional"): antes de CADA show entra um corte da própria banda em tela
  cheia (0,75 s + whoosh), alinhado à troca de destaque do Design (entrada 0,83 s + 1,8 s por show, igual nos 4 layouts).
  4 layouts montados nesse padrão (`design/reel-<layout>-covers.mp4`, 40,8 s).
  Terça 24/11 JÁ AGENDADA (TriggerAll 11:07, layout A, `publicar.json`, vídeo no R2).
  **23/11 madrugada: reel da agenda AUTOMÁTICO NO AR (commit 1bcfb6c26).** `scripts/publish/agenda-reel/`
  (README lá): o próprio código do Claude Design (`media/agenda/reel-design/`, zip baixado do projeto, 5 ajustes de render) é
  fotografado no Chrome headless quadro a quadro (fundo transparente) por cima das covers; corte da banda antes de cada show,
  voz FIXA Jessica, fecho novo pedido pelo Andre ("Toda terça tem agenda no maior acervo de Pearl Jam do Brasil. Segue para
  não perder."), legenda igual à da W48. 133 covers no R2 (`acervo/covers/`, `covers-r2.mjs`). Workflow `publish-agenda-reel.yml`
  (modo publicar|previa|dry), log `media/agenda/reel-log.json` (W48 marcada como manual). Mock IG ok, npm test 583/583.
  Prévia no servidor OK (run 45106844020) e APROVADA pelo Andre (23/11). LIGADO: variável do repo AGENDA_REEL=1 + TriggerAll
  #021 "Reel Agenda da Semana" (cron `7 14 * * 2` UTC = ter 11:07 BRT, inputs {}); teste de disparo ok (W48 pulada pelo log).
  1ª semana automática: ter 01/12 11:07. CONFERIR nesse dia o post e o Telegram.
- **PRÓXIMO PROJETO: reel "Agenda da semana" (ideia de 22/11, aprovada em conceito pelo Andre).** Motivo: o resumão de
  domingo converte ~10x mais seguidor por conta alcançada que carrossel (reel de 22/11: ~20 seg. em 743 de alcance;
  carrosséis ~0,2%). Dados: workflow manual `ig-insights.yml` (`scripts/ig-insights/coletar.mjs`, seguidores/dia; a API
  não dá seguidores por reel). Formato: abertura 3 s com o PEARL JAM de verdade (acervo de transições atual, regra do Andre; covers só depois, no fundo das cenas dos dias) + mapa acendendo os estados + uma cena POR DIA
  (dia grande, cidade, banda @ casa) + fecho "toda terça tem, segue". Sai na TERÇA (cobre terça a domingo). COM narração (voz do resumão, ElevenLabs): abertura "Onde tem Pearl Jam ao vivo essa semana?", por dia "dia, cidade, banda" (nunca o nome da casa falado), fecho "Toda terça tem. Segue pra não perder". Próximo passo: TESTE/prévia de como ficaria; o carrossel "Agenda da semana" de segunda FICA como está. Marcar banda e casa (repost das bandas = alcance de
  não seguidor). Acervo de vídeos das COVERS pra transições (Andre: sem DM, tem muito material pronto): 1) YouTube das bandas,
  2) vídeo do IG delas que o Andre mandar pelo Drive, sempre mudo e trecho curto, tag `banda:<conta>` no transicoes.json;
  nunca raspar o IG. Banda sem vídeo: foto do perfil ou plano de plateia.
- **AGORA (22/11 12h30): setlist do domingo roda SOZINHA, fora do Claude.** Processo `nohup` (monitora.mjs && publica.sh),
  log em `reels-especiais/setlist-dom/vigia.log` (`tail` nele pra ver). Ao fechar no setlist.fm, publica sem ninguém. Momentos
  do show que o Andre mandar no chat: gravar em `reels-especiais/setlist-dom/momentos.json` ({intro, momentos:[{tag,titulo,
  texto,foto?,pos?}]}, foto em design/uploads/) ANTES de fechar; foto da setlist de papel = `design/uploads/foto-setlist.jpg`.
  Mac acordado por caffeinate (nohup) até ~5h de 23/11.
- **Setlist do domingo 22/11 no automático (pedido do Andre: ser o primeiro):** `reels-especiais/setlist-dom/`.
  `monitora.mjs` vigia o setlist.fm (id 2372101f) e sai quando fecha (bis + depois das 22h + 10 min parado);
  aí `zsh reels-especiais/setlist-dom/publica.sh` busca, desenha a folha (cab-sp2), gera o slide da lista (★ = não tocou
  na sexta), sobe pro R2, commita e publica. Andre autorizou publicar sem esperar o "solta" (eu confiro a prévia antes).
- **Carrossel do pôster da 2ª noite (22/11 11h, PUBLICADO IG 17999916540101637 + FB):** `reels-especiais/poster-munk-one/`,
  arte do @munk_one (imagem do post da @mrtsurt, pôster recortado do slide 1), molde do de sexta, paleta laranja.
- **Banda Alive (Pelotas/RS) na agenda (22/11):** `banda_alivepj` cadastrada em `media/agenda/bandas.json` (POC ok:
  um post por show com data, hora e casa; o extrator leu as 4 datas antigas certas). Sem show futuro hoje; entra sozinha
  quando postarem. Casa provável deles: Urbano Cultural (Pelotas), não cadastrada em `casas.json`.
- **Carrossel "São Paulo foi espetacular" (21/11 tarde, PUBLICADO):** `reels-especiais/sp-espetacular/` (gera.mjs + folha.mjs).
  Capa EDINHO? (amarelo com contorno), setlist de sexta na folha do gerador do site (setlist-ibirapuera, letras de mão por
  música, Black acrescentada ao lado com traço como nas folhas reais), coro, lanternas, Song of Good Hope, Black pedida, 1º solo
  a céu aberto em SP. Quadros dos vídeos do Andre em design/uploads (fora do git). Ideia guardada: foto do recado em
  português do Eddie (reels-especiais/recado-eddie/fotos/recado.jpg, falta saber o autor pra crédito).
- **TriggerAll com retentativa automática (21/11, commit 8989a6a no repo triggerall):** workflow disparado que FALHA no
  GitHub (failure/timed_out) é disparado de novo em 10 min, até 2x em 3 h, pra todo gatilho. Desliga num gatilho com
  `retry_on_failure: false` no config. Motivo: a cápsula de 20/11 falhou às 20h por erro passageiro do IG ("Please reduce
  the amount of data") e só saiu 0h54 pelo cron de reserva do GitHub. Código em `backend/src/services/retry.js`.
  Conferir na próxima falha se a execução `auto_retry` aparece no painel (depende do webhook workflow_run do repo).
- **COBERTURA AO VIVO IBIRAPUERA, RETOMAR AQUI (atualizado 21/11 21h10).** Andre no show pelo celular (remote control),
  manda vídeo pelo Drive e pede post; eu monto, mostro prévia quando dá tempo e publico. Mac fica ligado (caffeinate até ~4h de 23/11).
  - **Drive:** pasta do 2º dia id `1q51jwen5cer3dCTXaLB5KSLiycvo3X9I` (1º dia: `1qMIqGgbBD5ekB3ai8kMOYtxnt0gSPast`). Baixar:
    `rclone copy gdrive: reels-especiais/show-ibirapuera/brutos2 --drive-root-folder-id <id>`. Ver vídeo: mosaico de quadros com ffmpeg `tile`.
  - **Publicar carrossel/reel especial:** pasta `reels-especiais/<x>/` com `gera.mjs` + `publicar.json` (`imagens` R2 ou `videoUrl`,
    `legenda`); subir com `npx wrangler r2 object put smufdpj-midia/especiais/<...> --file X --content-type ... --remote`
    (arquivo mudado = nome NOVO, cache 4 h); commit, `gh workflow run publish-reel-especial.yml -f pasta=<x>`, `gh run watch`, `git pull` lê postId.
  - **Story em vídeo:** subir mp4 em `especiais/` e `gh workflow run story-avulso.yml -f imagem=https://midia.somaisumfadepearljam.com.br/especiais/<x>.mp4`.
  - **Render carrossel:** `node scripts/publish/carrossel/render.mjs <html> <saida> amarelo` (Andre prefere AMARELO, chama mais atenção).
  - **Voz:** ElevenLabs v4, Liam `TX3LPaxmHKxFdv7VOQHJ`, chave local `/Users/andrehz/.elevenlabs-key` (free, ~5k créditos restantes 21/11).
    Exemplo de chamada e sincronia por silencedetect em `reels-especiais/eddie-roger-rolou/gera.mjs`.
  - **Regras do Andre nesta cobertura:** reel com vídeo dele NUNCA leva o som ao vivo (a voz dele não pode aparecer):
    `-an` + narração + trilha própria. Foto de terceiro só com crédito do @ (pedir). Sem nome do Andre. Sem travessão.
  - **Publicado sábado 21/11:** story chegada 2º dia (`show-ibirapuera/story-chegada.mjs 2`, IG 18002913306037439);
    carrossel "Eddie e Glen" (`eddie-glen/`, amizade 2010 a 2026, capa foto @msachno, IG 18095805578285666);
    reel "ROLOU!" (`eddie-roger-rolou/`, Eddie no show do Roger: Pinball Wizard + The Kids Are Alright, IG 18073585574720793);
    carrossel informativo (`eddie-roger-carrossel/`, Pinball 0 vezes inteira antes, Kids ~36 vezes, 12ª vez juntos, IG 18127385051481696).
  - **Datas:** Eddie toca sexta 20/11 e DOMINGO 22/11; sábado 21 foi o Roger Daltrey (Kingfish, Chris Isaak na grade).
  - **Próximo (domingo 22/11):** story de chegada (`story-chegada.mjs` ganhar opção 3 / pasta nova do Drive), reel do dia no 1º bis
    (`show-ibirapuera/reel-dia.mjs`: trocar `brutos` e GRADE de domingo, tirar o som ao vivo), folha da setlist com
    `sp-espetacular/folha.mjs` + `cab-sp2.png`, post "quem acertou" (palpite: Hard Sun, Porch, Far Behind ficam; Immortality,
    Last Kiss saem; Rise, Guaranteed entram; dados em `eddie-balanco/`). Pendente: post do recado em português
    (`recado-eddie/fotos/recado.jpg`, falta crédito da foto). Retry do TriggerAll: conferir `auto_retry` na próxima falha.
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
- **Balanço da sexta + palpite pro domingo (REPUBLICADO 21/11 10h07 a pedido do Andre, IG 18474914098136414 + FB; o de 00h54, IG 18479406277119121, ele apagou; setlist já confirmada no setlist.fm, slide 2 virou 02b.jpg):** `reels-especiais/eddie-balanco/`
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
