#!/bin/zsh
# Publica o carrossel da setlist do domingo: busca de novo, desenha, renderiza, sobe pro R2, publicar.json, commit e dispara.
# Uso: zsh reels-especiais/setlist-dom/publica.sh [--sem-publicar]
set -e
cd /Users/andrehz/Documents/Githubhz/setlists-pj-ev
P=reels-especiais/setlist-dom
node $P/busca.mjs
node $P/folha.mjs
node $P/gera.mjs
rm -f $P/saida/*.jpg; node scripts/publish/carrossel/render.mjs $P/design/carrossel.html $P/saida amarelo >/dev/null
[ "$1" = "--sem-publicar" ] && { echo "prévia em $P/saida"; exit 0; }
V=$(date +%H%M)
for n in 1 2; do
  npx wrangler r2 object put smufdpj-midia/especiais/setlist-dom/0$n-$V.jpg --file $P/saida/0$n.jpg --content-type image/jpeg --remote >/dev/null 2>&1
  curl -sf -o /dev/null https://midia.somaisumfadepearljam.com.br/especiais/setlist-dom/0$n-$V.jpg || { echo "R2 falhou 0$n"; exit 1; }
done
node -e '
const fs=require("fs"),[P,V]=process.argv.slice(1),B="https://midia.somaisumfadepearljam.com.br/especiais/setlist-dom";
fs.writeFileSync(P+"/publicar.json",JSON.stringify({agendado:"imediato, assim que o setlist.fm fechou (pedido do Andre: ser o primeiro)",imagens:[1,2].map(n=>`${B}/0${n}-${V}.jpg`),legenda:fs.readFileSync(P+"/legenda.txt","utf8")},null,2)+"\n")' $P $V
git add $P/*.mjs $P/publica.sh $P/publicar.json $P/setlist.json; [ -f $P/momentos.json ] && git add $P/momentos.json
git commit -qm "Setlist completa da 2ª noite do Eddie no Ibirapuera (carrossel)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01SJkFmT1LaFWBQFMoJgFo6u"
git pull --rebase -q && git push -q
gh workflow run publish-reel-especial.yml -f pasta=setlist-dom
sleep 8
id=$(gh run list -w publish-reel-especial.yml -L1 --json databaseId -q '.[0].databaseId')
gh run watch $id --exit-status >/dev/null && echo "run $id ok" || echo "run $id FALHOU"
git pull --rebase -q
grep -A3 '"publicado"' $P/publicar.json
