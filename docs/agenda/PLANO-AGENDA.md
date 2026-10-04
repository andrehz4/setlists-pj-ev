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
8. Bônus: "Agenda da semana" no IG/story toda segunda.

Regras: crédito sempre pra banda e pra casa (com @), link pro post original, nada de foto da banda sem
autorização, dado com data passada some sozinho.

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
