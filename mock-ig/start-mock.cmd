@echo off
chcp 65001 >nul
title mock-ig - Instagram fake local
cd /d "C:\Gitlab_hz\pearljam\setlists-pj-ev"

echo ============================================
echo   mock-ig (Instagram fake local)
echo ============================================
echo.

REM 0) Sincroniza os dados do Actions (fila, posts, slides) com o origin.
REM Atualiza so media/news (o que o mock le), sem mexer no HEAD nem arriscar
REM travar num conflito de rebase. Assim o mock sempre reflete o ultimo commit
REM do bot, mesmo com a janela ja aberta.
echo [0/2] Sincronizando dados do Actions (git fetch + media/news)...
git fetch origin main --quiet
git checkout origin/main -- media/news 2>nul
if errorlevel 1 (
  echo [aviso] nao consegui sincronizar media/news (sem rede ou git?). Segue com o estado local.
) else (
  echo [ok] dados atualizados ate o ultimo commit do origin.
)
echo.

REM 1) Ja tem um mock rodando na 8788? Entao so abre o navegador e sai.
netstat -ano | findstr "127.0.0.1:8788" | findstr LISTENING >nul
if not errorlevel 1 (
  echo [mock-ig] Ja esta rodando em http://127.0.0.1:8788
  echo Abrindo o navegador...
  start "" http://127.0.0.1:8788/
  timeout /t 2 >nul
  exit /b 0
)

REM 1) Atualiza o front com o codigo mais recente (vite build, ~10s)
echo [1/2] Atualizando o front (vite build)...
pushd mock-ig\web
call npm run build
if errorlevel 1 (
  echo.
  echo [ERRO] Falha no build do front. Tente: cd mock-ig\web ^&^& npm install
  echo Pressione uma tecla pra fechar.
  pause >nul
  exit /b 1
)
popd

echo.
echo [2/2] Subindo o servidor em http://127.0.0.1:8788
echo Deixe esta janela ABERTA. Feche-a (ou Ctrl+C) pra derrubar o mock.
echo.

REM Abre o navegador depois de 3s, em paralelo, enquanto o server sobe
start "" /min cmd /c "timeout /t 3 >nul & start "" http://127.0.0.1:8788/"

REM Sobe o server (fica em foreground; segura a janela)
node mock-ig\server.mjs

echo.
echo [mock-ig] Servidor encerrado. Pressione uma tecla pra fechar.
pause >nul
