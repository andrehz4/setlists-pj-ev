import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status

from app.core.config import settings
from app.core.limiter import limiter
from app.routes.forum import _resolve_site
from app.schemas.feed import (
    CommentCreate,
    FeedCommentOut,
    FeedPageOut,
    FeedPostCreate,
    FeedPostDetailOut,
    FeedPostOut,
)
from app.services.auth_service import verify_jwt
from app.services.db import get_conn

logger = logging.getLogger(__name__)
router = APIRouter()


def _require_auth(authorization: Optional[str] = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token ausente")
    token = authorization.removeprefix("Bearer ").strip()
    return verify_jwt(token)["user_id"]


def _optional_auth(authorization: Optional[str] = Header(default=None)) -> Optional[str]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        token = authorization.removeprefix("Bearer ").strip()
        return verify_jwt(token)["user_id"]
    except HTTPException:
        return None


@router.get("/posts", response_model=FeedPageOut, tags=["Feed"])
async def list_posts(
    request: Request,
    page: int = 1,
    per_page: int = 20,
    user_id: Optional[str] = Depends(_optional_auth),
):
    site = _resolve_site(request)
    per_page = min(per_page, 50)
    offset = (page - 1) * per_page

    async with get_conn() as conn:
        rows = await conn.fetch(
            """
            SELECT p.id::text, p.site, p.photo_url, p.caption,
                   u.display_name, u.avatar_url,
                   (SELECT COUNT(*) FROM feed_likes l WHERE l.post_id = p.id)::int AS like_count,
                   (SELECT COUNT(*) FROM feed_comments c WHERE c.post_id = p.id)::int AS comment_count,
                   ($3::uuid IS NOT NULL AND EXISTS(
                       SELECT 1 FROM feed_likes l WHERE l.post_id = p.id AND l.user_id = $3::uuid
                   )) AS liked_by_me,
                   p.created_at::text
            FROM feed_posts p
            JOIN forum_users u ON u.id = p.user_id
            WHERE p.site = $1
            ORDER BY p.created_at DESC
            LIMIT $2 OFFSET $4
            """,
            site, per_page, user_id, offset,
        )
        total = await conn.fetchval(
            "SELECT COUNT(*) FROM feed_posts WHERE site = $1", site
        )

    items = [FeedPostOut(**dict(r)) for r in rows]
    return FeedPageOut(items=items, total=total or 0, page=page, per_page=per_page, site=site)


@router.post("/posts", response_model=FeedPostOut, status_code=status.HTTP_201_CREATED, tags=["Feed"])
@limiter.limit("1/minute")
async def create_post(
    request: Request,
    payload: FeedPostCreate,
    user_id: str = Depends(_require_auth),
):
    site = _resolve_site(request)
    post_id = str(uuid.uuid4())

    async with get_conn() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO feed_posts (id, site, photo_url, caption, user_id)
            VALUES ($1::uuid, $2, $3, $4, $5::uuid)
            RETURNING id::text, site, photo_url, caption, created_at::text
            """,
            post_id, site, payload.photo_url, payload.caption, user_id,
        )
        user = await conn.fetchrow(
            "SELECT display_name, avatar_url FROM forum_users WHERE id = $1::uuid", user_id
        )

    logger.info("Novo post feed id=%s site=%s user=%s", post_id, site, user_id)
    return FeedPostOut(
        **dict(row),
        display_name=user["display_name"],
        avatar_url=user["avatar_url"],
        like_count=0,
        comment_count=0,
        liked_by_me=False,
    )


@router.get("/posts/{post_id}", response_model=FeedPostDetailOut, tags=["Feed"])
async def get_post(
    post_id: str,
    request: Request,
    user_id: Optional[str] = Depends(_optional_auth),
):
    site = _resolve_site(request)

    async with get_conn() as conn:
        row = await conn.fetchrow(
            """
            SELECT p.id::text, p.site, p.photo_url, p.caption,
                   u.display_name, u.avatar_url,
                   (SELECT COUNT(*) FROM feed_likes l WHERE l.post_id = p.id)::int AS like_count,
                   (SELECT COUNT(*) FROM feed_comments c WHERE c.post_id = p.id)::int AS comment_count,
                   ($2::uuid IS NOT NULL AND EXISTS(
                       SELECT 1 FROM feed_likes l WHERE l.post_id = p.id AND l.user_id = $2::uuid
                   )) AS liked_by_me,
                   p.created_at::text
            FROM feed_posts p
            JOIN forum_users u ON u.id = p.user_id
            WHERE p.id = $1::uuid AND p.site = $3
            """,
            post_id, user_id, site,
        )
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post não encontrado")

        comment_rows = await conn.fetch(
            """
            SELECT c.id::text, c.post_id::text, c.body,
                   u.display_name, u.avatar_url, c.created_at::text
            FROM feed_comments c
            JOIN forum_users u ON u.id = c.user_id
            WHERE c.post_id = $1::uuid
            ORDER BY c.created_at ASC
            """,
            post_id,
        )

    post = FeedPostOut(**dict(row))
    comments = [FeedCommentOut(**dict(c)) for c in comment_rows]
    return FeedPostDetailOut(post=post, comments=comments)


@router.post("/posts/{post_id}/likes", status_code=status.HTTP_200_OK, tags=["Feed"])
async def toggle_like(
    post_id: str,
    request: Request,
    user_id: str = Depends(_require_auth),
):
    site = _resolve_site(request)

    async with get_conn() as conn:
        exists = await conn.fetchval(
            "SELECT 1 FROM feed_posts WHERE id = $1::uuid AND site = $2",
            post_id, site,
        )
        if not exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post não encontrado")

        already_liked = await conn.fetchval(
            "SELECT 1 FROM feed_likes WHERE post_id = $1::uuid AND user_id = $2::uuid",
            post_id, user_id,
        )
        if already_liked:
            await conn.execute(
                "DELETE FROM feed_likes WHERE post_id = $1::uuid AND user_id = $2::uuid",
                post_id, user_id,
            )
            liked = False
        else:
            await conn.execute(
                "INSERT INTO feed_likes (post_id, user_id) VALUES ($1::uuid, $2::uuid) ON CONFLICT DO NOTHING",
                post_id, user_id,
            )
            liked = True

        like_count = await conn.fetchval(
            "SELECT COUNT(*) FROM feed_likes WHERE post_id = $1::uuid", post_id
        )

    return {"liked": liked, "like_count": int(like_count)}


@router.post(
    "/posts/{post_id}/comments",
    response_model=FeedCommentOut,
    status_code=status.HTTP_201_CREATED,
    tags=["Feed"],
)
@limiter.limit("3/minute")
async def create_comment(
    request: Request,
    post_id: str,
    payload: CommentCreate,
    user_id: str = Depends(_require_auth),
):
    site = _resolve_site(request)

    async with get_conn() as conn:
        exists = await conn.fetchval(
            "SELECT 1 FROM feed_posts WHERE id = $1::uuid AND site = $2",
            post_id, site,
        )
        if not exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post não encontrado")

        comment_id = str(uuid.uuid4())
        row = await conn.fetchrow(
            """
            INSERT INTO feed_comments (id, post_id, body, user_id)
            VALUES ($1::uuid, $2::uuid, $3, $4::uuid)
            RETURNING id::text, post_id::text, body, created_at::text
            """,
            comment_id, post_id, payload.body, user_id,
        )
        user = await conn.fetchrow(
            "SELECT display_name, avatar_url FROM forum_users WHERE id = $1::uuid", user_id
        )

    logger.info("Novo comentário id=%s post=%s user=%s", comment_id, post_id, user_id)
    return FeedCommentOut(
        **dict(row),
        display_name=user["display_name"],
        avatar_url=user["avatar_url"],
    )


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Feed"])
async def delete_comment(
    comment_id: str,
    request: Request,
    user_id: str = Depends(_require_auth),
):
    site = _resolve_site(request)

    async with get_conn() as conn:
        row = await conn.fetchrow(
            """
            SELECT c.id, c.user_id::text, p.site
            FROM feed_comments c
            JOIN feed_posts p ON p.id = c.post_id
            WHERE c.id = $1::uuid
            """,
            comment_id,
        )
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comentário não encontrado")
        if row["site"] != site:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comentário não encontrado")
        if row["user_id"] != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão")

        await conn.execute(
            "DELETE FROM feed_comments WHERE id = $1::uuid", comment_id
        )
