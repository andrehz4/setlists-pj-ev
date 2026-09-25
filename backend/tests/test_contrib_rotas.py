"""Colaboradores: rotas /contrib com banco mockado e app isolado (não depende da flag)."""
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch

import asyncio

import pytest
from fastapi import HTTPException
from fastapi import FastAPI
from starlette.testclient import TestClient

from app.contrib import acesso, membros, routes
from app.contrib.config import contrib_settings as cfg
from app.core.limiter import limiter
from app.services.auth_service import create_jwt

ORIGIN = {"Origin": "https://setlists-pj-ev.pages.dev"}
USER = "00000000-0000-0000-0000-000000000001"
KEY = f"contrib/{USER}/{'a' * 32}.jpg"


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
    for nome, valor in {"R2_ACCOUNT_ID": "acc", "R2_ACCESS_KEY_ID": "ak", "R2_SECRET_ACCESS_KEY": "sk"}.items():
        monkeypatch.setattr(cfg, nome, valor)

    @asynccontextmanager
    async def fake_get_conn():
        yield conn
    app = FastAPI()
    app.state.limiter = limiter
    app.include_router(routes.router, prefix="/contrib")
    app.dependency_overrides[membros.require_membro] = lambda: USER
    with patch.object(routes, "get_conn", fake_get_conn), patch.object(acesso, "get_conn", fake_get_conn):
        yield TestClient(app)


def _auth():
    return {**ORIGIN, "Authorization": f"Bearer {create_jwt(USER)}"}


def _body(**extra):
    return {"title": "Curiosidade do Ten", "body": "Texto com mais de vinte caracteres.",
            "media_keys": [KEY], "agreed_rules": True, **extra}


def _row(slot):
    return {"id": "x", "status": "enviado", "title": "t", "body": "b", "media": f'[{{"key": "{KEY}"}}]',
            "scheduled_at": slot, "reason": None, "created_at": datetime.now(UTC)}


@pytest.mark.parametrize("status", [None, "pendente", "bloqueado"])
def test_so_membro_aprovado_passa(conn, status):
    conn.fetchval.return_value = status

    @asynccontextmanager
    async def fake_get_conn():
        yield conn
    with patch.object(membros, "get_conn", fake_get_conn), pytest.raises(HTTPException) as exc:
        asyncio.run(membros.require_membro(USER))
    assert exc.value.status_code == 403


def test_acesso_com_token_google_invalido_e_401(client):
    with patch.object(acesso.google_id, "_chaves", AsyncMock(return_value={"keys": []})):
        r = client.post("/contrib/acesso", json={"credential": "x" * 30}, headers=_auth())
    assert r.status_code == 401


def test_acesso_vincula_gmail_convidado(client, conn):
    conn.fetchrow.return_value = {"user_id": None, "status": "aprovado"}
    fake = AsyncMock(return_value=("fa@gmail.com", {"name": "Fã"}))
    with patch.object(acesso.google_id, "email_verificado", fake):
        r = client.post("/contrib/acesso", json={"credential": "x" * 30}, headers=_auth())
    assert r.json() == {"status": "aprovado"}


def test_gmail_de_outra_conta_e_409(client, conn):
    conn.fetchrow.return_value = {"user_id": "00000000-0000-0000-0000-000000000009", "status": "aprovado"}
    fake = AsyncMock(return_value=("fa@gmail.com", {}))
    with patch.object(acesso.google_id, "email_verificado", fake):
        r = client.post("/contrib/acesso", json={"credential": "x" * 30}, headers=_auth())
    assert r.status_code == 409


def test_admin_membros_bloqueado_pra_usuario_comum(client):
    r = client.post("/contrib/admin/membros", json={"email": "a@b.com", "status": "aprovado"}, headers=_auth())
    assert r.status_code == 403


def test_upload_devolve_url_assinada_na_pasta_do_usuario(client):
    r = client.post("/contrib/uploads", json={"mime": "image/jpeg", "size": 1000}, headers=_auth())
    assert r.status_code == 200
    assert r.json()["key"].startswith(f"contrib/{USER}/")
    assert "acc.r2.cloudflarestorage.com" in r.json()["upload_url"]


@pytest.mark.parametrize("mime,size,code", [("image/gif", 10, 415), ("image/jpeg", 10**9, 413), ("video/mp4", 10, 415)])
def test_upload_recusa_formato_e_tamanho(client, mime, size, code):
    assert client.post("/contrib/uploads", json={"mime": mime, "size": size}, headers=_auth()).status_code == code


def test_envio_sem_aceitar_regras_e_recusado(client):
    assert client.post("/contrib/submissions", json=_body(agreed_rules=False), headers=_auth()).status_code == 422


def test_envio_com_arquivo_de_outro_usuario_e_recusado(client):
    alheio = f"contrib/00000000-0000-0000-0000-000000000009/{'b' * 32}.jpg"
    r = client.post("/contrib/submissions", json=_body(media_keys=[alheio]), headers=_auth())
    assert r.status_code == 422


def test_limite_diario(client, conn):
    conn.fetchval.return_value = cfg.DAILY_LIMIT
    assert client.post("/contrib/submissions", json=_body(), headers=_auth()).status_code == 429


def test_envio_agenda_no_meia_hora(client, conn):
    conn.fetchval.return_value = 0
    conn.fetch.return_value = []
    conn.fetchrow.side_effect = lambda sql, *args: _row(args[7])
    r = client.post("/contrib/submissions", json=_body(), headers=_auth())
    assert r.status_code == 201, r.text
    slot = datetime.fromisoformat(r.json()["scheduled_at"])
    assert slot.minute == 30 and r.json()["scheduled_label"].endswith("h30")
    assert "pg_advisory_xact_lock" in conn.execute.call_args_list[0].args[0]


def test_cancelar_so_quando_enviado(client, conn):
    conn.fetchval.return_value = "aprovado"
    assert client.delete(f"/contrib/submissions/{USER}", headers=_auth()).status_code == 409
    conn.fetchval.return_value = None
    assert client.delete(f"/contrib/submissions/{USER}", headers=_auth()).status_code == 404


def test_admin_bloqueado_pra_usuario_comum(client):
    assert client.get("/contrib/admin/submissions", headers=_auth()).status_code == 403


def test_app_principal_nao_monta_contrib_sem_flag():
    from app.main import app
    assert not any(getattr(r, "path", "").startswith("/contrib") for r in app.routes)
