# Carrossel de dados (modelo do Claude Design)

Modelo de carrossel 1080x1350 desenhado no Claude Design em 16/11/2026 (ranking do Eddie solo, post de 17/11).
Reaproveitável: troca o conteúdo no HTML e a cor por paleta.

- Modelo: `media/carrossel/ranking/modelo.html` + `support.js` (runtime do Design, NÃO editar; sem ele as barras
  dos slides 2 e 3 e as marcações do slide 7 somem). Cores ficam em variáveis no `:root`:
  `--destaque`, `--fundo`, `--alerta`, `--papel`, `--papel2`, `--claro`.
- Paletas prontas: `paletas.mjs` (`amarelo` é a original; `laranja`, `vermelho`, `verde`, `azul`, `rosa`).
- Render: `render.mjs` abre cada `data-screen-label` no Chrome headless e salva `01.jpg ... 10.jpg`.

## Usar de novo

1. Copiar `media/carrossel/ranking/modelo.html` e `support.js` para uma pasta FORA do git
   (ex.: `reels-especiais/<tema>/design/`) e pôr as fotos em `uploads/` ao lado (o modelo aponta para
   `uploads/foto-capa-eddie-setlist.png`, `uploads/selo-smufdpj.jpg` e `uploads/ev-commons-*.jpg`).
2. Trocar textos, números e nomes de foto no HTML copiado (dados das barras ficam no `<script type="text/x-dc">`
   no fim do arquivo).
3. Gerar:
   ```
   node scripts/publish/carrossel/render.mjs <pasta>/modelo.html <pasta>/saida azul
   node scripts/publish/carrossel/render.mjs <pasta>/modelo.html <pasta>/saida '{"destaque":"#00C2A8"}'
   ```
   Paleta parcial completa o resto com a amarela. Cor inválida derruba (de propósito).

Para mudar o layout, mandar o HTML de volta ao Claude Design (Share > Project HTML > Project archive traz o zip).
Fotos de terceiros e as imagens finais nunca entram no git (repo público).
Precisa do Google Chrome (`CHROME_BIN` troca o caminho) e de internet (fontes do Google Fonts).
