import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.core.config import settings
from app.core.limiter import limiter
from app.core.logging import configure_logging, request_id_ctx
from app.routes import auth, feed, forum
from app.services.db import get_conn

configure_logging()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API do Fórum SMUFDPJ",
)
app.state.limiter = limiter

# Origens permitidas: dominios de producao sempre; localhost apenas em dev.
_allowed_origins = list(settings.site_origin_map.keys())
if settings.ENVIRONMENT == "development":
    _allowed_origins += [
        "http://localhost:3000",
        "http://localhost:5500",
        "http://localhost:8080",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.add_middleware(SessionMiddleware, secret_key=settings.JWT_SECRET or "dev-session-only")
app.add_middleware(SlowAPIMiddleware)
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.middleware("http")
async def correlation_id_middleware(request: Request, call_next):
    req_id = request.headers.get("x-request-id") or uuid.uuid4().hex[:12]
    token = request_id_ctx.set(req_id)
    try:
        response = await call_next(request)
    finally:
        request_id_ctx.reset(token)
    response.headers["x-request-id"] = req_id
    return response


app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(forum.router, prefix="/forum", tags=["Forum"])
app.include_router(feed.router, prefix="/feed", tags=["Feed"])


@app.get("/health", tags=["Health"])
async def health() -> JSONResponse:
    """Liveness leve: nao depende do banco (usado pelo Railway healthcheck)."""
    return JSONResponse({"status": "ok", "version": settings.APP_VERSION})


@app.get("/health/db", tags=["Health"])
async def health_db() -> JSONResponse:
    """Readiness: verifica conectividade com o banco."""
    try:
        async with get_conn() as conn:
            await conn.fetchval("SELECT 1")
        return JSONResponse({"status": "ok", "db": "ok"})
    except Exception:
        return JSONResponse({"status": "degraded", "db": "error"}, status_code=503)


@app.get("/", tags=["Root"])
async def root() -> dict:
    return {"app": settings.APP_NAME, "version": settings.APP_VERSION, "docs": "/docs"}
