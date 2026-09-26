#!/usr/bin/env bash
# Leva o painel de colaboradores deste repo (fonte da verdade) pro backend do Terra Gentil,
# que é o que roda no Railway (serviço perpetual-energy: app da Google Play + fórum + painel).
# Uso: scripts/contrib/sync-terra-gentil.sh [caminho do terra-gentil-app]
# Não commita nem faz push: depois rodar os testes de lá e revisar o git diff.
set -euo pipefail

ORIGEM="$(cd "$(dirname "$0")/../../backend" && pwd)"
DESTINO="${1:-/Users/andrehz/Documents/Githubhz/terra-gentil-app}/backend"
COMMIT="$(git -C "$ORIGEM" rev-parse --short HEAD)"

[ -f "$DESTINO/app/main.py" ] || { echo "ERRO: $DESTINO não parece o backend do Terra Gentil"; exit 1; }
git -C "$ORIGEM" diff --quiet -- app/contrib tests || echo "AVISO: há mudanças não commitadas no painel; o ORIGEM.md vai citar $COMMIT"

# Módulo: cópia espelhada (apaga lá o que foi apagado aqui).
rsync -a --delete --exclude '__pycache__' "$ORIGEM/app/contrib/" "$DESTINO/app/contrib/"
cat > "$DESTINO/app/contrib/ORIGEM.md" <<EOF
# Cópia gerada, NÃO editar aqui

Fonte da verdade: repo andrehz4/setlists-pj-ev, pasta backend/app/contrib (commit $COMMIT).
Mudou algo? Edite lá e rode scripts/contrib/sync-terra-gentil.sh.
EOF

# Testes do painel numa subpasta própria, com conftest que desliga o rate limit do módulo.
mkdir -p "$DESTINO/tests/contrib"
rm -f "$DESTINO"/tests/contrib/test_contrib_*.py
cp "$ORIGEM"/tests/test_contrib_*.py "$DESTINO/tests/contrib/"
touch "$DESTINO/tests/contrib/__init__.py"
cat > "$DESTINO/tests/contrib/conftest.py" <<'EOF'
"""Gerado por scripts/contrib/sync-terra-gentil.sh (repo setlists-pj-ev). Não editar aqui."""
import pytest


@pytest.fixture(autouse=True)
def _sem_rate_limit_do_painel():
    from app.contrib.limite import limiter
    anterior, limiter.enabled = limiter.enabled, False
    yield
    limiter.enabled = anterior
EOF

# Migração (registro; já rodada no Supabase compartilhado).
cp "$ORIGEM/migrations/004_contrib_submissions.sql" "$DESTINO/migrations/"

# O encaixe no main.py é manual (uma vez só); aqui só confere que existe.
if ! grep -q "contrib_settings.ENABLED" "$DESTINO/app/main.py"; then
  echo "FALTA: o encaixe do /contrib no $DESTINO/app/main.py (ver backend/app/contrib/README.md)"
  exit 1
fi
echo "OK: painel $COMMIT copiado pra $DESTINO. Próximo: rodar os testes de lá e revisar o git diff."
