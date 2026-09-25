"""Colaboradores: rotas /contrib com banco mockado e app isolado (não depende da flag)."""
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from starlette.testclient import TestClient

from app.contrib import acesso, auth, legenda, routes
from app.contrib.config import contrib_settings as cfg
from app.core.limiter import limiter
from app.services.auth_service import create_jwt

ORIGIN = {"Origin": "https://setlists-pj-ev.pages.dev"}
MEMBRO = auth.membro_id("123")
KEY = f"contrib/{MEMBRO}/{'a' * 32}.jpg"
VIDEO = f"contrib/{MEMBRO}/{'b' * 32}.mp4"


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
    with patch.object(routes, "get_conn", fake_get_conn), patch.object(acesso, "get_conn", fake_get_conn), \
            patch.object(auth, "get_conn", fake_get_conn):
        yield TestClient(app)


def _h(email="fa@gmail.com"):
    return {**ORIGIN, "Authorization": f"Bearer {auth.criar_token(MEMBRO, email)}"}


def _body(**extra):
    return {"title": "Curiosidade do Ten", "body": "Texto com mais de vinte caracteres.",
            "media_keys": [KEY], "agreed_rules": True, **extra}


def _row(slot):
    return {"id": "x", "status": "enviado", "title": "t", "body": "b", "media": f'[{{"key": "{KEY}"}}]',
            "video_opts": None, "scheduled_at": slot, "reason": None, "created_at": datetime.now(UTC)}


def _aprovado(conn, *depois):
    conn.fetchval.side_effect = ["aprovado", *depois]


def test_token_do_forum_nao_vale_no_painel(client):
    h = {**ORIGIN, "Authorization": f"Bearer {create_jwt(MEMBRO)}"}
    assert client.get("/contrib/eu", headers=h).status_code == 401


@pytest.mark.parametrize("status", [None, "pendente", "bloqueado"])
def test_so_membro_aprovado_pede_upload(client, conn, status):
    conn.fetchval.return_value = status
    r = client.post("/contrib/uploads", json={"mime": "image/jpeg", "size": 10}, headers=_h())
    assert r.status_code == 403


def test_admin_passa_sem_cadastro(client):
    r = client.post("/contrib/uploads", json={"mime": "image/jpeg", "size": 10}, headers=_h("eng.andrehz@gmail.com"))
    assert r.status_code == 200 and r.json()["key"].startswith(f"contrib/{MEMBRO}/")


@pytest.mark.parametrize("mime,size,code", [("image/gif", 10, 415), ("image/jpeg", 10**9, 413), ("video/mp4", 10, 415)])
def test_upload_recusa_formato_e_tamanho(client, conn, mime, size, code, monkeypatch):
    monkeypatch.setattr(cfg, "VIDEO_ENABLED", False)
    _aprovado(conn)
    assert client.post("/contrib/uploads", json={"mime": mime, "size": size}, headers=_h()).status_code == code


def test_entrar_com_gmail_convidado_devolve_token(client, conn):
    conn.fetchrow.return_value = {"google_sub": None, "status": "aprovado"}
    fake = AsyncMock(return_value=("fa@gmail.com", {"sub": "123", "name": "Fã", "picture": "javascript:x"}))
    with patch.object(acesso.google_id, "email_verificado", fake):
        r = client.post("/contrib/entrar", json={"credential": "x" * 30}, headers=ORIGIN)
    assert r.json()["status"] == "aprovado" and r.json()["avatar"] is None
    h = {**ORIGIN, "Authorization": f"Bearer {r.json()['token']}"}
    assert client.get("/contrib/admin/membros", headers=h).status_code == 403


def test_entrar_com_gmail_de_outra_conta_e_409(client, conn):
    conn.fetchrow.return_value = {"google_sub": "999", "status": "aprovado"}
    fake = AsyncMock(return_value=("fa@gmail.com", {"sub": "123"}))
    with patch.object(acesso.google_id, "email_verificado", fake):
        assert client.post("/contrib/entrar", json={"credential": "x" * 30}, headers=ORIGIN).status_code == 409


def test_entrar_com_token_google_invalido_e_401(client):
    with patch.object(acesso.google_id, "_chaves", AsyncMock(return_value={"keys": []})):
        assert client.post("/contrib/entrar", json={"credential": "x" * 30}, headers=ORIGIN).status_code == 401


def test_envio_sem_aceitar_regras_e_recusado(client, conn):
    _aprovado(conn)
    assert client.post("/contrib/submissions", json=_body(agreed_rules=False), headers=_h()).status_code == 422


def test_envio_com_arquivo_de_outro_membro_e_recusado(client, conn):
    _aprovado(conn)
    alheio = f"contrib/{auth.membro_id('999')}/{'b' * 32}.jpg"
    assert client.post("/contrib/submissions", json=_body(media_keys=[alheio]), headers=_h()).status_code == 422


def test_trecho_de_video_longo_demais(client, conn, monkeypatch):
    monkeypatch.setattr(cfg, "VIDEO_ENABLED", True)
    _aprovado(conn)
    video = {"trim_start": 0, "trim_end": cfg.MAX_VIDEO_SEG + 5, "estilo": "palavra", "legendas": []}
    r = client.post("/contrib/submissions", json=_body(media_keys=[VIDEO], video=video), headers=_h())
    assert r.status_code == 422 and "segundos" in r.text


def test_estilo_de_legenda_desconhecido(client, conn):
    _aprovado(conn)
    video = {"trim_start": 0, "trim_end": 10, "estilo": "neon", "legendas": []}
    assert client.post("/contrib/submissions", json=_body(video=video), headers=_h()).status_code == 422


def test_limite_diario(client, conn):
    _aprovado(conn, cfg.DAILY_LIMIT)
    assert client.post("/contrib/submissions", json=_body(), headers=_h()).status_code == 429


def test_envio_agenda_no_meia_hora(client, conn):
    _aprovado(conn, 0)
    conn.fetch.return_value = []
    conn.fetchrow.side_effect = lambda sql, *args: _row(args[7])
    r = client.post("/contrib/submissions", json=_body(), headers=_h())
    assert r.status_code == 201, r.text
    assert datetime.fromisoformat(r.json()["scheduled_at"]).minute == 30
    assert "pg_advisory_xact_lock" in conn.execute.call_args_list[0].args[0]


def test_cancelar_so_quando_enviado(client, conn):
    _aprovado(conn, "aprovado")
    assert client.delete(f"/contrib/submissions/{MEMBRO}", headers=_h()).status_code == 409


def test_legenda_sem_configuracao_e_503(client, conn):
    _aprovado(conn)
    assert client.post("/contrib/legenda", content=b"RIFFxxxx", headers=_h()).status_code == 503


def test_normalizar_resposta_do_whisper():
    r = legenda.normalizar({"segments": [
        {"start": 0.0, "end": 2.5, "text": " Em 1991 saiu o Ten. ", "avg_logprob": -0.2,
         "words": [{"word": " Em", "start": 0.0, "end": 0.3}, {"word": " ", "start": 0.3, "end": 0.3}]},
        {"start": 2.5, "end": 3.0, "text": "  "},
        {"start": 3.0, "end": 5.0, "text": "Mookie Blaylock", "avg_logprob": -1.2},
    ]})
    assert [t["text"] for t in r] == ["Em 1991 saiu o Ten.", "Mookie Blaylock"]
    assert r[0]["words"] == [{"w": "Em", "s": 0.0, "e": 0.3}]
    assert [t["duvida"] for t in r] == [False, True]


def test_app_principal_nao_monta_contrib_sem_flag():
    from app.main import app
    assert not any(getattr(r, "path", "").startswith("/contrib") for r in app.routes)


def test_video_ligado_aceita_mp4(client, conn):
    _aprovado(conn)
    r = client.post("/contrib/uploads", json={"mime": "video/mp4", "size": 50_000_000}, headers=_h())
    assert r.status_code == 200 and r.json()["key"].endswith(".mp4")


@pytest.mark.parametrize("entrada,saida", [
    ("@Fulano.PJ ", "fulano.pj"), ("https://instagram.com/eddie_fa/", "eddie_fa"), ("", None), (None, None),
])
def test_normaliza_instagram(entrada, saida):
    from app.contrib.perfil import normalizar_instagram
    assert normalizar_instagram(entrada) == saida


@pytest.mark.parametrize("ruim", ["fulano..pj", ".fulano", "fulano.", "nome com espaço", "a" * 31, "@x<script>"])
def test_instagram_invalido(ruim):
    from app.contrib.perfil import normalizar_instagram
    with pytest.raises(ValueError):
        normalizar_instagram(ruim)


def test_salvar_perfil(client, conn):
    from app.contrib import perfil
    _aprovado(conn, "aprovado")

    @asynccontextmanager
    async def fake_get_conn():
        yield conn
    with patch.object(perfil, "get_conn", fake_get_conn):
        assert client.post("/contrib/perfil", json={"instagram": "@Marina.PJ"}, headers=_h()).json() == {"instagram": "marina.pj"}
        assert client.post("/contrib/perfil", json={"instagram": "x..y"}, headers=_h()).status_code == 422
