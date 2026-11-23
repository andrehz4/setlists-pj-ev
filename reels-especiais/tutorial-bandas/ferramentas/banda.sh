#!/bin/zsh
# Vídeo tutorial de uma banda, do começo ao fim. Uso: ferramentas/banda.sh <slug> [etapas]
# etapas (padrão todas): grava preparar voz clipes audio compor render comprimir
set -e
cd "$(dirname "$0")/.."
export BANDA=$1; shift
[ $# -eq 0 ] && set -- grava preparar voz clipes audio compor render comprimir
ETAPAS=($@)
tem() { (( ${ETAPAS[(Ie)$1]} )); }
OUT=renders/tutorial-$BANDA.mp4; DM=renders/tutorial-$BANDA-dm.mp4
if tem grava; then
  FALTA=$(node -e 'const j=require("./bandas/'$BANDA'.json");console.log((j.sem||[]).includes(10)?"":(j.falta||"stones"))')
  for b in chegada sorteio montar nome $FALTA; do node ferramentas/grava.mjs $b > /dev/null 2>&1 || { sleep 3; node ferramentas/grava.mjs $b > /dev/null; }; echo "gravou $b"; done
fi
tem preparar && node ferramentas/preparar.mjs
tem voz && ELEVENLABS_API_KEY_RESERVA=$(cat /Users/andrehz/.elevenlabs-key-reserva) ELEVENLABS_CHAVE=reserva node ferramentas/voz-eleven.mjs
tem clipes && node ferramentas/clipes.mjs
tem audio && node ferramentas/audio.mjs
tem compor && node ferramentas/compor.mjs
tem render && npx --yes hyperframes@0.9.56 render -c tutorial-$BANDA.html -o $OUT --video-frame-format png --fps 30 > renders/render-$BANDA.log 2>&1
if tem comprimir; then
  # 2 passadas mirando 23 MB (limite da DM do Instagram é 25 MB).
  D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $OUT)
  VB=$(python3 -c "print(int(23*8*1024*1024/$D/1000) - 128)")
  P=/private/tmp/claude-501/passlog-$BANDA
  ffmpeg -y -loglevel error -i $OUT -c:v libx264 -preset slow -b:v ${VB}k -pass 1 -passlogfile $P -an -f mp4 /dev/null
  ffmpeg -y -loglevel error -i $OUT -c:v libx264 -preset slow -b:v ${VB}k -pass 2 -passlogfile $P -c:a aac -b:a 128k -movflags +faststart $DM
  ls -la $DM
fi
