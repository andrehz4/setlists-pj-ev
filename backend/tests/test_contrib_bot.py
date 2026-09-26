"""Colaboradores: rotas do robô de curadoria (/contrib/bot/*)."""
import json
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from starlette.testclient import TestClient

from app.contrib import bot, bot_publicar, routes
from app.contrib.config import contrib_settings as cfg
from app.contrib.limite import limiter

CHAVE = {"X-Bot-Key": "segredo-do-robo"}
ID = "00000000-0000-0000-0000-00000000000a"


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
    monkeypatch.setattr(cfg, "BOT_KEY", "segredo-do-robo")

    @asynccontextmanager
    async def fake_get_conn():
        yield conn
    app = FastAPI()
    app.state.limiter = limiter
    app.include_router(routes.router, prefix="/contrib")
    with patch.object(bot, "get_conn", fake_get_conn), patch.object(bot_publicar, "get_conn", fake_get_conn):
        yield TestClient(app)


def _veredito(**extra):
    return {"decisao": "ajustado", "titulo": "O Ten em 1991", "texto": "Texto corrigido com mais de vinte letras.",
            "legendas": [{"start": 0, "end": 2, "text": "Em 1991 saiu o Ten."}], "motivo": "Corrigimos o ano.",
            "analise": {"regras": {}}, **extra}


@pytest.mark.parametrize("headers", [{}, {"X-Bot-Key": "errada"}])
def test_sem_chave_certa_e_403(client, headers):
    assert client.get("/contrib/bot/fila", headers=headers).status_code == 403


def test_sem_chave_configurada_tudo_fechado(client, monkeypatch):
    monkeypatch.setattr(cfg, "BOT_KEY", "")
    assert client.get("/contrib/bot/fila", headers={"X-Bot-Key": ""}).status_code == 403


def test_fila_traz_midia_video_e_autor(client, conn):
    conn.fetch.return_value = [{
        "id": ID, "title": "t", "body": "b", "media": '[{"key": "contrib/x/a.mp4"}]',
        "video_opts": '{"estilo": "palavra", "legendas": []}', "scheduled_at": datetime(2026, 9, 25, 18, 30, tzinfo=UTC),
        "nome": "Marina", "email": "m@gmail.com", "instagram": "marina.pj",
    }]
    item = client.get("/contrib/bot/fila", headers=CHAVE).json()[0]
    assert item["video"]["estilo"] == "palavra" and item["autor"] == {"nome": "Marina", "email": "m@gmail.com", "instagram": "marina.pj"}
    assert item["media"][0]["key"] == "contrib/x/a.mp4"


def test_veredito_ajustado_guarda_original_e_troca_legenda(client, conn):
    conn.fetchrow.return_value = {"status": "enviado", "title": "O Ten em 1992", "body": "orig",
                                  "video_opts": '{"estilo": "faixa", "legendas": [{"start": 0, "end": 2, "text": "em 92"}]}'}
    r = client.post(f"/contrib/bot/veredito/{ID}", json=_veredito(), headers=CHAVE)
    assert r.status_code == 200, r.text
    args = conn.execute.call_args.args
    video, analise = json.loads(args[5]), json.loads(args[7])
    assert args[2] == "ajustado" and args[3] == "O Ten em 1991"
    assert video == {"estilo": "faixa", "legendas": [{"start": 0.0, "end": 2.0, "text": "Em 1991 saiu o Ten."}]}
    assert analise["original"] == {"title": "O Ten em 1992", "body": "orig", "legendas": [{"start": 0, "end": 2, "text": "em 92"}]}


def test_veredito_em_envio_ja_decidido_e_409(client, conn):
    conn.fetchrow.return_value = {"status": "cancelado", "title": "t", "body": "b", "video_opts": None}
    assert client.post(f"/contrib/bot/veredito/{ID}", json=_veredito(), headers=CHAVE).status_code == 409
    conn.execute.assert_not_called()


def test_veredito_de_envio_inexistente_e_404(client, conn):
    conn.fetchrow.return_value = None
    assert client.post(f"/contrib/bot/veredito/{ID}", json=_veredito(), headers=CHAVE).status_code == 404


def test_decisao_invalida_e_422(client):
    assert client.post(f"/contrib/bot/veredito/{ID}", json=_veredito(decisao="publicado"), headers=CHAVE).status_code == 422


def test_pedidos_novos(client, conn):
    conn.fetch.return_value = [{"email": "m@gmail.com", "nome": "Marina", "pedido_em": datetime(2026, 9, 25, tzinfo=UTC)}]
    assert client.get("/contrib/bot/pedidos", headers=CHAVE).json()[0]["email"] == "m@gmail.com"


def test_contagem_sem_efeito_colateral(client, conn):
    conn.fetchrow.return_value = {"fila": 2, "pedidos": 1}
    assert client.get("/contrib/bot/contagem", headers=CHAVE).json() == {"fila": 2, "pedidos": 1}
    conn.execute.assert_not_called()


def _pronto(key="contrib/x/a.jpg", verdict=None):
    return {"id": ID, "status": "aprovado", "title": "t", "body": "b", "media": json.dumps([{"key": key}]),
            "video_opts": '{"estilo": "faixa"}' if key.endswith(".mp4") else None,
            "scheduled_at": datetime(2026, 9, 25, 18, 30, tzinfo=UTC), "ai_verdict": verdict, "nome": "Marina", "instagram": None}


def test_prontos_traz_foto_e_video_com_a_receita(client, conn):
    conn.fetch.return_value = [_pronto(), _pronto(key="contrib/x/b.mp4")]
    r = client.get("/contrib/bot/prontos", headers=CHAVE).json()
    assert len(r) == 2 and r[0]["video"] is None and r[1]["video"] == {"estilo": "faixa"}


def test_render_devolve_put_e_get_do_mp4(client, monkeypatch):
    for nome, valor in {"R2_ACCOUNT_ID": "acc", "R2_ACCESS_KEY_ID": "ak", "R2_SECRET_ACCESS_KEY": "sk"}.items():
        monkeypatch.setattr(cfg, nome, valor)
    r = client.post(f"/contrib/bot/render/{'0' * 8}-0000-0000-0000-{'0' * 12}", headers=CHAVE).json()
    assert r["key"].endswith(".mp4") and "X-Amz-Expires=7200" in r["get_url"]
    assert "content-type" in r["put_url"].lower()


def test_prontos_traz_tentativa_anterior(client, conn):
    conn.fetch.return_value = [_pronto(verdict='{"publicacao": {"caption": "c", "tentativa_em": "x"}}')]
    assert client.get("/contrib/bot/prontos", headers=CHAVE).json()[0]["publicacao"]["caption"] == "c"


def test_tentativa_e_publicado_so_em_envio_aprovado(client, conn):
    conn.execute.return_value = "UPDATE 0"
    assert client.post(f"/contrib/bot/publicando/{ID}", json={"caption": "c"}, headers=CHAVE).status_code == 409
    conn.execute.return_value = "UPDATE 1"
    assert client.post(f"/contrib/bot/publicando/{ID}", json={"caption": "c"}, headers=CHAVE).status_code == 200
    r = client.post(f"/contrib/bot/publicado/{ID}", json={"site_id": "colab-0000000a", "ig_post_id": "1"}, headers=CHAVE)
    assert r.json()["status"] == "publicado"


def test_publicado_exige_id_de_site_valido(client):
    r = client.post(f"/contrib/bot/publicado/{ID}", json={"site_id": "../../index"}, headers=CHAVE)
    assert r.status_code == 422


def test_rotas_de_publicacao_exigem_chave(client):
    assert client.get("/contrib/bot/prontos").status_code == 403


def test_render_recusa_id_que_nao_e_uuid(client):
    assert client.post("/contrib/bot/render/..%2F..%2Findex", headers=CHAVE).status_code in (404, 422)
    assert client.post("/contrib/bot/render/nao-e-uuid", headers=CHAVE).status_code == 422
