"""
Testes de funcionalidades do chat/forum.

Cobre: criar topico, criar resposta, listar topicos, visualizar topico,
       fotos em base64, reports, autenticacao e limites de tamanho.
"""
import pytest
from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, patch
from starlette.testclient import TestClient


@pytest.fixture(autouse=True)
def reset_rate_limit():
    """Reseta o storage do SlowAPI entre cada teste para evitar 429 falso."""
    from app.core.limiter import limiter
    try:
        limiter._storage.reset()
    except Exception:
        pass
    yield
    try:
        limiter._storage.reset()
    except Exception:
        pass


ORIGIN_PJ = "https://setlists-pj-ev.pages.dev"
TOPIC_ID = "00000000-0000-0000-0000-000000000001"
POST_ID = "00000000-0000-0000-0000-000000000002"


def _fake_topic_row():
    return {
        "id": TOPIC_ID,
        "title": "Show em São Paulo",
        "body": "Quem vai ao show?",
        "category": "shows",
        "site": "pj",
        "pinned": False,
        "created_at": "2026-05-22T10:00:00",
        "last_post_at": "2026-05-22T10:00:00",
    }


def _fake_user_row():
    return {"display_name": "Test User", "avatar_url": None}


def _fake_topic_full_row():
    return {
        "id": TOPIC_ID,
        "title": "Show em São Paulo",
        "body": "Quem vai ao show?",
        "category": "shows",
        "site": "pj",
        "display_name": "Test User",
        "avatar_url": None,
        "pinned": False,
        "created_at": "2026-05-22T10:00:00",
        "last_post_at": "2026-05-22T10:00:00",
        "reply_count": 0,
    }


def _fake_post_row():
    return {
        "id": POST_ID,
        "topic_id": TOPIC_ID,
        "body": "Vou sim!",
        "site": "pj",
        "created_at": "2026-05-22T11:00:00",
    }


def _make_get_conn(mock_conn):
    @asynccontextmanager
    async def fake_get_conn():
        yield mock_conn
    return fake_get_conn


# ── Criar Topico ─────────────────────────────────────────────────────────────

class TestCriarTopico:
    """POST /forum/topics"""

    def _mock_insert(self, mock_conn):
        mock_conn.fetchrow = AsyncMock(side_effect=[_fake_topic_row(), _fake_user_row()])

    def test_sucesso_texto_simples(self, client: TestClient, valid_token: str):
        mock_conn = AsyncMock()
        self._mock_insert(mock_conn)
        with patch("app.routes.forum.get_conn", _make_get_conn(mock_conn)):
            resp = client.post(
                "/forum/topics",
                json={"title": "Show em São Paulo", "body": "Quem vai ao show?", "category": "shows"},
                headers={"origin": ORIGIN_PJ, "authorization": f"Bearer {valid_token}"},
            )
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Show em São Paulo"
        assert data["category"] == "shows"
        assert "id" in data

    def test_titulo_muito_curto_retorna_422(self, client: TestClient, valid_token: str):
        resp = client.post(
            "/forum/topics",
            json={"title": "AB", "body": "Corpo com pelo menos dez chars.", "category": "geral"},
            headers={"origin": ORIGIN_PJ, "authorization": f"Bearer {valid_token}"},
        )
        assert resp.status_code == 422

    def test_titulo_muito_longo_retorna_422(self, client: TestClient, valid_token: str):
        resp = client.post(
            "/forum/topics",
            json={"title": "A" * 121, "body": "Corpo com pelo menos dez chars.", "category": "geral"},
            headers={"origin": ORIGIN_PJ, "authorization": f"Bearer {valid_token}"},
        )
        assert resp.status_code == 422

    def test_titulo_exato_120_chars_aceito(self, client: TestClient, valid_token: str):
        mock_conn = AsyncMock()
        self._mock_insert(mock_conn)
        with patch("app.routes.forum.get_conn", _make_get_conn(mock_conn)):
            resp = client.post(
                "/forum/topics",
                json={"title": "A" * 120, "body": "Corpo com pelo menos dez chars.", "category": "geral"},
                headers={"origin": ORIGIN_PJ, "authorization": f"Bearer {valid_token}"},
            )
        assert resp.status_code == 201

    def test_corpo_muito_curto_retorna_422(self, client: TestClient, valid_token: str):
        resp = client.post(
            "/forum/topics",
            json={"title": "Titulo valido aqui", "body": "curto", "category": "geral"},
            headers={"origin": ORIGIN_PJ, "authorization": f"Bearer {valid_token}"},
        )
        assert resp.status_code == 422

    def test_corpo_acima_de_200000_retorna_422(self, client: TestClient, valid_token: str):
        resp = client.post(
            "/forum/topics",
            json={"title": "Titulo valido aqui", "body": "A" * 200001, "category": "geral"},
            headers={"origin": ORIGIN_PJ, "authorization": f"Bearer {valid_token}"},
        )
        assert resp.status_code == 422

    def test_sem_auth_retorna_401(self, client: TestClient):
        resp = client.post(
            "/forum/topics",
            json={"title": "Titulo valido aqui", "body": "Corpo com pelo menos dez chars.", "category": "geral"},
            headers={"origin": ORIGIN_PJ},
        )
        assert resp.status_code == 401

    def test_origin_invalida_retorna_403(self, client: TestClient, valid_token: str):
        resp = client.post(
            "/forum/topics",
            json={"title": "Titulo valido aqui", "body": "Corpo com pelo menos dez chars.", "category": "geral"},
            headers={"origin": "https://hacker.io", "authorization": f"Bearer {valid_token}"},
        )
        assert resp.status_code == 403

    def test_com_foto_base64_aceito(self, client: TestClient, valid_token: str):
        """Topico com foto JPEG em base64 (~40KB) deve ser aceito apos fix do max_length."""
        fake_b64 = "data:image/jpeg;base64," + ("A" * 40000)
        body = f"Confira a foto!\n\n[img]{fake_b64}[/img]"
        assert len(body) < 200000
        mock_conn = AsyncMock()
        self._mock_insert(mock_conn)
        with patch("app.routes.forum.get_conn", _make_get_conn(mock_conn)):
            resp = client.post(
                "/forum/topics",
                json={"title": "Foto do show", "body": body, "category": "shows"},
                headers={"origin": ORIGIN_PJ, "authorization": f"Bearer {valid_token}"},
            )
        assert resp.status_code == 201

    def test_categoria_padrao_geral(self, client: TestClient, valid_token: str):
        mock_conn = AsyncMock()
        self._mock_insert(mock_conn)
        with patch("app.routes.forum.get_conn", _make_get_conn(mock_conn)):
            resp = client.post(
                "/forum/topics",
                json={"title": "Titulo valido aqui", "body": "Corpo com pelo menos dez chars."},
                headers={"origin": ORIGIN_PJ, "authorization": f"Bearer {valid_token}"},
            )
        assert resp.status_code == 201


# ── Criar Resposta ───────────────────────────────────────────────────────────

class TestCriarResposta:
    """POST /forum/topics/{id}/posts"""

    def _mock_insert(self, mock_conn, topic_exists=True):
        mock_conn.fetchval = AsyncMock(return_value=1 if topic_exists else None)
        mock_conn.fetchrow = AsyncMock(side_effect=[_fake_post_row(), _fake_user_row()])
        mock_conn.execute = AsyncMock()

    def test_sucesso(self, client: TestClient, valid_token: str):
        mock_conn = AsyncMock()
        self._mock_insert(mock_conn)
        with patch("app.routes.forum.get_conn", _make_get_conn(mock_conn)):
            resp = client.post(
                f"/forum/topics/{TOPIC_ID}/posts",
                json={"body": "Vou sim, muito animado!"},
                headers={"origin": ORIGIN_PJ, "authorization": f"Bearer {valid_token}"},
            )
        assert resp.status_code == 201
        data = resp.json()
        assert "id" in data
        assert data["topic_id"] == TOPIC_ID

    def test_corpo_muito_curto_retorna_422(self, client: TestClient, valid_token: str):
        resp = client.post(
            f"/forum/topics/{TOPIC_ID}/posts",
            json={"body": "X"},
            headers={"origin": ORIGIN_PJ, "authorization": f"Bearer {valid_token}"},
        )
        assert resp.status_code == 422

    def test_corpo_acima_de_200000_retorna_422(self, client: TestClient, valid_token: str):
        resp = client.post(
            f"/forum/topics/{TOPIC_ID}/posts",
            json={"body": "A" * 200001},
            headers={"origin": ORIGIN_PJ, "authorization": f"Bearer {valid_token}"},
        )
        assert resp.status_code == 422

    def test_sem_auth_retorna_401(self, client: TestClient):
        resp = client.post(
            f"/forum/topics/{TOPIC_ID}/posts",
            json={"body": "Resposta valida aqui."},
            headers={"origin": ORIGIN_PJ},
        )
        assert resp.status_code == 401

    def test_topico_inexistente_retorna_404(self, client: TestClient, valid_token: str):
        mock_conn = AsyncMock()
        self._mock_insert(mock_conn, topic_exists=False)
        with patch("app.routes.forum.get_conn", _make_get_conn(mock_conn)):
            resp = client.post(
                f"/forum/topics/{TOPIC_ID}/posts",
                json={"body": "Resposta valida aqui."},
                headers={"origin": ORIGIN_PJ, "authorization": f"Bearer {valid_token}"},
            )
        assert resp.status_code == 404

    def test_origin_invalida_retorna_403(self, client: TestClient, valid_token: str):
        resp = client.post(
            f"/forum/topics/{TOPIC_ID}/posts",
            json={"body": "Resposta valida aqui."},
            headers={"origin": "https://invasor.com", "authorization": f"Bearer {valid_token}"},
        )
        assert resp.status_code == 403

    def test_com_foto_base64_aceita(self, client: TestClient, valid_token: str):
        """Resposta com foto embutida (~40KB base64) deve ser aceita apos fix."""
        fake_b64 = "data:image/jpeg;base64," + ("B" * 40000)
        body = f"Olha essa foto!\n\n[img]{fake_b64}[/img]"
        assert len(body) < 200000
        mock_conn = AsyncMock()
        self._mock_insert(mock_conn)
        with patch("app.routes.forum.get_conn", _make_get_conn(mock_conn)):
            resp = client.post(
                f"/forum/topics/{TOPIC_ID}/posts",
                json={"body": body},
                headers={"origin": ORIGIN_PJ, "authorization": f"Bearer {valid_token}"},
            )
        assert resp.status_code == 201

    def test_com_quatro_fotos_aceita(self, client: TestClient, valid_token: str):
        """4 fotos de ~30KB cada (limite maximo do composer) devem caber em 200000 chars."""
        foto = "data:image/jpeg;base64," + ("C" * 30000)
        body = "\n\n".join(f"[img]{foto}[/img]" for _ in range(4))
        assert len(body) < 200000, "Setup do teste incorreto"
        mock_conn = AsyncMock()
        self._mock_insert(mock_conn)
        with patch("app.routes.forum.get_conn", _make_get_conn(mock_conn)):
            resp = client.post(
                f"/forum/topics/{TOPIC_ID}/posts",
                json={"body": body},
                headers={"origin": ORIGIN_PJ, "authorization": f"Bearer {valid_token}"},
            )
        assert resp.status_code == 201

    def test_com_setlist_embed_aceita(self, client: TestClient, valid_token: str):
        """Resposta com tag [setlist] deve ser aceita."""
        body = "Vi esse show ao vivo!\n\n[setlist]Pearl Jam | 22 mai. 2026 | Allianz Parque[/setlist]"
        mock_conn = AsyncMock()
        self._mock_insert(mock_conn)
        with patch("app.routes.forum.get_conn", _make_get_conn(mock_conn)):
            resp = client.post(
                f"/forum/topics/{TOPIC_ID}/posts",
                json={"body": body},
                headers={"origin": ORIGIN_PJ, "authorization": f"Bearer {valid_token}"},
            )
        assert resp.status_code == 201


# ── Visualizar Topico ────────────────────────────────────────────────────────

class TestVisualizarTopico:
    """GET /forum/topics/{id}"""

    def _mock_get(self, mock_conn, found=True, posts=None):
        mock_conn.fetchrow = AsyncMock(return_value=_fake_topic_full_row() if found else None)
        mock_conn.fetch = AsyncMock(return_value=posts or [])

    def test_retorna_topico_e_posts(self, client: TestClient):
        mock_conn = AsyncMock()
        self._mock_get(mock_conn)
        with patch("app.routes.forum.get_conn", _make_get_conn(mock_conn)):
            resp = client.get(f"/forum/topics/{TOPIC_ID}", headers={"origin": ORIGIN_PJ})
        assert resp.status_code == 200
        data = resp.json()
        assert "topic" in data
        assert "posts" in data
        assert data["topic"]["id"] == TOPIC_ID
        assert isinstance(data["posts"], list)

    def test_topico_inexistente_retorna_404(self, client: TestClient):
        mock_conn = AsyncMock()
        self._mock_get(mock_conn, found=False)
        with patch("app.routes.forum.get_conn", _make_get_conn(mock_conn)):
            resp = client.get(f"/forum/topics/{TOPIC_ID}", headers={"origin": ORIGIN_PJ})
        assert resp.status_code == 404

    def test_origin_invalida_retorna_403(self, client: TestClient):
        resp = client.get(
            f"/forum/topics/{TOPIC_ID}",
            headers={"origin": "https://nao-autorizado.com"},
        )
        assert resp.status_code == 403

    def test_body_com_foto_preservado_no_retorno(self, client: TestClient):
        """Backend nao deve sanitizar [img] -- o frontend faz isso ao renderizar."""
        foto = "data:image/jpeg;base64," + ("Z" * 100)
        row = _fake_topic_full_row()
        row["body"] = f"Foto aqui:\n\n[img]{foto}[/img]"
        mock_conn = AsyncMock()
        mock_conn.fetchrow = AsyncMock(return_value=row)
        mock_conn.fetch = AsyncMock(return_value=[])
        with patch("app.routes.forum.get_conn", _make_get_conn(mock_conn)):
            resp = client.get(f"/forum/topics/{TOPIC_ID}", headers={"origin": ORIGIN_PJ})
        assert resp.status_code == 200
        assert "[img]" in resp.json()["topic"]["body"]

    def test_posts_listados_em_ordem(self, client: TestClient):
        """Topico com replies deve retorna-los na resposta."""
        post_row = dict(_fake_post_row())
        post_row["display_name"] = "Outro User"
        post_row["avatar_url"] = None
        mock_conn = AsyncMock()
        mock_conn.fetchrow = AsyncMock(return_value=_fake_topic_full_row())
        mock_conn.fetch = AsyncMock(return_value=[post_row])
        with patch("app.routes.forum.get_conn", _make_get_conn(mock_conn)):
            resp = client.get(f"/forum/topics/{TOPIC_ID}", headers={"origin": ORIGIN_PJ})
        assert resp.status_code == 200
        assert len(resp.json()["posts"]) == 1


# ── Listar Topicos ────────────────────────────────────────────────────────────

class TestListarTopicos:
    """GET /forum/topics com filtros e paginacao."""

    def _make_mock(self, items=None, total=1):
        mock_conn = AsyncMock()
        mock_conn.fetch = AsyncMock(return_value=items if items is not None else [_fake_topic_full_row()])
        mock_conn.fetchval = AsyncMock(return_value=total)
        return mock_conn

    def test_listagem_basica(self, client: TestClient):
        mock_conn = self._make_mock()
        with patch("app.routes.forum.get_conn", _make_get_conn(mock_conn)):
            resp = client.get("/forum/topics", headers={"origin": ORIGIN_PJ})
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] == 1
        assert data["page"] == 1

    def test_filtro_por_categoria(self, client: TestClient):
        mock_conn = self._make_mock()
        with patch("app.routes.forum.get_conn", _make_get_conn(mock_conn)):
            resp = client.get("/forum/topics?category=shows", headers={"origin": ORIGIN_PJ})
        assert resp.status_code == 200

    def test_sort_newest(self, client: TestClient):
        mock_conn = self._make_mock()
        with patch("app.routes.forum.get_conn", _make_get_conn(mock_conn)):
            resp = client.get("/forum/topics?sort=newest", headers={"origin": ORIGIN_PJ})
        assert resp.status_code == 200

    def test_paginacao(self, client: TestClient):
        mock_conn = self._make_mock()
        with patch("app.routes.forum.get_conn", _make_get_conn(mock_conn)):
            resp = client.get("/forum/topics?page=2&per_page=10", headers={"origin": ORIGIN_PJ})
        assert resp.status_code == 200
        assert resp.json()["page"] == 2

    def test_per_page_clamped_a_50(self, client: TestClient):
        """per_page > 50 deve ser limitado a 50 internamente."""
        captured = {}

        async def fake_fetch(query, *args):
            captured["limit"] = args[0]
            return [_fake_topic_full_row()]

        mock_conn = AsyncMock()
        mock_conn.fetch = fake_fetch
        mock_conn.fetchval = AsyncMock(return_value=1)
        with patch("app.routes.forum.get_conn", _make_get_conn(mock_conn)):
            client.get("/forum/topics?per_page=999", headers={"origin": ORIGIN_PJ})
        assert captured.get("limit", 999) <= 50

    def test_lista_vazia(self, client: TestClient):
        mock_conn = self._make_mock(items=[], total=0)
        with patch("app.routes.forum.get_conn", _make_get_conn(mock_conn)):
            resp = client.get("/forum/topics", headers={"origin": ORIGIN_PJ})
        assert resp.status_code == 200
        assert resp.json()["items"] == []
        assert resp.json()["total"] == 0

    def test_origin_invalida_retorna_403(self, client: TestClient):
        resp = client.get("/forum/topics", headers={"origin": "https://hacker.io"})
        assert resp.status_code == 403


# ── Report ───────────────────────────────────────────────────────────────────

class TestReport:
    """POST /forum/reports"""

    def _mock_execute(self, mock_conn):
        mock_conn.execute = AsyncMock()

    def test_report_post_sucesso(self, client: TestClient, valid_token: str):
        mock_conn = AsyncMock()
        self._mock_execute(mock_conn)
        with patch("app.routes.forum.get_conn", _make_get_conn(mock_conn)):
            resp = client.post(
                "/forum/reports",
                json={"target_id": POST_ID, "target_type": "post", "reason": "spam"},
                headers={"origin": ORIGIN_PJ, "authorization": f"Bearer {valid_token}"},
            )
        assert resp.status_code == 201
        assert resp.json()["status"] == "ok"
        assert "id" in resp.json()

    def test_report_topico_sucesso(self, client: TestClient, valid_token: str):
        mock_conn = AsyncMock()
        self._mock_execute(mock_conn)
        with patch("app.routes.forum.get_conn", _make_get_conn(mock_conn)):
            resp = client.post(
                "/forum/reports",
                json={"target_id": TOPIC_ID, "target_type": "topic"},
                headers={"origin": ORIGIN_PJ, "authorization": f"Bearer {valid_token}"},
            )
        assert resp.status_code == 201

    def test_tipo_invalido_retorna_422(self, client: TestClient, valid_token: str):
        resp = client.post(
            "/forum/reports",
            json={"target_id": POST_ID, "target_type": "comentario"},
            headers={"origin": ORIGIN_PJ, "authorization": f"Bearer {valid_token}"},
        )
        assert resp.status_code == 422

    def test_razao_muito_longa_retorna_422(self, client: TestClient, valid_token: str):
        resp = client.post(
            "/forum/reports",
            json={"target_id": POST_ID, "target_type": "post", "reason": "X" * 501},
            headers={"origin": ORIGIN_PJ, "authorization": f"Bearer {valid_token}"},
        )
        assert resp.status_code == 422

    def test_sem_auth_retorna_401(self, client: TestClient):
        resp = client.post(
            "/forum/reports",
            json={"target_id": POST_ID, "target_type": "post"},
            headers={"origin": ORIGIN_PJ},
        )
        assert resp.status_code == 401

    def test_sem_razao_aceito(self, client: TestClient, valid_token: str):
        """Razao e opcional no report."""
        mock_conn = AsyncMock()
        self._mock_execute(mock_conn)
        with patch("app.routes.forum.get_conn", _make_get_conn(mock_conn)):
            resp = client.post(
                "/forum/reports",
                json={"target_id": POST_ID, "target_type": "post"},
                headers={"origin": ORIGIN_PJ, "authorization": f"Bearer {valid_token}"},
            )
        assert resp.status_code == 201


# ── Autenticacao ─────────────────────────────────────────────────────────────

class TestAutenticacao:
    """JWT em endpoints protegidos."""

    @pytest.mark.parametrize("path,payload", [
        ("/forum/topics", {"title": "Titulo valido aqui", "body": "Corpo com dez chars.", "category": "geral"}),
        (f"/forum/topics/{TOPIC_ID}/posts", {"body": "Resposta valida."}),
        ("/forum/reports", {"target_id": POST_ID, "target_type": "post"}),
    ])
    def test_sem_token_retorna_401(self, client: TestClient, path: str, payload: dict):
        resp = client.post(path, json=payload, headers={"origin": ORIGIN_PJ})
        assert resp.status_code == 401

    def test_token_invalido_retorna_401(self, client: TestClient):
        resp = client.post(
            "/forum/topics",
            json={"title": "Titulo valido aqui", "body": "Corpo com dez chars.", "category": "geral"},
            headers={"origin": ORIGIN_PJ, "authorization": "Bearer token.invalido.aqui"},
        )
        assert resp.status_code == 401

    def test_leitura_publica_sem_auth(self, client: TestClient):
        """GET /forum/topics nao exige autenticacao."""
        mock_conn = AsyncMock()
        mock_conn.fetch = AsyncMock(return_value=[])
        mock_conn.fetchval = AsyncMock(return_value=0)
        with patch("app.routes.forum.get_conn", _make_get_conn(mock_conn)):
            resp = client.get("/forum/topics", headers={"origin": ORIGIN_PJ})
        assert resp.status_code == 200

    def test_visualizar_topico_sem_auth(self, client: TestClient):
        """GET /forum/topics/{id} nao exige autenticacao."""
        mock_conn = AsyncMock()
        mock_conn.fetchrow = AsyncMock(return_value=_fake_topic_full_row())
        mock_conn.fetch = AsyncMock(return_value=[])
        with patch("app.routes.forum.get_conn", _make_get_conn(mock_conn)):
            resp = client.get(f"/forum/topics/{TOPIC_ID}", headers={"origin": ORIGIN_PJ})
        assert resp.status_code == 200


# ── Limite de tamanho do corpo ───────────────────────────────────────────────

class TestLimiteTamanhoCorpo:
    """Garante que o limite de 200000 chars aceita fotos e rejeita corpos invalidos."""

    def _mock_insert(self, mock_conn):
        mock_conn.fetchrow = AsyncMock(side_effect=[_fake_topic_row(), _fake_user_row()])

    def test_limite_exato_200000_aceito(self, client: TestClient, valid_token: str):
        mock_conn = AsyncMock()
        self._mock_insert(mock_conn)
        with patch("app.routes.forum.get_conn", _make_get_conn(mock_conn)):
            resp = client.post(
                "/forum/topics",
                json={"title": "Titulo valido aqui", "body": "A" * 200000, "category": "geral"},
                headers={"origin": ORIGIN_PJ, "authorization": f"Bearer {valid_token}"},
            )
        assert resp.status_code == 201

    def test_200001_chars_rejeitado(self, client: TestClient, valid_token: str):
        resp = client.post(
            "/forum/topics",
            json={"title": "Titulo valido aqui", "body": "A" * 200001, "category": "geral"},
            headers={"origin": ORIGIN_PJ, "authorization": f"Bearer {valid_token}"},
        )
        assert resp.status_code == 422

    def test_quatro_fotos_30kb_dentro_do_limite(self, client: TestClient, valid_token: str):
        """4 fotos de ~30KB base64 simuladas cabem em 200000 chars."""
        foto = "data:image/jpeg;base64," + ("C" * 30000)
        body = "Fotos do show!\n\n" + "\n".join(f"[img]{foto}[/img]" for _ in range(4))
        assert len(body) < 200000, f"Setup incorreto: body tem {len(body)} chars"
        mock_conn = AsyncMock()
        self._mock_insert(mock_conn)
        with patch("app.routes.forum.get_conn", _make_get_conn(mock_conn)):
            resp = client.post(
                "/forum/topics",
                json={"title": "Fotos do show", "body": body, "category": "shows"},
                headers={"origin": ORIGIN_PJ, "authorization": f"Bearer {valid_token}"},
            )
        assert resp.status_code == 201

    def test_post_com_foto_resposta_dentro_do_limite(self, client: TestClient, valid_token: str):
        """Resposta com foto tambem respeita o novo limite."""
        foto = "data:image/jpeg;base64," + ("D" * 40000)
        body = f"Que show!\n\n[img]{foto}[/img]"
        assert len(body) < 200000
        mock_conn = AsyncMock()
        mock_conn.fetchval = AsyncMock(return_value=1)
        mock_conn.fetchrow = AsyncMock(side_effect=[_fake_post_row(), _fake_user_row()])
        mock_conn.execute = AsyncMock()
        with patch("app.routes.forum.get_conn", _make_get_conn(mock_conn)):
            resp = client.post(
                f"/forum/topics/{TOPIC_ID}/posts",
                json={"body": body},
                headers={"origin": ORIGIN_PJ, "authorization": f"Bearer {valid_token}"},
            )
        assert resp.status_code == 201
