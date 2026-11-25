# PROGRESSO, setlists-pj-ev

Regra: este arquivo guarda o **estado agora** e as últimas ~2 semanas (teto de 300 linhas, testado em
`scripts/docs/docs.test.mjs`). Sessões mais antigas vão pra `docs/progresso/AAAA-MM.md`. Ao fechar sessão:
atualizar "Estado agora", escrever a sessão no topo e mover o que passar do teto pro arquivo do mês.

## Estado agora

- **25/11 22h, SHOW DA SEMANA: #1 A #10 PROGRAMADOS (01 a 22/12), RESTO BARRADO PELO LIMITE DE 29 DIAS.** O Business Suite só agenda até 29 dias à frente; #11 (26/12) em diante tem que ir em levas. Sugestão: 03/12 (#11 a #13), 17/12 (#14 a #19), 02/01 (#20 a #26). Renders em scratchpad (regerar com render.mjs se sumir). Legendas #7 a #26 agora com 4 hashtags (pedido do Andre); #1 a #6 já programados com 5. Pendências: pôsteres #21 (La Plata) e #24 (Sydney), push esperando OK. Comando: "lê o PROGRESSO.md e programa o Show da Semana do #11".
- **25/11 noite, SHOW DA SEMANA: 26 FICHAS APROVADAS, AGENDAMENTO EM ANDAMENTO.** Agenda em `media/show-da-semana/agenda.json` (#1 a #26, 01/12/2026 a 30/01/2027, ter e qui 17h, sáb 11h, 24/12 pulado). 26 fichas `aprovado` com campo `musica` (nome, trecho, motivo). Business Suite NÃO põe música em carrossel: agendar sem música, Andre tenta pelo celular. Passo a passo do agendamento (upload sem janela do Mac via file_upload) no README do show-da-semana, seção "Agendar no Meta Business Suite". PROGRAMADOS no Business Suite (FB + IG, sem música): #1 a #5 (01, 03, 05, 08 e 10/12). Próximo: #6 (12/12 11h). O Andre autorizou o Claude a clicar em Programar; recusar o "Turbinar" com "Talvez mais tarde". Próximo: #4 em diante (regerar renders se o scratchpad sumiu). Pendências: confirmar pôster de La Plata (#21, arquivo "mock") e Sydney (#24, baixa resolução); backup dos dados (fabrica-quiz/Drive); push esperando OK.
- **25/11 fim de tarde, SHOW DA SEMANA: 5 CARROSSÉIS PRONTOS (rascunho, Andre gostou) + PEDIDO EM ABERTO: AGENDAR 2 MESES.** Coletado (fora do git, só no SSD): 1.104 shows do pearljam.com com 1.109 pôsteres (`media/show-da-semana/posters/`, 275 MB) e 702 tópicos Fanviews do fórum (`.../forum/`). Cruzamento: 242 shows PJ com pôster + notas ricas (prontos), 144 com notas curtas, 116 Eddie solo sem pôster oficial. Modelo do Claude Design em `media/carrossel/show/modelo.html`; render `scripts/publish/show-da-semana/render.mjs`; fichas #1 a #5 em `media/show-da-semana/fichas/` (Porto Alegre 2015, Morumbi 2011, Maracanã 2018, Wrigley 2013 e 2016); prévias em scratchpad (somem no reboot, regerar com render.mjs). Tudo documentado em `scripts/publish/show-da-semana/README.md` + `FONTES.md`.
  - Decisões: terça e quinta 17h, sábado 11h BRT (evita quiz de quarta, reel de domingo, notícias 18h12, cápsula 20h). Música oficial só pelo app/navegador (API não põe música; áudio embutido = bloqueio). Andre pediu: agendar ~2 meses (~26 posts) pelo navegador (Instagram/Meta Business Suite no Chrome dele), revisar o PT-BR de cada texto, escolher pra cada show uma música simbólica que tocou naquela noite (e o trecho).
  - Pendências do Andre: legenda do amarelo no slide de setlist ("raridade" x "na história"); crédito EMEK no pôster de Wrigley 2013; pôster de 2016 deitado fica pequeno. Backup dos dados (fórum/oficial pro fabrica-quiz privado, pôsteres pro Drive) não autorizado ainda. Push de todos os commits locais segue esperando "pode dar push".
  - Próximo passo exato: (1) testar no navegador se o agendador aceita música em carrossel, com o Show #1, e o Andre confirma o clique de agendar; (2) se der, gerar as fichas #6 a #26 (agentes por lote, mesmo brief das 5 primeiras, só shows dos 242 prontos, alternando Brasil/histórico/aniversário) com campo `musica` {nome, inicio, motivo}; (3) revisão de PT-BR (humanizer-ptbr) + `cli.mjs checar`; (4) agendar de 01/12/2026 a ~30/01/2027.
- **25/11, MÓDULO "SHOW DA SEMANA" CRIADO (carrossel um show por post, inspirado no formato do @liveon4legspodcast):** `scripts/publish/show-da-semana/` (README com regras pra IA, `cli.mjs folego|novo|checar`, 6 testes ok). Material: 25 shows do site com pôster no repo (~6 meses a 1/semana) + 1447 setlists do setlist.fm com bis separado (históricos, precisam de pôster e história pesquisados). Ritmo sugerido: 1/semana intercalando Brasil e histórico. Próximo: modelo dos 4 slides no Claude Design e a 1ª ficha (sugestão: pj:2005-12-02, Show #1). Nada publicado.
- **24/11 21h45, MAIS 4 REELS AGITADOS EM PRODUÇÃO (pedido do Andre: "faz mais 4", os 4 de uma vez):** Alive (vhs, salto do Lollapalooza), Porch (fanzine, pendurado no teto do Drop in the Park), Once (ingresso, caixa de som de Seattle 91), Jeremy (vhs, crowd surf em Roskilde). 4 agentes em paralelo, brief em `reels-especiais/agitados-overlay/BRIEF-AGENTES.md`; saída em `reels-especiais/agitados-<musica>/` (saida/ e brutos/ fora do git), overlay em `agitados-overlay/fim-<musica>.html`. Cada um entrega prévia com música, arquivo POSTAR sem música, legenda, fontes.txt e POSTAR.txt (segundo de início no app). 24/11 ~22h30: OS 4 PRONTOS (37,2 s, 25-31 MB, sem travessão, final com seta e pisca em todos). Início da música no app: Alive 3:03 ("Is that the question?"), Porch 0:38,5 ("All the laws pass by"), Once 1:21 ("Once upon a time"), Jeremy 0:58 (refrão). Jeremy tem drop do CVV 188 (tema suicídio). Fontes quase todas via Wikipedia (citações do Eddie sem a entrevista original). Correções pedidas aos agentes: Porch e Once abriam com o mesmo clipe do Alive (seattle-1991-12) e o Porch fechava no salto do Pinkpop do Even Flow; Once com cartão "LADO B" em branco aos 26 s (conferir). Obs.: o `media/interpretations.json` diz que Gossard escreveu Porch, a Wikipedia diz Vedder (conferir depois). 24/11 ~23h: correções FEITAS (Once abre em seattle-1991-09; Porch abre em clipe-even-flow-1992-04 e fecha no Drop in the Park pendurado; cartão LADO B estava certo, era a animação). As 4 prévias abertas pro Andre. Arquivos pra postar: `reels-especiais/agitados-<musica>/saida/<musica>-POSTAR-sem-musica.mp4` (fora do git) + `legenda.txt` + `POSTAR.txt`. 25/11 08h33: Andre APROVOU os 4 e eles foram pro Drive (mesma pasta do Even Flow, subpastas Alive/Porch/Once/Jeremy com vídeo, LEGENDA e COMO POSTAR). rclone `gdrive:` reautorizado em 25/11 (o token expira; renovar com `printf "y\ny\n" | rclone config reconnect gdrive:` em segundo plano, Andre autoriza no navegador). 25/11 manhã: Even Flow POSTADO (com o quadrado na posição antiga, errada). Posição do botão Seguir medida na tela REAL do Samsung do Andre: quadrado x 600 y 1702 192x88, seta termina em 690,1688 (mock-ig antigo estava errado). Corrigido nos 5 overlays e os 4 vídeos refeitos e substituídos no Drive. PRÓXIMO: Andre posta manualmente, subir pro Drive com rclone (`gdrive:`), postagem manual pelo app.
- **24/11 noite, REEL AGITADO "EVEN FLOW" (1992, salto do Pinkpop), EM ANDAMENTO, NÃO POSTADO:** modelo de drops do Claude Design salvo em `reels-especiais/agitados-overlay/` (README = `RODIZIO.md`; render: `node capturar.mjs <html> <saida> 0 37.2 30` + ffmpeg overlay sobre o vídeo mudo; montagem em `montagem/reel-even-flow.json` + `gera.py`; legenda do post `legenda-even-flow.txt`; fontes das curiosidades `ef-capsulas.txt`). Decisões do Andre: rodízio de estilo de drop por reel (ingresso, vhs, fanzine; Even Flow = ingresso), carimbo = nosso logo, final B ("Segue a gente" falado + "O maior acervo de Pearl Jam do Brasil", sem congelar), legenda da letra FINA (Comfortaa branca, igual ao @heyholetsrock) = `fim-C.html`, formato VERTICAL. Drops conferidos contra as fontes (Spotify sem fonte saiu; clipe sem atribuir ao Eddie). 24/11 20h40: REMONTADO A PARTIR DO REFRÃO (prévia v9 aberta pro Andre, aguarda OK): começa em 59,5 s do disco (batida antes do "Even"), letra cantada o reel todo em 5 linhas (até "Ajoelhado, olhando o jornal mesmo sem saber ler"), salto do Pinkpop no "Oh" que volta depois da pausa (78,08 s do disco = 18,58 s do reel), drops reordenados (Lollapalooza 10,4 s, Pinkpop 15,6 s logo antes do salto). Arquivos: `montagem/gera-refrao.py` (vídeo mudo, `python3 -I gera-refrao.py <saida>`) + `fim-C-refrao.html` (overlay); áudio do disco com `-ss 59.5`. Voz do fim DECIDIDA: Jessica falando "Bora seguir a gente!" (`voz/bora-seguir-a-gente-jessica.mp3`, aos 35 s; "Segue a gente" sai errado em toda voz testada); na tela continua escrito "SEGUE A GENTE" (decisão do Andre). Letra CENTRALIZADA na altura da tela, igual ao reel de referência; drops ficam onde estão (Andre: tudo bem a UI do IG cobrir um pouco). Contorno laranja PULSANDO no tempo da música em volta do botão Seguir do IG SÓ nos intervalos sem cartão (o cartão passa por ali; janelas calculadas dos tempos dos drops) e direto do último cartão até o fim (x 274, y 1614, medido no mock-ig) + seta desenhada do "CONTINUA NO PERFIL" até o Seguir no final (Andre gostou do pisca; em teste). APROVADO pelo Andre 24/11 21h30, POSTAR QUA 25/11 (Andre publica): POSTAGEM MANUAL pelo app (a API não põe música da biblioteca nem salva rascunho): vídeo SEM a música do disco, só com a voz no fim, `reels-especiais/agitados-overlay/saida/reel-even-flow-POSTAR-sem-musica.mp4` (29 MB, fora do git); no app pôr Even Flow (Ten) a partir de 0:59. Pasta no Drive "Reel Even Flow (postar 25-11)" (https://drive.google.com/drive/folders/1tOM7r-AEm0JD9t8yvKMxuFxQgw7fdCLz) com vídeo + legenda + passo a passo (vídeo subido pelo rclone, remote `gdrive:`, que não tem o limite de 10 MB da ferramenta do Drive), legenda `legenda-even-flow.txt`. Prévia no scratchpad da sessão e687b773 (`reel-even-flow-refrao-previa.mp4` e `-cel.mp4`). ANTES era o PRÓXIMO: (1) remontar o reel começando no REFRÃO "Even flow" (1:00 do disco, hoje começa 0:48 com 12 s sem voz; Andre quer letra cantada o reel todo; usar letra de `media/letras/pt.json`, tempos via whisper-cli em `ef-20-90.wav`), salto do Pinkpop num ponto forte; (2) voz do "Segue a gente": Andre ainda escolhe 1 = Jessica ElevenLabs "Ségui a gente" ou 2 = Luciana do Mac (ElevenLabs quase sem crédito; alternativa: Andre grava); (3) subir o drop ~230 px pra fugir da UI do IG (sem resposta). Brutos/vídeos ficaram no scratchpad da sessão bb2da7bc (podem sumir; acervo dos clipes em `media/reels-clips/agitados/`). Postar: Even Flow a partir de 1:00, Andre publica.
- **23/11 16h30, BOTÕES NO CELULAR CORRIGIDOS E TESTADOS NO SAMSUNG DO ANDRE (no ar, site 040ad7bd0, fabrica-quiz em origin/main):** (1) Chrome do celular: imagem do story/folha gerada ANTES do toque (`fonte/entrega-pronta.js`), Instagram/Compartilhar/Baixar setlist abrem o compartilhar no mesmo toque. (2) Navegador do app do Instagram (segurar a imagem NÃO salva no Android): aviso no topo "Pra postar e baixar, abra no navegador" + os 3 botões abrem o Chrome (intent) / Safari (x-safari) com a MESMA setlist (`fonte/fora-do-app.js`); testado de ponta a ponta pelo link da bio no SM-S918B via adb (o IG pergunta "saindo do app", Continuar, Chrome abre com a setlist, Instagram abre o compartilhar). iPhone ainda não testado em aparelho. Celular do Andre por USB: `adb devices` (RQCW700WRTP), `adb shell input tap`, `adb exec-out screencap -p`. 98 testes do gerador. VÍDEOS TUTORIAIS: agente gerando os das 9 bandas em `reels-especiais/tutorial-bandas/` (regra do Andre: cada vídeo/mensagem só com a própria banda, nada de outra); Lost Dogs ENVIADO 23/11 16h41 (vídeo + 3 partes, DM pra @pearljamsp pelo Meta Business Suite; vídeo de 24 MB o Andre anexa na mão, a ferramenta do Chrome só sobe até 10 MB). Black Circle: fala da cena 3 regravada (data soava PT-PT; versão 2 aprovada de ouvido, "em São Paulo: sexta-feira, vinte e seis de fevereiro"); Black Circle nunca mandou DM, conversa aberta pelo instagram.com (logado @smufdpj), não pelo Business Suite. Black Circle ENVIADO 23/11 17h40 SEM o vídeo (partes 1-3 + aviso "assim que vocês responderem, a gente manda"); o upload do vídeo falhou no instagram.com e no Business Suite (provável bloqueio pra conta que nunca falou com a gente). PENDENTE: quando a Black Circle responder, o Andre manda `renders/tutorial-black-circle-15mb.mp4` (14,3 MB). PJ 90 (@pjnoventa): partes 1 e 2 ENVIADAS 23/11 17h45, o Andre manda o vídeo `renders/tutorial-pj-90-dm.mp4` por último. 23/11 ~18h: TEXTO (sem vídeo) ENVIADO pelo instagram.com pra Singles, Ribeirão, The Homer, Jeremy, Love Boat e Alive, com a frase do vídeo trocada por "Daqui a pouco a gente manda um vídeo de 3 minutos ensinando a mexer em toda a ferramenta" (pedido do Andre). O Andre manda cada vídeo quando ficar pronto (agente af1266c18d69b6157 renderizando; instruído a escrever datas como "em São Paulo: sexta-feira, vinte e seis de fevereiro" pra não sair sotaque de Portugal). PRÓXIMO ASSUNTO (pedido do Andre, 23/11): mapear o REEL DE DOMINGO, que ele vê como o acelerador do perfil, muito acima dos outros conteúdos. Prints de 23/11 (dois posts, falta confirmar qual é qual): A = 2.633 visualizações, 2.157 contas, 23 s de tempo médio, 63 seguidores; B = 17.832 visualizações, 9.636 contas, 95 visitas ao perfil, 30 seguidores. Ideia: puxar insights de todos os posts pela API (views, alcance, follows, tempo médio) e comparar por formato e dia. LIMPEZA APROVADA pelo Andre, fazer SÓ depois do último envio: apagar `gravacoes/` (2,1 GB), renders cheios e v1-v5 da Blaymorphed (manter só os `*-dm.mp4`) e `/Users/andrehz/.cache/hyperframes` (3,2 GB); mostrar a lista antes. Ferramentas do tutorial foram parametrizadas pelo agente (arquivos modificados, ainda SEM commit). PRÓXIMO: Andre aprova vídeo por vídeo; enviar por banda no Meta Business Suite (Caixa de Entrada > Instagram): eu anexo vídeo e colo as 3 partes, o ANDRE clica em enviar.
- **23/11 fim de noite, PÁGINA DE SETLIST PRA TODAS AS 10 BANDAS (NO AR, conferido em produção, Andre aprovou "do"; fabrica-quiz dec85ae enviado):** molde único `fabrica-quiz/geradores/setlist/bandas.mjs` (slug, @, nome, da/do, apelidos das casas, logo da folha) + `fonte/paginas/banda.js` (era blaymorphed.js; HTML da Blaymorphed saiu idêntico). Páginas: /setlist/{blaymorphed,lost-dogs,black-circle,pj-90,ribeirao,the-homer,singles,jeremy,love-boat,alive}/. Material por banda com `ferramentas/material-banda.mjs <slug> --trechos a,b` (logo em tinta em setlist-ibirapuera/img/logo-<conta>.png, logo.jpg, logo-redondo.jpg, fundo P&B; trechos escolhidos no olho, lista usada em cada um no commit). GA G-234ZL5MF0T agora em TODAS as páginas de setlist (Ibirapuera inclusive; teste em publicar.test.mjs). Lost Dogs testada no Chrome (3 botões, folha com logo, Baixar setlist). Trecho da fã em close tirado do acervo da Lost Dogs e reel de ter 24/11 re-renderizado sem ele (publicar.json atualizado, push feito). FALTA: abrir no Chrome as 8 páginas não testadas; vídeo tutorial da Lost Dogs reaproveitando o da Blaymorphed (`reels-especiais/tutorial-bandas/`).
- **23/11 noite, BOTÃO "BAIXAR SETLIST" NO AR + MENSAGEM ENVIADA PRA BLAYMORPHED:** banda cover ganhou o botão "Baixar setlist" (subtítulo "sem estatística e sem nome"), linha inteira embaixo do Instagram/WhatsApp; entrega só o canvas da folha (1100x1400), celular abre o compartilhar, computador baixa (`fabrica-quiz/geradores/setlist/fonte/baixar-folha.js`, teste `testes/baixar-folha.test.mjs`, fabrica-quiz 5b3ae6c no main; desliga com `?sem-baixar`). Ibirapuera sem mudança. Testado no Chrome. Andre mandou vídeo v6 + mensagem pra Blaymorphed (DM do IG corta em 1.000 caracteres: mensagem dividida em `reels-especiais/tutorial-bandas/mensagem-blaymorphed-parte{1,2,3}.txt`). Obs.: worktrees do fabrica-quiz das sessões ficam no scratchpad; testes dele fora da pasta vizinha precisam de `QUIZ_SITE=/Users/andrehz/Documents/Githubhz/setlists-pj-ev`. PRÓXIMO: resposta da Blaymorphed (cidade/horário do Stones Bar); botão do Instagram no celular (aviso "abra no navegador"); fundo em vídeo igual ao do Eddie.
- **23/11 tarde-noite, VÍDEO TUTORIAL PRA BANDA (Blaymorphed, v5 pronta, NÃO enviado):** um vídeo por banda ensinando a página e pedindo post com info redonda (dia, horário, casa com @, cidade NA LEGENDA). Pasta `reels-especiais/tutorial-bandas/` (roteiro `roteiro-blaymorphed.md` escrito pelo roteirista no Fable, mensagem do direct `mensagem-blaymorphed.txt`, ferramentas HyperFrames em `ferramentas/`: grava, clipes, audio, compor, voz-eleven). Pipeline: `node ferramentas/voz-eleven.mjs` (Jessica, cache por texto; conta principal zerou, usar `ELEVENLABS_API_KEY_RESERVA=$(cat /Users/andrehz/.elevenlabs-key-reserva) ELEVENLABS_CHAVE=reserva`) -> clipes -> audio -> compor -> `npx --yes hyperframes@0.9.56 render -o renders/<v>.mp4 --video-frame-format png --fps 30` -> comprimir 2 passadas pra <25 MB (DM do IG). Render pra DM: `renders/tutorial-blaymorphed-v6-dm.mp4` (cena 8 nova, "Uma coisa importante", versão forçando pt). Decisões do Andre: tom de SUGESTÃO no fim ("dá pra"), nunca ordem; não dizer que robô lê o Instagram ("a gente passa olhando os posts antes da agenda de segunda"); link no STORY (bio é invasivo); imprimir folhas e dar pros fãs de lembrança; QR code no fecho; pedido do Stones Bar só na mensagem, não no vídeo. Rascunho de voz = `say` sem -v (Siri padrão, igual audiodescrição do Terra Gentil). FEITO: vídeo + mensagem mandados (23/11). Botão "só a folha" FEITO como "Baixar setlist" (ver item acima). Antes era: botão "só a folha" na página da banda (imagem só da folha, sem nome nem estatística), no motor privado `fabrica-quiz/geradores/setlist` (ATENÇÃO: a pasta do fabrica-quiz no Mac está no branch `claude/top5-t2-fatos`; publicado é 5319dc1). Botão do Instagram: no celular cai na tela de passos quando o link abre dentro do app ou o iPhone barra o compartilhar depois da espera; ideia: gerar a imagem antes do toque + aviso "abra no navegador" (Andre ainda não disse iPhone/Android nem navegador).
- **23/11 noite, BLAYMORPHED NO AR (versão final aprovada pelo Andre; fabrica-quiz 5319dc1):** https://somaisumfadepearljam.com.br/setlist/blaymorphed/ com player, botão do Instagram e vídeo pronto pedindo pra marcar @blaymorphed e @smufdpj. Conferido em produção: botões 27/11 Santo André e 28/11 Campinas lidos da agenda, player toca com clique real (por script o Chrome barra o som, é normal). Agenda: a página lê `/media/agenda/shows.json` no ar a cada visita; a coleta diária (agenda.yml, via TriggerAll) atualiza sozinha. Simulado: de 29/11 em diante aparece o próximo show (Stones Bar 17/12, agenda sem cidade, botão mostra "SP"); depois de 17/12 sem show novo, aparece "Sem data". PENDENTE: cidade do Stones Bar na agenda; fundo em vídeo igual ao do Eddie.
- **23/11 fim de tarde, PLAYER DE BOOTLEG + BOTÃO DO INSTAGRAM (FEITO, Blaymorphed; fabrica-quiz ca94e26):** em "As músicas" cada música com gravação ao vivo no acervo do site ganha play (vira stop, uma por vez, para no fim, entrada e saída suaves, `preload=none`, um `<audio>` só). Mapa chave -> gravação gravado no `setlist/blaymorphed/musicas.json` pelo publicar (158 músicas; show no Brasil primeiro, senão o mais recente; `fabrica-quiz/geradores/setlist/scripts/bootleg.mjs` + `fonte/bootleg.js`, liga com `bootleg: "pj-"` em paginas.mjs). Na banda cover o "Só a imagem" virou botão **Instagram** (degradê, ao lado do WhatsApp): copia @blaymorphed, gera o story e abre o compartilhar; tela de passos ganhou "4 Marque @blaymorphed" (`fonte/instagram.js`). Ibirapuera sem mudança. Testado no Chrome. Push dos 12 commits anteriores FEITO. FALTA: fundo em vídeo da Blaymorphed igual ao do Eddie (deitado, close no rosto). Obs.: `npm test` falha no recover-publish se houver servidor local na porta 8793.
- **23/11 13h, CABEÇALHO COM NOME DE CASA COMPRIDO (FEITO, site sem push):** antes a letra só diminuía até 40 e depois passava da borda do papel. Agora quebra em casa (em cima) + data (embaixo), centralizado no logo; se nem assim couber, corta a casa com "…" e a data fica inteira (`fabrica-quiz/geradores/setlist/fonte/paginas/cabecalho-casa.js`, teste `testes/regressao-cabecalho-casa-longa.test.mjs`, fabrica-quiz 8badab9 enviado). Site: 10+ commits LOCAIS, push só com OK do Andre. PRÓXIMO: player de bootleg (plano no item abaixo).
- **23/11 tarde, BLAYMORPHED com a cara da banda (local, SEM push, fabrica-quiz 54e48a8 + seguinte já enviados):** folha com LOGO da banda (tinta, `setlist-ibirapuera/img/logo-blaymorphed.png`) + traço + "SANTO ROCK 27/11/26" em Permanent Marker (`fabrica-quiz/geradores/setlist/fonte/paginas/cabecalho-casa.js`; apelidos das casas em `paginas/blaymorphed.js` CASAS; as duas Santo Rock = "SANTO ROCK", decisão do Andre). Botões: dia, "Santo Rock · cidade", @casa. Story: rodapé em 2 colunas (SEGUE A BANDA @blaymorphed | SEGUE A GENTE @smufdpj). Testado no Chrome; Ibirapuera igual. Depois: abertura com as 9 palavras em ordem (regressão), troca de data depois do sorteio sorteia outro set (lista montada só muda casa/data, `fonte/troca-show.js`), fundo do story sem achatar (`cobrir` em story-layout.js). Compartilhar virou CONVITE ("Bora comigo no show da Blaymorphed no Santo Rock, em Santo André? É sexta, 27/11, às 22h. Já fiz o meu setlist! Faz o seu palpite e vê se a gente acerta: <link>", `paginas/convite.js`). PRÓXIMO, APROVADO: player de bootleg em "As músicas" (play vira stop), áudios do R2 por show (`dados/media-manifest.js`, 136 de 221 músicas do catálogo PJ batem por nome). Decisões do Andre: gravação de show no BRASIL primeiro (senão a mais recente); ao acabar PARA e volta ao play; uma por vez; tem que ser LEVE e suave (nada de baixar antes do clique: `preload=none`, um <audio> só reaproveitado, mapa chave->arquivo gravado no musicas.json pelo publicar, fade de entrada/saída curto, sem travar a página). FALTA: (1) fundo em vídeo igual ao do Eddie (diagnóstico: Eddie deitado 960x540, 8 cortes de ~3 s, close no rosto, claros mais apagados; banda em pé e planos abertos; plano: refazer deitado com close do rosto, 24 fps, claros mais escuros); (2) OK do Andre pro push do site.
- **23/11 noite, GERADOR DE SETLIST VIROU MOTOR PRIVADO (Fase 1 FEITA):** o fonte do gerador do Ibirapuera saiu do repo público. Agora fonte, testes, catálogo (`build.mjs`) e publicador moram em `/Users/andrehz/Documents/Githubhz/fabrica-quiz/geradores/setlist` (README lá). No público fica só `setlist-ibirapuera/gerador.<hash>.js` (esbuild, compactado, 51 KB), mais index.html, musicas.json e as imagens. Mexeu no fonte: `npm run setlist:publicar` no fabrica-quiz, depois commit aqui. Testado no Chrome: sortear, montar e folha, sem erro no console. O código antigo continua no histórico do git (não reescrito). PRÓXIMO, pedido do Andre: página da **Blaymorphed** primeiro (`/setlist/blaymorphed/`). Catálogo do PEARL JAM (não o do Eddie; estudo em `reels-especiais/eddie-carreira/estudo.json` chave `pearl_jam`, 1.102 shows), com preferência pelas letras oficiais do gerador oficial e a nossa fonte só no que faltar. Fundo com trechos da banda (`media/reels-clips/covers/blaymorphed`, ficam FORA do git/no R2, então é preciso servir alguns), logo = `media/agenda/fotos/blaymorphed.jpg`. Escolha entre os shows da semana lidos no ar de `media/agenda/shows.json` (27/11 @santorockbar, Santo André; 28/11 @santorockbarcampinas). Mandar a setlist pra banda fica pra depois.
  **Fase 2 FEITA (23/11 noite, fabrica-quiz fb582e2):** `build.mjs <artista>` (config em `scripts/artistas.mjs`). `pearl-jam` gera `fonte/musicas-pj.json`: 221 músicas, sem os discos solo do Eddie, música de disco entra toda e fora de disco só com 1%+ dos shows (sem Improvisation/Jam/medley), modelo de show da turnê do Dark Matter (50 shows 2024+, abre Release/Long Road/Garden, 17 + bis de 8). A lista oficial do Eddie só cobria parte do PJ: 46 PNGs novos na nossa fonte em `setlist-ibirapuera/img/` (Dark Matter inteiro, Garden, Rats etc.), conferidos numa folha. O catálogo do Ibirapuera ficou CONGELADO (o link compartilhado guarda a posição das músicas; regenerar quebra os links, só com `--forcar`). Bug de apelido corrigido no motor (You've Got to Hide, Long Road e I Am a Patriot apareciam 2x), mas só vale pro catálogo novo. **Fase 3 PRONTA, AGUARDANDO OK DO ANDRE PRO PUSH (23/11 noite, fabrica-quiz 14bceb7 + 18ca974):** página `/setlist/blaymorphed/` (motor com `fonte/pagina.js` = config do Ibirapuera, `fonte/paginas/blaymorphed.js`, `paginas.mjs` com as trocas do index.html, `publicar.mjs` publica todas). Botões = todos os shows da banda na semana (hoje até domingo, BRT) lidos no ar de `/media/agenda/shows.json`; sem show na semana, o próximo. Uma lista só (o show escolhido muda rótulo, texto de compartilhar e nome do arquivo). Cabeçalho BLAYMORPHED à mão (`setlist-ibirapuera/img/cab-blaymorphed.png`), logo, contador DESLIGADO (decisão do Andre: depois). Fundo `setlist/blaymorphed/fundo-banda.mp4` em preto e branco (igual ao do Eddie), só com plano médio com rosto no terço de cima (pedido do Andre: "os vídeos têm que ficar no rosto"), corte a 15% na tela larga; script em `fabrica-quiz/geradores/setlist/ferramentas/fundo-blaymorphed.sh`. `_headers` ganhou `/setlist/*`. Testado no Chrome: Blaymorphed (sorteio, botões 27 e 28/11, folha) e Ibirapuera igual (homenagem, x solo). PEDIDO EM ABERTO DO ANDRE (23/11): "tem que ser o mesmo estilo que tava no Ibirapuera, veja se tudo bate". Comparar o fundo e a página lado a lado: o do Eddie (`setlist-ibirapuera/fundo-eddie.mp4`) é 960x540 DEITADO, 24,9 s, preto e branco; o da banda é 540x960 em pé, 21,3 s (já em P&B). Conferir formato, brilho, contraste, desfoque, ritmo dos cortes, quadro de pôster, véu e posição do vídeo nas duas páginas (servidor local `python3 -m http.server 8793` na raiz, abrir /setlist-ibirapuera/ e /setlist/blaymorphed/), e ajustar a Blaymorphed pra bater (provavelmente refazer em 960x540 deitado com o rosto no terço de cima). Script: `fabrica-quiz/geradores/setlist/ferramentas/fundo-blaymorphed.sh` (trocar o crop/scale), e tirar o object-position de 15% em `paginas.mjs` se ficar deitado. Commits LOCAIS no site, SEM push (edfb7be17, c2a6a7868 e este): só dar push depois do OK do Andre. Depois: contador por página e "mandar pra banda".
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
