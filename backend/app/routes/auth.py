import logging

from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from starlette.config import Config

from app.core.config import settings
from app.services.auth_service import create_jwt, upsert_user

logger = logging.getLogger(__name__)
router = APIRouter()

_starlette_config = Config(
    environ={
        "GOOGLE_CLIENT_ID": settings.GOOGLE_CLIENT_ID,
        "GOOGLE_CLIENT_SECRET": settings.GOOGLE_CLIENT_SECRET,
    }
)
oauth = OAuth(_starlette_config)
oauth.register(
    name="google",
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


@router.get("/google/login", tags=["Auth"])
async def google_login(request: Request):
    redirect_uri = str(request.url_for("google_callback"))
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback", name="google_callback", tags=["Auth"])
async def google_callback(request: Request):
    token = await oauth.google.authorize_access_token(request)
    profile = token.get("userinfo") or await oauth.google.userinfo(token=token)
    user_id = await upsert_user(dict(profile))
    jwt_token = create_jwt(user_id)
    redirect_url = f"{settings.FORUM_CORS_ORIGIN}/auth-callback.html?token={jwt_token}"
    logger.info("OAuth callback OK, redirecionando user_id=%s", user_id)
    return RedirectResponse(url=redirect_url)
