# Agenda de shows: Pearl Jam oficial + bandas cover no Brasil (plano, 2026-10-04)

Objetivo: uma seção do site com o calendário do mês, juntando a turnê oficial do Pearl Jam e os shows das
bandas cover pelo Brasil (data, cidade, casa), pra o site virar a referência nisso. Módulo apartado (Regra 0),
desligado por flag até o Andre aprovar.

## Prova de conceito (@blaymorphed): FUNCIONOU

`scripts/agenda/poc-ig.mjs` + workflow manual `agenda-poc.yml` leem os posts públicos pela API oficial da Meta
(Business Discovery, mesmo `IG_LEITURA_TOKEN` da coleta da @pearljam). Só legenda, nunca foto.

Achado: a Blaymorphed publica no fim de cada mês um post "Agenda de MÊS" muito estruturado, uma linha por show:
`Sex 09 - barrockclub_ - São Bernardo - SP` (dia da semana, dia, @ da casa, cidade, UF). Às vezes 2 dias
("Sex 16 e Sáb 17"), show solo do vocalista ("(SV Solo)") ou "Evento Fechado". Na semana do show sai outro post
com horário, abertura e reservas ("Bloco 1 = 21:30 às 23:00", "Reservas: (11) 2211-1225").
Agenda de outubro/2026 lida: Campo Grande (2 e 3), Mauá (5, SV solo), São Bernardo (9), Bragança Paulista (10),
São Paulo (11, Stones Bar), evento fechado (16 e 17), Ribeirão Pires (23), Santo André (24), Mogi das Cruzes (31).

## Estado da POC (2026-10-04)

No ar: coleta diária das 3 bandas, `/agenda/` com 18 shows públicos (eventos pro Google), resumo dos novos no
Telegram. Falta: story do dia por região, post semanal com os @, turnê oficial do Pearl Jam, desenho no Claude
Design. Reavaliar em 11/10 e ampliar a lista de bandas se tudo der certo.

## Como vai funcionar

1. Lista de bandas em `media/agenda/bandas.json` (@ do Instagram, nome, cidade-base, texto de perfil). Banda
   com conta pessoal (sem API) entra pelo painel de colaboradores.
2. Coleta diária (workflow novo) lê os posts recentes de cada banda.
3. Extração: regex pros posts "Agenda de MÊS" (formato da Blay) e IA (Gemini, já usado no contrib) pros avisos
   soltos. Cada show vira {banda, data, hora, casa, @casa, cidade, UF, link do post, confiança}.
4. Aprovação no Telegram no começo (um toque por show), como o /ban. Depois, banda confiável entra direto.
5. Turnê oficial do Pearl Jam: API do Bandsintown (gratuita) ou site oficial, com contexto pra quem não conhece
   (como funciona Ten Club e ingresso, setlist da noite via setlist.fm).
6. Página `/agenda/` estática (o Google não lê o SPA): mês, filtro por estado/cidade, JSON-LD `MusicEvent` em
   cada show (resultado de evento em destaque na busca). Página por banda com a história.
7. Front da seção: desenho no **Claude Design** (pedido do Andre), no fluxo já usado nas capas e no reel.
8. Redes (decisão do Andre, 2026-10-04):
   - Todo post da agenda marca o @ da banda E o @ da casa onde ela toca.
   - Banda cover NÃO entra no reel semanal (o reel continua sendo o resumo de notícias).
   - No dia do show sai um story de aviso por região: "Alô, pessoal de MG! Hoje tem show": banda, casa, cidade,
     horário, com a banda e a casa marcadas. Testar no mock e no IG real se a API aceita a marcação no story
     (user_tags); se não aceitar, o @ vai escrito na arte e o post do feed leva a marcação clicável.
   - "Agenda da semana" no feed toda segunda (carrossel por estado), legenda com todos os @.

Regras: crédito sempre pra banda e pra casa (com @), link pro post original, nada de foto da banda sem
autorização, dado com data passada some sozinho. Banda parada há mais de 6 meses fica como "sem agenda".

## Perfil: Blaymorphed (Pearl Jam cover Brasil)

- Formada em 2000 em Santo André (SP); em 2026 completa 26 anos ("#Blay26"). Instagram @blaymorphed
  (~33 mil seguidores, ~970 posts), também no Facebook e no YouTube.
- Formação na bio atual do Instagram: Sergio "Vedder" (voz, violão, uquelele, gaita), Marcelo Yamakawa
  (guitarra), Glauber Fiammetti (guitarra), Samir Natali (baixo), Marcelo V. Ferreira (teclado) e @ronas_dsd
  (bateria). Fontes antigas citam Roger Alves na bateria: confirmar com a banda.
- Proposta: reproduzir o Pearl Jam com a mesma divisão de instrumentos da banda original, com acervo de mais de
  100 equipamentos iguais aos do Pearl Jam (guitarras, violões, uquelele, banjo, cítara, bandolim etc.).
- Em 30/03/2018, no show solo de Eddie Vedder no Citibank Hall (São Paulo), Eddie chamou Sergio Vedder ao palco
  e os dois cantaram "Black". Sergio já dividiu o palco com Eddie três vezes no Brasil e acompanhou mais de 30
  shows do Pearl Jam em 7 países (entrevista de 2018).
- Circuito: Stones Bar (São Paulo, o "Stones Tributo" mensal), Santo Rock Bar (Santo André e Campinas), Bar Rock
  Club (São Bernardo), Tork n' Roll (Curitiba), unidades do SESI-SP (festivais), teatro municipal de Santo André
  (DVD "Blay XVII", 2017).

Fontes: SESI-SP (sesisp.org.br, evento "Pearl Jam Cover Brasil"; sorocaba.sesisp.org.br), Omelete, Whiplash,
Rádio Rock 89 FM, Jornal no Palco e Virgula (Eddie e Sergio cantando "Black", 2018), setlist.fm (Citibank Hall,
30/03/2018), Female Rock Squad (entrevista com Sergio Vedder, 2018), ABC do ABC (Teatro Municipal, 20/05/2017).

## Perfil: Black Circle (@blackcirclepj, Rio de Janeiro)

- Formada no Rio de Janeiro em 2016; ~101 mil seguidores, ~740 posts, muito ativa. Agenda mensal em post único
  ("OUTUBRO COMEÇOU...": `02/10 // Florianópolis/SC`, uma linha por show, 🎻 = Symphonic, 📍 = show de bar), sem
  o @ da casa na lista (a casa aparece no post do dia: "rocknbeerpub São Gonçalo/RJ").
- Formação (Rolling Stone, 2020): Lenny Prado (voz), Luiz Caetano e Sergio Filho (guitarras), Gabriel Z (baixo),
  Nyck Magnani (bateria). Outras fontes citam Guilherme de Menezes no baixo: confirmar.
- "Pearl Jam Symphonic": banda + orquestra regida pelo maestro Dhouglas Umabel, em teatros, na 3ª temporada.
- Reconhecimento: em 2020 foi convidada por Eddie e Jill Vedder pra abrir o evento beneficente online do
  vocalista; em 2023, num show do Pearl Jam em Austin (EUA), Eddie recebeu da plateia uma bandeira da banda,
  falou dela e dedicou "Spin the Black Circle", a música que dá nome ao grupo.
- Autoral: álbuns "Mercury" (2020) e "Pandora" (2022), single "This Broken Man".
- Outubro/2026: Florianópolis (2, Symphonic), Itajaí (3, Symphonic), Rio (10, 15, 30), Volta Redonda (11),
  Niterói (16), Osasco (23), São Bernardo do Campo (24).

Fontes: Rolling Stone Brasil (27/10/2020), Jornal de Brasília (01/08/2025), Estado de Minas (11/2025),
Tenho Mais Discos Que Amigos (2020), Instagram @blackcirclepj via API oficial.

## Perfil: Singles (@singlesplayspearljam, Belo Horizonte)

- De Belo Horizonte (MG). Primeiro show em 14/04/2000 no Rock Blues, data que a banda adota como início
  (25 anos em 2025). ~9,4 mil seguidores, ~1.560 posts.
- Se apresenta como tributo, não cover: versões alternativas e solos diferentes, como o Pearl Jam faz ao vivo;
  repertório de ~150 músicas. Lançou CD e DVD em 2015. Residência semanal no Circus Rock Bar (BH).
- Especial "Into The Wild" (trilha de Eddie Vedder) em 19/01/2025 no Observatório (Nova Lima/MG).
- Instagram parado desde 07/2025: na agenda entra como "sem agenda" até voltar a postar. Tem página no
  Bandsintown (segunda fonte possível de agenda).
- Afirmação a confirmar com a banda: "única no Brasil licenciada pelo Pearl Jam" (fonte: Hoje em Dia).

Fontes: UAI/Estado de Minas (20/11/2015, CD e DVD), Hoje em Dia, Bandsintown, singles.art.br, Instagram via API.
