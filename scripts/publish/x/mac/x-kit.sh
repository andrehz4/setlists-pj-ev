#!/bin/zsh
# Tarefa das 11h (launchd, com.smufdpj.x-kit): monta o kit do X, avisa e abre o Claude com /x-hoje.
REPO=/Users/andrehz/Documents/Githubhz/setlists-pj-ev
LOG=/Users/andrehz/Library/Logs/smufdpj-x-kit.log
echo "=== $(date) ===" >> $LOG
cd $REPO && /opt/homebrew/bin/node scripts/publish/x/kit-do-dia.mjs >> $LOG 2>&1
RESUMO=$(cat "$REPO/.x-kit/$(date +%F)/resumo.txt" 2>/dev/null)
if [ -z "$RESUMO" ] || [[ "$RESUMO" == 0\ notícia* && "$RESUMO" != *cápsula* ]]; then
  osascript -e 'display notification "Nada novo pra postar no X hoje." with title "Kit do X"'
  exit 0
fi
osascript -e "display notification \"$RESUMO\" with title \"Kit do X pronto\" sound name \"Glass\""
osascript -e "tell application \"Terminal\" to do script \"cd $REPO && /Users/andrehz/.local/bin/claude /x-hoje\"" -e 'tell application "Terminal" to activate'
