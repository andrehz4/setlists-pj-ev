import os
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

# Variáveis mínimas para o app inicializar em testes
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("JWT_SECRET", "test-secret-32-chars-minimum-here")
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-client-id")
os.environ.setdefault("GOOGLE_CLIENT_SECRET", "test-client-secret")
os.environ.setdefault(
    "SITE_ORIGINS",
    "https://setlists-pj-ev.pages.dev=pj,https://terra-gentil.pages.dev=terra-gentil",
)
os.environ.setdefault("ENVIRONMENT", "test")


@pytest.fixture(autouse=True)
def disable_rate_limit():
    """Desliga o rate limit nos testes via API publica do SlowAPI (limiter.enabled).
    Evita 429 falso entre testes sem depender de atributos internos como _storage."""
    from app.core.limiter import limiter
    previous = limiter.enabled
    limiter.enabled = False
    yield
    limiter.enabled = previous


@pytest.fixture
def client():
    """TestClient com pool de DB mockado para não precisar de banco real."""
    with patch("app.services.db.get_pool") as mock_get_pool:
        mock_pool = AsyncMock()
        mock_get_pool.return_value = mock_pool
        from app.main import app
        with TestClient(app, raise_server_exceptions=True) as c:
            yield c


@pytest.fixture
def valid_token():
    """JWT válido para user de teste."""
    from app.services.auth_service import create_jwt
    return create_jwt("00000000-0000-0000-0000-000000000001")
