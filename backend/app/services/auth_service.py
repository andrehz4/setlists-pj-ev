import logging
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from jose import JWTError, jwt

from app.core.config import settings
from app.services.db import get_conn

logger = logging.getLogger(__name__)

ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 7


def create_jwt(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=ALGORITHM)


def verify_jwt(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
        return {"user_id": user_id}
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido ou expirado"
        ) from exc


async def upsert_user(profile: dict) -> str:
    user_id = str(profile.get("sub") or uuid.uuid4())
    display_name = profile.get("name", "Usuário")
    avatar_url = profile.get("picture")

    async with get_conn() as conn:
        await conn.execute(
            """
            INSERT INTO forum_users (id, display_name, avatar_url, provider)
            VALUES ($1::uuid, $2, $3, 'google')
            ON CONFLICT (id) DO UPDATE
              SET display_name = EXCLUDED.display_name,
                  avatar_url   = EXCLUDED.avatar_url
            """,
            user_id,
            display_name,
            avatar_url,
        )
    logger.info("Upsert forum_user id=%s", user_id)
    return user_id
