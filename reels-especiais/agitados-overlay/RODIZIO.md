# Drops dos reels agitados: rodízio de estilos

Os 3 estilos do Claude Design (Direcoes do Drop.dc.html) se alternam, um por reel, pra cada reel ficar diferente.
Ordem fixa: ingresso (bilhete) -> vhs -> fanzine -> ingresso...

| # | Reel | Estilo |
|---|------|--------|
| 1 | Even Flow (Pinkpop 92) | ingresso |
| 2 | próximo | vhs |
| 3 | seguinte | fanzine |

Sempre: carimbo = logo (uploads/logo-smufdpj.jpg), drop embaixo da legenda, final B com "Segue a gente" + "O maior acervo de Pearl Jam do Brasil".
Base do Even Flow: fim-B2.html (dropStyle "ingresso"). Pro próximo, copiar fim-B2.html e trocar REEL + dropStyle.
Render: node capturar.mjs <html> <pasta-saida> 0 <duracao> 30, depois ffmpeg overlay=eof_action=pass sobre o vídeo mudo.
