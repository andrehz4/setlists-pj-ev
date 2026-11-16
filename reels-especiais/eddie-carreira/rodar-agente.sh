#!/bin/zsh
# Dispara o agente Fable do estudo da carreira (sessão nova do Claude, sem tela). Log em rodar-agente.log.
D=/Users/andrehz/Documents/Githubhz/setlists-pj-ev/reels-especiais/eddie-carreira
cd "$D" || exit 1
if [ ! -s /Users/andrehz/.setlistfm-key ]; then echo "$(date) sem chave em /Users/andrehz/.setlistfm-key, não rodei" >> "$D/rodar-agente.log"; exit 1; fi
echo "$(date) coleta começou" >> "$D/rodar-agente.log"
SETLISTFM_API_KEY=$(cat /Users/andrehz/.setlistfm-key) node "$D/coletar.mjs" "$D/bruto" >> "$D/rodar-agente.log" 2>&1 || { echo "$(date) coleta falhou, agente não rodou" >> "$D/rodar-agente.log"; exit 1; }
echo "$(date) agente começou" >> "$D/rodar-agente.log"
claude -p --model claude-fable-5-2 --permission-mode acceptEdits \
  --allowedTools "Read" "Write" "Edit" "Glob" "Grep" "Bash(node:*)" "Bash(mkdir:*)" "Bash(ls:*)" "Bash(head:*)" "Bash(wc:*)" "Bash(cat:*)" "Bash(jq:*)" "Bash(test:*)" \
  < <(echo "Leia e execute o arquivo $D/BRIEF-AGENTE.md do começo ao fim.") >> "$D/rodar-agente.log" 2>&1
echo "$(date) terminou (código $?)" >> "$D/rodar-agente.log"
afplay /System/Library/Sounds/Glass.aiff
