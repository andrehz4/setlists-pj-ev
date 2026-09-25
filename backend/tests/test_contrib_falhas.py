"""Colaboradores: contador de falhas do robô (/contrib/bot/falha)."""
import json
from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from starlette.testclient import TestClient

from app.contrib import bot_falhas, routes
from app.contrib.config import contrib_settings as cfg
from app.core.limiter import limiter

CHAVE = {"X-Bot-Key": "segredo"}
ID = "00000000-0000-0000-0000-00000000000b"


@pytest.fixture
def conn():
    c = AsyncMock()

    @asynccontextmanager
    async def _txn():
        yield c
    c.transaction = lambda *a, **k: _txn()
    return c


@pytest.fixture
def client(conn, monkeypatch):
    monkeypatch.setattr(cfg, "BOT_KEY", "segredo")

    @asynccontextmanager
    async def fake_get_conn():
        yield conn
    app = FastAPI()
    app.state.limiter = limiter
    app.include_router(routes.router, prefix="/contrib")
    with patch.object(bot_falhas, "get_conn", fake_get_conn):
        yield TestClient(app)


def _falha(client, etapa="curadoria"):
    return client.post(f"/contrib/bot/falha/{ID}", json={"etapa": etapa, "erro": "ffmpeg quebrou"}, headers=CHAVE)


def test_primeira_falha_conta_e_nao_desiste(client, conn):
    conn.fetchrow.return_value = {"status": "enviado", "ai_verdict": None}
    r = _falha(client).json()
    assert r == {"tentativas": 1, "desistiu": False, "limite": 3}
    args = conn.execute.call_args.args
    assert json.loads(args[2])["falhas"] == {"curadoria": 1} and args[3] is False


def test_no_limite_desiste_e_recusa_com_motivo(client, conn):
    conn.fetchrow.return_value = {"status": "enviado", "ai_verdict": '{"falhas": {"curadoria": 2}}'}
    r = _falha(client).json()
    assert r["desistiu"] is True and r["tentativas"] == 3
    args = conn.execute.call_args.args
    assert args[3] is True and "problema técnico" in args[4]


def test_publicacao_tem_limite_proprio(client, conn):
    conn.fetchrow.return_value = {"status": "aprovado", "ai_verdict": '{"falhas": {"curadoria": 2, "publicacao": 3}}'}
    r = _falha(client, "publicacao").json()
    assert r == {"tentativas": 4, "desistiu": False, "limite": 5}


def test_envio_ja_encerrado_nao_conta(client, conn):
    conn.fetchrow.return_value = {"status": "publicado", "ai_verdict": None}
    assert _falha(client).json()["status"] == "publicado"
    conn.execute.assert_not_called()


def test_etapa_invalida_e_422(client):
    assert _falha(client, "render").status_code == 422
