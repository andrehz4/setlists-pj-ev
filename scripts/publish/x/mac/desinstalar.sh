#!/bin/zsh
DEST=/Users/andrehz/Library/LaunchAgents/com.smufdpj.x-kit.plist
launchctl bootout gui/$(id -u) $DEST 2>/dev/null; rm -f $DEST && echo "removido"
