#!/bin/zsh
# Instala a tarefa das 11h no Mac (roda de novo pra atualizar). Remover: desinstalar.sh
DEST=/Users/andrehz/Library/LaunchAgents/com.smufdpj.x-kit.plist
launchctl bootout gui/$(id -u) $DEST 2>/dev/null
cp /Users/andrehz/Documents/Githubhz/setlists-pj-ev/scripts/publish/x/mac/com.smufdpj.x-kit.plist $DEST
launchctl bootstrap gui/$(id -u) $DEST && echo "instalado: todo dia às 11h (log: /Users/andrehz/Library/Logs/smufdpj-x-kit.log)"
