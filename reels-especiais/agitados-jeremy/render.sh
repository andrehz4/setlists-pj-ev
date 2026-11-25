#!/bin/zsh
# Compõe mudo + overlay (PNG) + áudio. Uso: ./render.sh
D=/Users/andrehz/Documents/Githubhz/setlists-pj-ev/reels-especiais/agitados-jeremy
VOZ=/Users/andrehz/Documents/Githubhz/setlists-pj-ev/reels-especiais/agitados-overlay/voz/bora-seguir-a-gente-jessica.mp3
cd $D
# prévia COM a música do disco + voz
ffmpeg -v error -y -i saida/jeremy-mudo.mp4 -framerate 30 -i quadros/f%05d.png -ss 58.2 -t 37.2 -i brutos/jeremy.m4a -i $VOZ \
 -filter_complex "[0:v][1:v]overlay=0:0:eof_action=pass,format=yuv420p[v];[2:a]afade=t=out:st=35.6:d=1.6,volume=0.9[m];[3:a]adelay=34900|34900,volume=1.6[vz];[m][vz]amix=inputs=2:duration=first:normalize=0[a]" \
 -map "[v]" -map "[a]" -t 37.2 -c:v libx264 -crf 23 -preset medium -maxrate 12M -bufsize 24M -c:a aac -b:a 160k -movflags +faststart saida/jeremy-previa-com-musica.mp4
# arquivo pra postar SEM a música do disco
ffmpeg -v error -y -i saida/jeremy-mudo.mp4 -framerate 30 -i quadros/f%05d.png -i $VOZ \
 -filter_complex "[0:v][1:v]overlay=0:0:eof_action=pass,format=yuv420p[v];[2:a]adelay=34900|34900,volume=1.6,apad=whole_dur=37.2[a]" \
 -map "[v]" -map "[a]" -t 37.2 -c:v libx264 -crf 23 -preset slow -maxrate 12M -bufsize 24M -c:a aac -b:a 160k -movflags +faststart saida/jeremy-POSTAR-sem-musica.mp4
