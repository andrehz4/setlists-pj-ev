import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.schemas.forum import (
    PostCreate,
    PostOut,
    ReportCreate,
    TopicCreate,
    TopicDetailOut,
    TopicOut,
    TopicsPageOut,
)
from app.services.auth_service import verify_jwt
from app.services.db import get_conn

logger = logging.getLogger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


def _require_auth(authorization: Optional[str] = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token ausente")
    token = authorization.removeprefix("Bearer ").strip()
    payload = verify_jwt(token)
    return payload["user_id"]


@router.get("/topics", response_model=TopicsPageOut, tags=["Forum"])
async def list_topics(
    page: int = 1,
    per_page: int = 20,
    category: str = "",
    sort: str = "activity",
):
    per_page = min(per_page, 50)
    offset = (page - 1) * per_page
    order = "t.last_post_at DESC" if sort == "activity" else "t.created_at DESC"

    async with get_conn() as conn:
        if category:
            rows = await conn.fetch(
                f"""
                SELECT t.id::text, t.title, t.body, t.category,
                       u.display_name, u.avatar_url,
                       t.pinned,
                       t.created_at::text, t.last_post_at::text,
                       (SELECT COUNT(*) FROM forum_posts p WHERE p.topic_id = t.id)::int AS reply_count
                FROM forum_topics t
                JOIN forum_users u ON u.id = t.user_id
                WHERE t.category = $3
                ORDER BY t.pinned DESC, {order}
                LIMIT $1 OFFSET $2
                """,
                per_page, offset, category,
            )
            total = await conn.fetchval(
                "SELECT COUNT(*) FROM forum_topics WHERE category = $1", category
            )
        else:
            rows = await conn.fetch(
                f"""
                SELECT t.id::text, t.title, t.body, t.category,
                       u.display_name, u.avatar_url,
                       t.pinned,
                       t.created_at::text, t.last_post_at::text,
                       (SELECT COUNT(*) FROM forum_posts p WHERE p.topic_id = t.id)::int AS reply_count
                FROM forum_topics t
                JOIN forum_users u ON u.id = t.user_id
                ORDER BY t.pinned DESC, {order}
                LIMIT $1 OFFSET $2
                """,
                per_page, offset,
            )
            total = await conn.fetchval("SELECT COUNT(*) FROM forum_topics")

    items = [TopicOut(**dict(r)) for r in rows]
    return TopicsPageOut(items=items, total=total or 0, page=page, per_page=per_page)


@router.post("/topics", response_model=TopicOut, status_code=status.HTTP_201_CREATED, tags=["Forum"])
@limiter.limit("1/minute")
async def create_topic(
    request: Request,
    payload: TopicCreate,
    user_id: str = Depends(_require_auth),
):
    topic_id = str(uuid.uuid4())
    async with get_conn() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO forum_topics (id, title, body, category, user_id)
            VALUES ($1::uuid, $2, $3, $4, $5::uuid)
            RETURNING id::text, title, body, category, pinned,
                      created_at::text, last_post_at::text
            """,
            topic_id, payload.title, payload.body, payload.category, user_id,
        )
        user = await conn.fetchrow(
            "SELECT display_name, avatar_url FROM forum_users WHERE id = $1::uuid", user_id
        )
    logger.info("Novo tópico id=%s user=%s", topic_id, user_id)
    return TopicOut(**dict(row), display_name=user["display_name"], avatar_url=user["avatar_url"], reply_count=0)


@router.get("/topics/{topic_id}", response_model=TopicDetailOut, tags=["Forum"])
async def get_topic(topic_id: str):
    async with get_conn() as conn:
        row = await conn.fetchrow(
            """
            SELECT t.id::text, t.title, t.body, t.category,
                   u.display_name, u.avatar_url,
                   t.pinned,
                   t.created_at::text, t.last_post_at::text,
                   (SELECT COUNT(*) FROM forum_posts p WHERE p.topic_id = t.id)::int AS reply_count
            FROM forum_topics t
            JOIN forum_users u ON u.id = t.user_id
            WHERE t.id = $1::uuid
            """,
            topic_id,
        )
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tópico não encontrado")

        posts_rows = await conn.fetch(
            """
            SELECT p.id::text, p.topic_id::text, p.body,
                   u.display_name, u.avatar_url,
                   p.created_at::text
            FROM forum_posts p
            JOIN forum_users u ON u.id = p.user_id
            WHERE p.topic_id = $1::uuid
            ORDER BY p.created_at ASC
            """,
            topic_id,
        )

    topic = TopicOut(**dict(row))
    posts = [PostOut(**dict(p)) for p in posts_rows]
    return TopicDetailOut(topic=topic, posts=posts)


@router.post(
    "/topics/{topic_id}/posts",
    response_model=PostOut,
    status_code=status.HTTP_201_CREATED,
    tags=["Forum"],
)
@limiter.limit("1/minute")
async def create_post(
    request: Request,
    topic_id: str,
    payload: PostCreate,
    user_id: str = Depends(_require_auth),
):
    async with get_conn() as conn:
        exists = await conn.fetchval(
            "SELECT 1 FROM forum_topics WHERE id = $1::uuid", topic_id
        )
        if not exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tópico não encontrado")

        post_id = str(uuid.uuid4())
        row = await conn.fetchrow(
            """
            INSERT INTO forum_posts (id, topic_id, body, user_id)
            VALUES ($1::uuid, $2::uuid, $3, $4::uuid)
            RETURNING id::text, topic_id::text, body, created_at::text
            """,
            post_id, topic_id, payload.body, user_id,
        )
        await conn.execute(
            "UPDATE forum_topics SET last_post_at = now() WHERE id = $1::uuid", topic_id
        )
        user = await conn.fetchrow(
            "SELECT display_name, avatar_url FROM forum_users WHERE id = $1::uuid", user_id
        )

    logger.info("Nova resposta id=%s topic=%s user=%s", post_id, topic_id, user_id)
    return PostOut(**dict(row), display_name=user["display_name"], avatar_url=user["avatar_url"])


@router.post("/reports", status_code=status.HTTP_201_CREATED, tags=["Forum"])
async def create_report(
    payload: ReportCreate,
    user_id: str = Depends(_require_auth),
):
    report_id = str(uuid.uuid4())
    async with get_conn() as conn:
        await conn.execute(
            """
            INSERT INTO forum_reports (id, target_id, target_type, reason, reporter_id)
            VALUES ($1::uuid, $2::uuid, $3, $4, $5::uuid)
            """,
            report_id, payload.target_id, payload.target_type, payload.reason, user_id,
        )
    logger.info("Report id=%s target=%s/%s", report_id, payload.target_type, payload.target_id)
    return {"status": "ok", "id": report_id}
