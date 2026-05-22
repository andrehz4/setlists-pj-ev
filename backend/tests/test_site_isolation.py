"""
Testes de isolamento de site.

Garante que um request vindo do domínio PJ nunca lê/escreve dados do
terra-gentil, e vice-versa. É o contrato mais crítico do backend.
"""
from unittest.mock import AsyncMock, patch

import pytest
from starlette.requests import Request
from starlette.testclient import TestClient

# ── Testes de _resolve_site (pura, sem DB) ──────────────────────────────────

class TestResolveSite:
    def _make_request(self, origin: str, environment: str = "test") -> Request:
        scope = {
            "type": "http",
            "method": "GET",
            "path": "/forum/topics",
            "headers": [(b"origin", origin.encode())] if origin else [],
        }
        return Request(scope)

    def test_pj_origin_retorna_pj(self):
        from app.routes.forum import _resolve_site
        req = self._make_request("https://setlists-pj-ev.pages.dev")
        assert _resolve_site(req) == "pj"

    def test_terra_gentil_origin_retorna_terra_gentil(self):
        from app.routes.forum import _resolve_site
        req = self._make_request("https://terra-gentil.pages.dev")
        assert _resolve_site(req) == "terra-gentil"

    def test_origem_desconhecida_levanta_403(self):
        from fastapi import HTTPException

        from app.routes.forum import _resolve_site
        req = self._make_request("https://site-malicioso.com")
        with pytest.raises(HTTPException) as exc:
            _resolve_site(req)
        assert exc.value.status_code == 403

    def test_sem_origin_em_producao_levanta_403(self):
        from fastapi import HTTPException

        import app.core.config as cfg
        from app.routes.forum import _resolve_site
        original = cfg.settings.ENVIRONMENT
        cfg.settings.ENVIRONMENT = "production"
        try:
            req = self._make_request("")
            with pytest.raises(HTTPException) as exc:
                _resolve_site(req)
            assert exc.value.status_code == 403
        finally:
            cfg.settings.ENVIRONMENT = original

    def test_sem_origin_em_development_retorna_pj(self):
        import app.core.config as cfg
        from app.routes.forum import _resolve_site
        original = cfg.settings.ENVIRONMENT
        cfg.settings.ENVIRONMENT = "development"
        try:
            req = self._make_request("")
            assert _resolve_site(req) == "pj"
        finally:
            cfg.settings.ENVIRONMENT = original


# ── Testes de config.site_origin_map ────────────────────────────────────────

class TestSiteOriginMap:
    def test_parse_dois_sites(self):
        from app.core.config import Settings
        s = Settings(
            SITE_ORIGINS="https://pj.com=pj,https://tg.com=terra-gentil",
            _env_file=None,
        )
        assert s.site_origin_map == {
            "https://pj.com": "pj",
            "https://tg.com": "terra-gentil",
        }

    def test_parse_um_site(self):
        from app.core.config import Settings
        s = Settings(SITE_ORIGINS="https://pj.com=pj", _env_file=None)
        assert s.site_origin_map == {"https://pj.com": "pj"}

    def test_entrada_malformada_ignorada(self):
        from app.core.config import Settings
        s = Settings(SITE_ORIGINS="invalido,https://pj.com=pj", _env_file=None)
        assert "https://pj.com" in s.site_origin_map
        assert "invalido" not in s.site_origin_map


# ── Testes de endpoint com DB mockado ────────────────────────────────────────

class TestListTopicsIsolation:
    """GET /forum/topics deve filtrar por site derivado do Origin."""

    def _mock_conn(self, rows=None, total=0):
        conn = AsyncMock()
        conn.fetch = AsyncMock(return_value=rows or [])
        conn.fetchval = AsyncMock(return_value=total)
        return conn

    def test_pj_origin_busca_com_site_pj(self, client: TestClient):
        """Confirma que a query usa site='pj' quando Origin é o domínio PJ."""
        captured_args = []

        async def fake_fetch(query, *args):
            captured_args.extend(args)
            return []

        async def fake_fetchval(query, *args):
            return 0

        mock_conn = AsyncMock()
        mock_conn.fetch = fake_fetch
        mock_conn.fetchval = fake_fetchval

        from contextlib import asynccontextmanager

        @asynccontextmanager
        async def fake_get_conn():
            yield mock_conn

        with patch("app.routes.forum.get_conn", fake_get_conn):
            resp = client.get(
                "/forum/topics",
                headers={"origin": "https://setlists-pj-ev.pages.dev"},
            )
        assert resp.status_code == 200
        assert "pj" in captured_args

    def test_terra_gentil_origin_busca_com_site_terra_gentil(self, client: TestClient):
        captured_args = []

        async def fake_fetch(query, *args):
            captured_args.extend(args)
            return []

        async def fake_fetchval(query, *args):
            return 0

        mock_conn = AsyncMock()
        mock_conn.fetch = fake_fetch
        mock_conn.fetchval = fake_fetchval

        from contextlib import asynccontextmanager

        @asynccontextmanager
        async def fake_get_conn():
            yield mock_conn

        with patch("app.routes.forum.get_conn", fake_get_conn):
            resp = client.get(
                "/forum/topics",
                headers={"origin": "https://terra-gentil.pages.dev"},
            )
        assert resp.status_code == 200
        assert "terra-gentil" in captured_args

    def test_origem_invalida_retorna_403(self, client: TestClient):
        resp = client.get(
            "/forum/topics",
            headers={"origin": "https://hacker.io"},
        )
        assert resp.status_code == 403

    def test_topic_de_outro_site_retorna_404(self, client: TestClient, valid_token: str):
        """Tópico criado no site PJ não pode ser lido via origin terra-gentil."""
        mock_conn = AsyncMock()
        mock_conn.fetchrow = AsyncMock(return_value=None)

        from contextlib import asynccontextmanager

        @asynccontextmanager
        async def fake_get_conn():
            yield mock_conn

        with patch("app.routes.forum.get_conn", fake_get_conn):
            resp = client.get(
                "/forum/topics/00000000-0000-0000-0000-000000000099",
                headers={"origin": "https://terra-gentil.pages.dev"},
            )
        assert resp.status_code == 404


# ── Testes de JWT ────────────────────────────────────────────────────────────

class TestJWT:
    def test_token_valido_decodifica(self):
        from app.services.auth_service import create_jwt, verify_jwt
        token = create_jwt("user-123")
        payload = verify_jwt(token)
        assert payload["user_id"] == "user-123"

    def test_token_invalido_levanta_401(self):
        from fastapi import HTTPException

        from app.services.auth_service import verify_jwt
        with pytest.raises(HTTPException) as exc:
            verify_jwt("token.invalido.aqui")
        assert exc.value.status_code == 401

    def test_token_adulterado_levanta_401(self):
        from fastapi import HTTPException

        from app.services.auth_service import create_jwt, verify_jwt
        token = create_jwt("user-123") + "adulterado"
        with pytest.raises(HTTPException) as exc:
            verify_jwt(token)
        assert exc.value.status_code == 401


# ── Testes de isolamento do Feed ─────────────────────────────────────────────

class TestFeedIsolation:
    """GET /feed/posts deve filtrar por site derivado do Origin."""

    def test_pj_origin_busca_com_site_pj(self, client: TestClient):
        captured_args = []

        async def fake_fetch(query, *args):
            captured_args.extend(args)
            return []

        async def fake_fetchval(query, *args):
            return 0

        mock_conn = AsyncMock()
        mock_conn.fetch = fake_fetch
        mock_conn.fetchval = fake_fetchval

        from contextlib import asynccontextmanager

        @asynccontextmanager
        async def fake_get_conn():
            yield mock_conn

        with patch("app.routes.feed.get_conn", fake_get_conn):
            resp = client.get(
                "/feed/posts",
                headers={"origin": "https://setlists-pj-ev.pages.dev"},
            )
        assert resp.status_code == 200
        assert "pj" in captured_args

    def test_terra_gentil_origin_busca_com_site_terra_gentil(self, client: TestClient):
        captured_args = []

        async def fake_fetch(query, *args):
            captured_args.extend(args)
            return []

        async def fake_fetchval(query, *args):
            return 0

        mock_conn = AsyncMock()
        mock_conn.fetch = fake_fetch
        mock_conn.fetchval = fake_fetchval

        from contextlib import asynccontextmanager

        @asynccontextmanager
        async def fake_get_conn():
            yield mock_conn

        with patch("app.routes.feed.get_conn", fake_get_conn):
            resp = client.get(
                "/feed/posts",
                headers={"origin": "https://terra-gentil.pages.dev"},
            )
        assert resp.status_code == 200
        assert "terra-gentil" in captured_args

    def test_origem_invalida_retorna_403(self, client: TestClient):
        resp = client.get(
            "/feed/posts",
            headers={"origin": "https://hacker.io"},
        )
        assert resp.status_code == 403

    def test_post_de_outro_site_retorna_404(self, client: TestClient, valid_token: str):
        """Post criado no site PJ nao pode ser lido via origin terra-gentil."""
        mock_conn = AsyncMock()
        mock_conn.fetchrow = AsyncMock(return_value=None)
        mock_conn.fetch = AsyncMock(return_value=[])

        from contextlib import asynccontextmanager

        @asynccontextmanager
        async def fake_get_conn():
            yield mock_conn

        with patch("app.routes.feed.get_conn", fake_get_conn):
            resp = client.get(
                "/feed/posts/00000000-0000-0000-0000-000000000099",
                headers={
                    "origin": "https://terra-gentil.pages.dev",
                    "authorization": f"Bearer {valid_token}",
                },
            )
        assert resp.status_code == 404

    def test_like_post_outro_site_retorna_404(self, client: TestClient, valid_token: str):
        """Toggle like em post de outro site deve retornar 404."""
        mock_conn = AsyncMock()
        mock_conn.fetchval = AsyncMock(return_value=None)

        from contextlib import asynccontextmanager

        @asynccontextmanager
        async def fake_get_conn():
            yield mock_conn

        with patch("app.routes.feed.get_conn", fake_get_conn):
            resp = client.post(
                "/feed/posts/00000000-0000-0000-0000-000000000099/likes",
                headers={
                    "origin": "https://terra-gentil.pages.dev",
                    "authorization": f"Bearer {valid_token}",
                },
            )
        assert resp.status_code == 404
