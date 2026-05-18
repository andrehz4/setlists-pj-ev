import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.core.config import settings
from app.core.limiter import limiter
from app.routes import auth, feed, forum

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API do Fórum SMUFDPJ",
)
app.state.limiter = limiter

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.site_origin_map.keys()) + [
        "http://localhost:3000",
        "http://localhost:5500",
        "http://localhost:8080",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.add_middleware(SessionMiddleware, secret_key=settings.JWT_SECRET or "dev-session-only")
app.add_middleware(SlowAPIMiddleware)
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(forum.router, prefix="/forum", tags=["Forum"])
app.include_router(feed.router, prefix="/feed", tags=["Feed"])


@app.get("/health", tags=["Health"])
async def health() -> JSONResponse:
    return JSONResponse({"status": "ok", "version": settings.APP_VERSION})


@app.get("/", tags=["Root"])
async def root() -> dict:
    return {"app": settings.APP_NAME, "version": settings.APP_VERSION, "docs": "/docs"}
