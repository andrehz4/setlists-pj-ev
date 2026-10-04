"""Correções da vistoria de 2026-10-03: privacidade, validação na borda e config segura."""
import uuid
from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

ORIGIN = "https://setlists-pj-ev.pages.dev"
DONO = "00000000-0000-0000-0000-000000000001"
OUTRO = "00000000-0000-0000-0000-000000000009"


def _conn_perfil():
    conn = AsyncMock()
    conn.fetchrow = AsyncMock(side_effect=[
        {"id": DONO, "display_name": "Fã", "avatar_url": None, "created_at": "2026-01-01", "bio": "",
         "email": "fa@exemplo.com", "birth_year": None, "city": "", "shows_attended": []},
        {"posts_count": 1, "topics_count": 1, "tava_la_count": 0, "likes_received": 0, "rank_pos": 1},
    ])
    conn.fetch = AsyncMock(return_value=[])

    @asynccontextmanager
    async def get_conn():
        yield conn
    return get_conn


def _token(user_id):
    from app.services.auth_service import create_jwt
    return create_jwt(user_id)


@pytest.mark.parametrize("quem,ve_email", [(None, False), (OUTRO, False), (DONO, True)])
def test_email_do_perfil_so_para_o_dono(client, quem, ve_email):
    headers = {"origin": ORIGIN}
    if quem:
        headers["authorization"] = f"Bearer {_token(quem)}"
    with patch("app.routes.forum.get_conn", _conn_perfil()):
        r = client.get(f"/forum/users/{DONO}", headers=headers)
    assert r.status_code == 200
    assert (r.json()["email"] == "fa@exemplo.com") is ve_email


@pytest.mark.parametrize("url", ["/forum/topics/nao-e-uuid", "/forum/users/123", "/feed/posts/x1"])
def test_id_invalido_vira_422_e_nao_500(client, url):
    assert client.get(url, headers={"origin": ORIGIN}).status_code == 422


@pytest.mark.parametrize("q", ["page=0", "page=-1", "per_page=0", "per_page=500"])
def test_paginacao_do_feed_fora_da_faixa_vira_422(client, q):
    assert client.get(f"/feed/posts?{q}", headers={"origin": ORIGIN}).status_code == 422


@pytest.mark.parametrize("url,ok", [("https://i.imgur.com/a.jpg", True), ("javascript:alert(1)//aaaa", False),
                                    ("http://exemplo.com/a.jpg", False)])
def test_foto_do_feed_so_https(url, ok):
    from pydantic import ValidationError

    from app.schemas.feed import FeedPostCreate
    if ok:
        FeedPostCreate(photo_url=url)
    else:
        with pytest.raises(ValidationError):
            FeedPostCreate(photo_url=url)


def test_producao_exige_jwt_secret_forte():
    from app.core.config import Settings
    with pytest.raises(ValueError, match="JWT_SECRET"):
        Settings(ENVIRONMENT="production", JWT_SECRET="")
    with pytest.raises(ValueError, match="JWT_SECRET"):
        Settings(ENVIRONMENT="production", JWT_SECRET="curto")
    Settings(ENVIRONMENT="production", JWT_SECRET="x" * 32)
    Settings(ENVIRONMENT="development", JWT_SECRET="")


@pytest.mark.parametrize("modulo,funcao", [("app.core.limiter", "_client_ip"), ("app.contrib.limite", "_ip_cliente")])
def test_rate_limit_ip_primeiro_por_padrao_ultimo_por_env(modulo, funcao, monkeypatch):
    import importlib
    f = getattr(importlib.import_module(modulo), funcao)
    req = MagicMock()
    req.headers = {"x-forwarded-for": "1.2.3.4, 200.10.20.30"}
    monkeypatch.delenv("RATE_LIMIT_IP", raising=False)
    assert f(req) == "1.2.3.4"
    monkeypatch.setenv("RATE_LIMIT_IP", "ultimo")
    assert f(req) == "200.10.20.30"


async def test_sub_do_google_vira_uuid_estavel():
    from app.services import auth_service
    conn = AsyncMock()

    @asynccontextmanager
    async def get_conn():
        yield conn
    with patch.object(auth_service, "get_conn", get_conn):
        uid = await auth_service.upsert_user({"sub": "108281234567890123456", "name": "Fã"})
    assert uid == str(uuid.uuid5(uuid.NAMESPACE_URL, "108281234567890123456"))
    assert conn.execute.await_args.args[1] == uid


async def test_token_do_google_validado_com_pyjwt():
    """Assinatura RS256 de verdade contra um JWKS falso: válido passa, audiência errada e kid errado não."""
    import json
    import time

    import jwt
    from cryptography.hazmat.primitives.asymmetric import rsa

    from app.contrib import google_id
    priv = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    jwk = json.loads(jwt.algorithms.RSAAlgorithm.to_jwk(priv.public_key()))
    jwks = {"keys": [{**jwk, "kid": "k1", "use": "sig", "alg": "RS256"}]}
    agora = int(time.time())
    base = {"iss": "https://accounts.google.com", "aud": "cliente", "email": "Fa@Gmail.com",
            "email_verified": True, "sub": "1", "iat": agora, "exp": agora + 600}
    assina = lambda claims, kid="k1": jwt.encode(claims, priv, algorithm="RS256", headers={"kid": kid})  # noqa: E731
    with patch.object(google_id, "_chaves", AsyncMock(return_value=jwks)):
        email, _ = await google_id.email_verificado(assina(base), "cliente")
        assert email == "fa@gmail.com"
        with pytest.raises(ValueError):
            await google_id.email_verificado(assina({**base, "aud": "outro"}), "cliente")
        with pytest.raises(ValueError):
            await google_id.email_verificado(assina(base, kid="k2"), "cliente")


def test_listagem_e_contagem_numeram_placeholders_certo(client):
    conn = AsyncMock()
    conn.fetch = AsyncMock(return_value=[])
    conn.fetchval = AsyncMock(return_value=0)

    @asynccontextmanager
    async def get_conn():
        yield conn
    with patch("app.routes.forum.get_conn", get_conn):
        r = client.get("/forum/topics?category=shows&show_id=pj-2005-12-02&per_page=5&page=2",
                       headers={"origin": ORIGIN})
    assert r.status_code == 200
    sql, *args = conn.fetch.await_args.args
    assert "t.site = $3 AND t.category = $4 AND t.anchor_show_id = $5" in sql
    assert args == [5, 5, "pj", "shows", "pj-2005-12-02"]
    sql_count, *args_count = conn.fetchval.await_args.args
    assert "t.site = $1 AND t.category = $2 AND t.anchor_show_id = $3" in sql_count
    assert args_count == ["pj", "shows", "pj-2005-12-02"]
