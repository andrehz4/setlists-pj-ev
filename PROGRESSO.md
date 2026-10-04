# PROGRESSO, setlists-pj-ev

Regra: este arquivo guarda o **estado agora** e as últimas ~2 semanas (teto de 300 linhas, testado em
`scripts/docs/docs.test.mjs`). Sessões mais antigas vão pra `docs/progresso/AAAA-MM.md`. Ao fechar sessão:
atualizar "Estado agora", escrever a sessão no topo e mover o que passar do teto pro arquivo do mês.

## Estado agora

- Site, fórum e pipeline no ar. Publish IG/FB, story diário, reel de domingo, cápsulas, contrib e X manual rodando.
- Instagram oficial (@pearljam, @eddievedder) é fonte de notícia desde 02/10 (`scripts/news/ig-oficial.mjs`).
- Vistoria de saúde executada em 03/10 (ver a sessão abaixo e `docs/VISTORIA-2026-10-02.md`, seção Status).
- Pendências vivas:
  - Agenda (POC no ar desde 04/10, reavaliar 11/10): `/agenda/` com Blaymorphed, Black Circle e Singles, coleta
    diária (`agenda.yml`) com a turnê oficial de pearljam.com/tour. Story do dia por estado (`agenda-story.yml`)
    e post "Agenda da semana" (`agenda-semana.yml`) prontos e testados no mock, DESLIGADOS até o Andre criar a
    variável do repo `AGENDA_PUBLICAR=1`. Pacote do Claude Design em
    `/Users/andrehz/Documents/Githubhz/setlists-pj-ev/design-handoff/agenda.zip`; retorno vai pra `pagina.mjs`.
  - Ligar `RATE_LIMIT_IP=ultimo` no Railway depois de conferir o X-Forwarded-For nos logs.
  - Revisar os PRs do dependabot (abrem toda semana).
  - Conferir no ar o reel de domingo 04/10 (1º no padrão novo, agora às 09h07) e o story de hoje com o domínio novo.
  - Backup de 30/09 (`/Users/andrehz/Documents/Githubhz/_backup-setlists-pj-ev-2026-09-30.git`, 1 GB): decidir se apaga.
  - 2 contas "André Zimermann" no forum_users (a de 18/05 está vazia).
  - Pedido da abertura SMUFDPJ nas legendas está com a outra IA (baixa-clipehz).

## 2026-10-04 (madrugada, parte 2): agenda nas redes e turnê oficial

- Story "Alô, pessoal do RJ!" (um por estado com show no dia, 14:07) e post de segunda "Agenda da semana" com o
  @ da banda e o @ da casa (marcados na foto; se o IG recusar a marcação, sai sem ela). Fora do reel.
- Turnê oficial lida do JSON embutido em pearljam.com/tour (Bandsintown recusa sem app aprovado). Hoje: Eddie
  Vedder no Ibirapuera, 20 e 22/11. Data oficial nova avisa no Telegram.
- Briefing do Claude Design da página /agenda/ montado com dados reais e prints.

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

## 2026-09-30 (noite): X em modo manual com kit diário (fechado)

- Feito: `kit-do-dia.mjs` (notícias 24h às 12/14/16/18h + cápsula 20h05), `/x-hoje` (`ROTINA-X-HOJE.md`: reescreve
  condensado, `conferir.mjs` valida, Andre aprova e clica Schedule), tarefa do Mac às 11h INSTALADA. Só a 1a notícia
  do dia leva link (teste de alcance). Testes do kit + Regra 0 (<=150 linhas) no módulo X. Seção do X no CLAUDE.md.
- Teste real feito hoje: agendados no X 18h (com link), 19h, 20h05 (cápsula) e 21h, conferidos na lista do X.
- Pendente: notícia "Do Bad Religion ao Pixies" (04a0d0850b) ficou fora do limite de 4 e não entra no kit de amanhã;
  postar à mão se o Andre quiser.
- Próximo: 1a sessão automática 01/10 às 11h; em ~2 semanas comparar nas estatísticas do X post com link x sem link;
  reel de domingo 04/10 no X à mão; automático via API quando o formato estiver aprovado e houver crédito.

## 2026-09-30 (tarde): voz no reel e nos stories (ElevenLabs), reel reorganizado

**Feito**
- **Reel semanal narrado** (`scripts/publish/narracao/`, README lá): ElevenLabs Eleven v4, Jessica e Liam revezando por
  semana, lê a manchete da tela, cada cena dura o tempo da fala, música abaixa com a voz, 3 aberturas e 3 finais
  (chamada pro "maior acervo de Pearl Jam do Brasil") gravados no repo. Crédito discreto na legenda ("voz: ElevenLabs").
  Checagem de saldo antes de narrar + aviso no Telegram. LIGADO (`REEL_NARRACAO: '1'`), 1º narrado: dom 04/10.
- **Story diário com voz** só na abertura (data) e no final: Bella (dia par) e Chris (dia ímpar). 62 aberturas
  (30/09 a 30/11) e 6 finais gravados; todo dia 1 grava os 31 dias seguintes. LIGADO (`STORY_NARRACAO: '1'`).
- Conta ElevenLabs: a da EMPRESA do Andre (chave "reel-smufdpj", secret `ELEVENLABS_API_KEY`), plano grátis 10k/mês.
  Uma conta só no projeto (termos proíbem várias contas grátis pra somar cota).
- `reel-video.mjs` dividido em `scripts/publish/reel/` (<=150 linhas, teste), saída idêntica (hash de 293 amostras).
- Texto da manchete não some mais no meio da fala (saída acompanha a duração da cena).
- Curadoria: trava de acento, guia voz-humana, regra de cobertura (ver sessão da madrugada abaixo). Routine no Opus 5.5.

**FEITO (30/09 ~14h30 BRT): vídeos pro R2 + limpeza do histórico.** Reel e story sobem pro bucket R2 `smufdpj-midia`
(link `midia.somaisumfadepearljam.com.br`, regra do bucket apaga em 3 dias, chave "smufdpj-midia-publicacao" restrita
ao bucket; secrets `R2_*`), MP4 no `.gitignore` (fallback sem R2 força o add). Histórico reescrito com git-filter-repo
tirando só `instagram-reels/*.mp4` e `instagram-stories/*.mp4`: 1.021 MB -> 734 MB, árvore atual idêntica (40e4c46),
4585 -> 4440 commits. Backup completo: `/Users/andrehz/Documents/Githubhz/_backup-setlists-pj-ev-2026-09-30.git`.
Force push feito pelo Andre (o auto mode bloqueia pra mim). Outras cópias do repo (ex: Windows) precisam ser clonadas de novo.
Oportunidade anotada: `media/pj-*` (~430 MB no histórico) parecem áudios de shows duplicados do R2; investigar antes.
Revisar no Cloudflare: 2 tokens R2 "setlists-pj-ev build token" com Admin em todos os buckets (duplicados).

(histórico do item) **Próximo item (anotado a pedido do Andre)**: tamanho do repositório. `.git` já está em ~1 GB (GitHub recomenda
<1 GB, reclama acima de 5 GB). O peso é dos MP4: reels ~166 MB e crescendo ~10 MB/semana; stories também. Áudios da
narração são irrelevantes (~22 MB o ano inteiro, uma vez só). Plano: mover vídeos antigos pro Cloudflare R2 (o projeto
já usa) e manter no repo só as semanas recentes; avaliar limpar o histórico dos MP4 (reescrita de histórico: só com OK
explícito do Andre, é destrutivo). Atenção: o IG e o FB baixam o vídeo pela URL raw do GitHub no momento de publicar.
Andre confirmou: os vídeos NÃO precisam ser guardados (só servem de link pro IG/FB baixar na hora). Solução de raiz:
subir pro R2 só pra publicar e apagar depois, sem commitar (precisa de token R2 com escrita, o Andre gera). Investigar
também por que a poda dos reels (`prune-media.mjs`, 30 dias) não roda: há 16 reels na pasta, deveriam ser ~4.

**X (@somaisumfadepj), 30/09 à noite**: perfil pronto (selo em alta do Nano Banana + capa bilhete; artes em
`media/marca/`, playbook `docs/PLAYBOOK-IMAGENS-GOOGLE.md`). Dev console com app Read+Write, chaves OAuth 1.0a nos
secrets `X_*` (testadas), pay-per-use SEM crédito. Testes manuais: 1 post de notícia (card + texto) e a cápsula de 30/09
agendada no próprio X pras 20h05 (4 imagens: conferir o corte do grid no feed). Automático só depois de validar o formato
e o Andre colocar crédito (módulo `scripts/publish/x/`, README lá). Reel no X: postar à mão no domingo depois do IG.

**Próximo passo**: conferir o story narrado de 01/10 (Chris) e o reel de 04/10 (Jessica). Depois: transições com
trechos de clipe (Andre passa a lista de clipes e aceita o risco de imagem; acervo `media/reels-clips/` está vazio),
ideia equivalente pros stories, e a foto de capa de cápsula com texto embolando na cena do reel.

## 2026-09-30 (madrugada): revisão das notícias (destaques da edição)

**Achados**: rodada da routine de 29/09 12h escreveu 4 notícias sem acento e foram pro IG ("NAO E OFICIAL", "TURNE");
~15 notícias do mesmo assunto (Abe Laboriel) em 3 dias, com contradição ("oficializa" x "não confirmou"), 3 versões
da mesma matéria no mesmo carrossel; "sitting in" no card; datas divergentes; legenda do IG terminando em "frase.…" e
com "_via Fonte_" à mostra (246 notícias curtas); "*Vs.*" com asterisco no site (13).

**Feito**
- Trava `scripts/news/qualidade-ptbr.mjs` no `merge-curated.mjs`: sem acento = recusado, volta pro `_pending`, aviso no
  Telegram (auto-merge); "dos Pearl Jam" corrigido sozinho. Testado no acervo inteiro: pega só os 5 reais.
- Guia `scripts/news/prompts/voz-humana-ptbr.md` (humanizer-ptbr enxuto) lido pela routine. `system-curator-fa.txt`:
  regra de cobertura revisada (só fato novo, republicação = SKIP), regra de confirmação e de datas. `routine-prompt.md`:
  seção 2.5 com as manchetes das últimas 72h, checagem final por item, regras #6 e #7.
- Routine no claude.ai (trig_01WTGwu5LzVJrQcxtMpRH3Te) agora só manda ler o `routine-prompt.md` do repo.
- Legenda: corte sem "frase.…", sem markdown. Site: `*x*` vira itálico. 5 notícias reacentuadas, título do "sitting in",
  data 25/27 e "dos Pearl Jam" corrigidos; stubs regenerados. 208 testes ok.

**Próximo passo**: conferir a rodada das 06h (30/09) e o carrossel seguinte. Andre decidir se sobe a routine de
Sonnet 4.6 pra Sonnet 5.5. Pendente: manchetes antigas de 28/09 que dizem "oficializa/confirma" o Abe.

## 2026-09-30: slide de citação das cápsulas com foto de quem fala (Claude Design)

**Feito**
- Slide de citação das cápsulas refeito a partir de um post do @igormirandasite. O Claude Design fez as opções e o
  Andre escolheu duas: **editorial** (1c + seta de arrastar 3d) e **revista** (2b). Rodízio diário (BRT), igual às capas;
  a cápsula inteira usa o mesmo estilo. Módulo apartado em `scripts/publish/citacao/` (README explica tudo).
- **Retratos curados** por integrante, recortados no rosto (detector de rosto do macOS), em `media/band/retratos/`.
  A foto nunca vem da imagem da matéria. Sem retrato (Letterman etc.): iniciais no círculo ou nome gigante.
- **Fonte da fala** embaixo do nome ("em 1990 · Apple Music, 2024"): `media/news/youtube-acervo/_fontes.json`, 83 vídeos,
  ano de quando a fala aconteceu. Liberado no `.gitignore`.
- Playfair itálica (400/500/700) adicionada em `media/fonts/`. A Black reta NÃO, pra não mudar slides antigos.
- Ligado em produção: `CAPSULA_CITACAO: rodizio` no `publish-capsula.yml`. 200 testes ok; validado no mock.
- Export do Design: `/Users/andrehz/Downloads/Citacoes smufdpj.html` (referência, fora do repo).

**Estado**: no ar a partir da cápsula de 30/09 20h (cap-Qq5GByx, estilo editorial, cor grafite).

**Próximo passo**: conferir no feed a de 30/09 (editorial) e a de 01/10 (revista). Andre revisar `_fontes.json`.
Vídeo novo no acervo precisa de entrada no `_fontes.json` (sem ela sai sem fonte, não quebra).

## 2026-09-28 (tarde): capas novas, carrossel sem repetição, topo da home limpo, playbook de SEO

**Feito**
- Conferências do handoff no navegador: contato@ com Email Routing "Enabled"; home já indexada no Google; indexação
  solicitada pra /musica/, /noticias/, /show/, /disco/, /banda/; login Google no fórum ok no domínio novo.
- **Carrossel (pedido A)**: a capa (Card 11) SUBSTITUI o slide da notícia líder. Antes: capa A + A + B; agora: capa A + B
  (+ C...) no layout normal. Notícia única segue imagem única sem capa. Vale pro IG e o álbum do FB. Limite: 10 notícias.
- **Capas novas (pedido B)**: Claude Design (projeto "Pearl Jam carousel cover layouts") fez pôster de show, zine recortado
  e ingresso; Andre aprovou. Rodízio diário (BRT) com a capa atual em `scripts/publish/cover-styles.mjs` +
  `cover-styles-svg.mjs`; foto embutida no SVG, largura de texto medida de verdade. `COVER_STYLE=<estilo>` força um estilo.
  Export do Design em `design-handoff/retorno/capas/` (gitignored).
- **og.jpg** (prévia de link no WhatsApp/redes) refeito com o bilhete do topo do site via Chrome headless.
- **Link #forum** (e #banda, #timeline etc.) abre direto na aba; `#news/<id>` intacto.
- **Topo da home** (Andre aprovou): sem a faixa "ADMIT ONE / PERSONAL ARCHIVE" e sem o parágrafo de apresentação;
  Instagram, Facebook e dia/noite no canto do bilhete (coluna no celular, título com a direita livre).
- **E-mail público** (rodapé e privacidade) passou pra contato@somaisumfadepearljam.com.br.
- **Fonte no Mac** consertada: sharp do macOS usa CoreText e ignora o fonts.conf; `npm run fontes:mac`.
- **Playbook de SEO/Google** reaproveitável em `docs/PLAYBOOK-SEO-GOOGLE.md`, com ponteiro no CLAUDE.md global.

**Estado**: tudo no ar, 185 testes ok. Hoje (28/09) a capa do rodízio é a atual (card11).

**Próximo passo**: conferir no feed real as capas novas com fotos de verdade: 29/09 pôster, 30/09 zine, 01/10 ingresso.
Se alguma sair ruim, ajustar em `cover-styles-svg.mjs` e validar com `COVER_STYLE=<estilo> node mock-ig/run.mjs feed`.

**Pendências / blockers**
- Andre: trocar o link da bio do Instagram e do Facebook pro domínio novo.
- Search Console: acompanhar Indexação > Páginas em 1 a 2 semanas.
- 2 contas "André Zimermann" no forum_users (a de 18/05 está vazia), herdado.

## 2026-09-28: domínio próprio somaisumfadepearljam.com.br no ar

- Registrado no Registro.br (5 anos, até 2031), DNS no Cloudflare (eleanor/marty), site ligado com e sem www, HTTPS ok.
- Código trocado pro domínio novo (canonicals, sitemaps, 774 páginas, links IG/Telegram, rodapé das imagens do IG).
- Backend: `SITE_ORIGINS` com os dois endereços, `FORUM_CORS_ORIGIN` no novo; R2 CORS e origens do Google OAuth liberados.
- Redirect 301 do pages.dev (Bulk Redirects), testado com links de notícia, show e tópico.
- Search Console: propriedade nova verificada, sitemaps enviados, "Mudança de endereço" confirmada.
- `contato@somaisumfadepearljam.com.br` -> Gmail (Email Routing; MX/SPF do Cloudflare no lugar do bloqueio do Registro.br).
- Hub HZ: site cadastrado no catálogo (não estava).
- Fórum: perfil mike2006 (curadoria do site, bio explica) postou 15 respostas creditadas do fórum oficial em 11 tópicos.

**Próximo passo**: 10h04 de hoje, pedido de indexação no Search Console (agendado). Andre: trocar link da bio do IG/FB
pro domínio novo; logar de novo no fórum (login é por endereço); testar um e-mail pro contato@.

## 2026-09-27: SEO completo, métricas, fórum semeado e segurança

- **Diagnóstico**: o Google não indexava nada. SPA com `#` + notícias redirecionando pra home. GA desde 08/05:
  101 pessoas (~25-30 reais), 0 visita do Google, Instagram = 23% das sessões.
- **Páginas estáticas** (molde `scripts/seo/layout.mjs`, menu de seções em todas): 446 notícias completas (`n/`),
  28 shows (`show/`), 276 músicas com interpretação PT e notas (`musica/`), 15 discos com ensaio (`disco/`),
  `banda/`, índices `noticias/ musica/ disco/ show/`. Sitemap com 774 URLs. Rodapé da home com links reais.
  Gerador: `node scripts/seo/build-seo-pages.mjs` (teste de sincronia falha se esquecer). Sem letra/cifra.
- **Fórum**: páginas `/t/<id>` via Pages Functions (`FORUM_SEO=1` ligado no Cloudflare), "thread" virou "tópico",
  5 tópicos iniciais pela conta do Andre (SQL no Supabase), com citações creditadas do fórum oficial.
- **Search Console** verificado (via GA), sitemaps enviados. Pedido de indexação da home estourou a cota do dia.
- **Métricas**: GA em todas as páginas públicas (menos colaborar, CSP), seção do SPA conta como página vista,
  GA carrega sem exigir clique. Cloudflare Web Analytics ligado.
- **Terra Gentil (backend)**: limiter por IP real, 2 testes do fórum corrigidos, login mobile só volta pro app
  (antes aceitava redirect externo = roubo de token), perfil público sem email/nascimento, diagnóstico com rate limit.

- **Pendências técnicas (mesmo dia)**: editar tópico/resposta no fórum (PATCH no backend + botão Editar no site,
  testado no ar); `ADMIN_USER_IDS` criado no Railway com as 2 contas André (antes não existia: ninguém era admin
  no fórum); lote 2 de tópicos em `forum-sementes/LOTE-2.md` (Abe, covers, Oceans, tatuagens, filmes) aguardando aprovação.
- **Lote 2 publicado** (SQL no Supabase): fórum com 10 tópicos pela conta principal do Andre.
- **Home 35% mais leve** (333 KB -> 215 KB transferidos): letras saíram do index.html pra `media/letras/`, carregam
  em segundo plano; show, busca e letra se refazem quando chegam. Google não lê mais letra na home.
- **Velocidade (Lighthouse mobile)**: 68 -> 73; CLS 0,411 -> 0,223. Fontes do Google não travam mais o início, fontes
  do topo pré-carregadas, faixa de números pré-preenchida, barra de abas rola só na horizontal. SEO 100, boas práticas
  100, acessibilidade 98. O CLS que sobra vem da rolagem automática até a notícia em destaque (decisão de design,
  perguntar ao Andre) e da troca de fontes. Separar JS/CSS em arquivos NÃO compensa: revisita já volta 304 com 0 bytes.
- **Lote 3 publicado**: fórum com 15 tópicos. **Home abre no topo** (removida a rolagem automática até a notícia).
- **Velocidade resolvida**: fontes do topo declaradas no head + pré-carregadas. Lighthouse mobile em produção: nota 82
  (era 68), CLS 0,002 (era 0,411).
- **Fonte do texto corrigida** (Andre escolheu): IBM Plex Mono passa a carregar em todos os aparelhos (URL pedia
  `300..600`, inválido). Lighthouse mobile depois: velocidade 83, SEO 100, acessibilidade 98, boas práticas 100, CLS 0,002.

**Próximo passo**: amanhã, no Search Console, "Solicitar indexação" da home e dos índices (/musica/, /noticias/,
/show/, /disco/); acompanhar Páginas indexadas em 1 a 2 semanas. Responder quem postar no fórum.
Pendente: 2 contas "André Zimermann" no forum_users (a de 18/05 está vazia).
