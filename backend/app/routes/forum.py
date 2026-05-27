import json
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.config import settings
from app.core.limiter import limiter
from app.dependencies import optional_auth, require_auth, resolve_site
from app.schemas.forum import (
    PostCreate,
    PostOut,
    ReactionCreate,
    ReportCreate,
    TopicCreate,
    TopicDetailOut,
    TopicOut,
    TopicsPageOut,
    UserProfileUpdate,
)
from app.services.db import get_conn

logger = logging.getLogger(__name__)
router = APIRouter()

# Aliases mantidos para compatibilidade com imports existentes (feed.py, testes).
_resolve_site = resolve_site
_require_auth = require_auth

# Ordenacoes permitidas. A chave vem do usuario; o valor (SQL) e fixo aqui,
# nunca interpolado a partir do input. Evita SQL injection no ORDER BY.
_SORT_MAP = {
    "activity": "t.last_post_at DESC",
    "newest": "t.created_at DESC",
    "noreply": "reply_count ASC, t.created_at DESC",
    "likes": "COALESCE((rc.reactions->>'mata')::int, 0) DESC, t.last_post_at DESC",
}


def _parse_reactions(value) -> dict[str, int]:
    """Normaliza a coluna jsonb de reactions (asyncpg pode devolver str ou dict)."""
    if not value:
        return {}
    if isinstance(value, str):
        try:
            return json.loads(value)
        except (ValueError, TypeError):
            return {}
    return dict(value)


def _topic_from_row(row) -> TopicOut:
    d = dict(row)
    d["reactions"] = _parse_reactions(d.get("reactions"))
    d.setdefault("my_reactions", [])
    d["my_reactions"] = list(d["my_reactions"] or [])
    return TopicOut(**d)


def _post_from_row(row) -> PostOut:
    d = dict(row)
    d["reactions"] = _parse_reactions(d.get("reactions"))
    d["my_reactions"] = list(d.get("my_reactions") or [])
    return PostOut(**d)


@router.get("/topics", response_model=TopicsPageOut, tags=["Forum"])
async def list_topics(
    request: Request,
    page: int = 1,
    per_page: int = 20,
    category: str = "",
    sort: str = "activity",
    show_id: str = "",
):
    site = resolve_site(request)
    per_page = min(max(per_page, 1), 50)
    page = max(page, 1)
    offset = (page - 1) * per_page
    order = _SORT_MAP.get(sort, _SORT_MAP["activity"])

    base_select = """
        SELECT t.id::text, t.user_id::text, t.title, t.body, t.category, t.site,
               u.display_name, u.avatar_url, t.pinned,
               t.created_at::text, t.last_post_at::text,
               t.anchor_show_id,
               COALESCE(pc.reply_count, 0) AS reply_count,
               COALESCE(rc.reactions, '{}'::jsonb) AS reactions
        FROM forum_topics t
        JOIN forum_users u ON u.id = t.user_id
        LEFT JOIN (
            SELECT topic_id, COUNT(*)::int AS reply_count
            FROM forum_posts GROUP BY topic_id
        ) pc ON pc.topic_id = t.id
        LEFT JOIN (
            SELECT target_id, jsonb_object_agg(type, cnt) AS reactions
            FROM (
                SELECT target_id, type, COUNT(*)::int AS cnt
                FROM forum_reactions
                WHERE target_type = 'topic'
                GROUP BY target_id, type
            ) agg
            GROUP BY target_id
        ) rc ON rc.target_id = t.id
    """

    where = ["t.site = $3"]
    args = [per_page, offset, site]
    if category:
        args.append(category)
        where.append(f"t.category = ${len(args)}")
    if show_id:
        args.append(show_id)
        where.append(f"t.anchor_show_id = ${len(args)}")
    where_sql = " WHERE " + " AND ".join(where)

    async with get_conn() as conn:
        rows = await conn.fetch(  # noqa: S608 (order vem de _SORT_MAP, args via placeholders)
            base_select + where_sql + f" ORDER BY t.pinned DESC, {order} LIMIT $1 OFFSET $2",
            *args,
        )
        # COUNT usa os mesmos filtros mas sem LIMIT/OFFSET (offset args 1 e 2)
        count_args = args[2:]
        count_where = where_sql.replace("$3", "$1").replace("$4", "$2").replace("$5", "$3")
        total = await conn.fetchval(
            f"SELECT COUNT(*) FROM forum_topics t {count_where}",
            *count_args,
        )

    items = [_topic_from_row(r) for r in rows]
    return TopicsPageOut(items=items, total=total or 0, page=page, per_page=per_page, site=site)


@router.post("/topics", response_model=TopicOut, status_code=status.HTTP_201_CREATED, tags=["Forum"])
@limiter.limit("1/minute")
async def create_topic(
    request: Request,
    payload: TopicCreate,
    user_id: str = Depends(require_auth),
):
    site = resolve_site(request)
    topic_id = str(uuid.uuid4())
    async with get_conn() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO forum_topics (id, title, body, category, site, user_id, last_post_at, anchor_show_id)
            VALUES ($1::uuid, $2, $3, $4, $5, $6::uuid, now(), $7)
            RETURNING id::text, user_id::text, title, body, category, site, pinned,
                      created_at::text, last_post_at::text, anchor_show_id
            """,
            topic_id, payload.title, payload.body, payload.category, site, user_id, payload.anchor_show_id,
        )
        user = await conn.fetchrow(
            "SELECT display_name, avatar_url FROM forum_users WHERE id = $1::uuid", user_id
        )
    logger.info("Novo tópico id=%s site=%s user=%s show=%s", topic_id, site, user_id, payload.anchor_show_id)
    return TopicOut(
        **dict(row),
        display_name=user["display_name"],
        avatar_url=user["avatar_url"],
        reply_count=0,
        reactions={},
        my_reactions=[],
    )


@router.get("/topics/{topic_id}", response_model=TopicDetailOut, tags=["Forum"])
async def get_topic(
    topic_id: str,
    request: Request,
    page: int = 1,
    per_page: int = 30,
    user_id: str | None = Depends(optional_auth),
):
    site = resolve_site(request)
    per_page = min(max(per_page, 1), 100)
    page = max(page, 1)
    offset = (page - 1) * per_page

    async with get_conn() as conn:
        row = await conn.fetchrow(
            """
            SELECT t.id::text, t.user_id::text, t.title, t.body, t.category, t.site,
                   u.display_name, u.avatar_url, t.pinned,
                   t.created_at::text, t.last_post_at::text,
                   t.anchor_show_id,
                   (SELECT COUNT(*) FROM forum_posts p WHERE p.topic_id = t.id)::int AS reply_count,
                   COALESCE((SELECT jsonb_object_agg(type, cnt) FROM (
                       SELECT type, COUNT(*)::int AS cnt FROM forum_reactions
                       WHERE target_id = t.id AND target_type = 'topic' GROUP BY type
                   ) x), '{}'::jsonb) AS reactions,
                   COALESCE((SELECT array_agg(type) FROM forum_reactions
                       WHERE target_id = t.id AND target_type = 'topic' AND user_id = $3::uuid
                   ), '{}') AS my_reactions
            FROM forum_topics t
            JOIN forum_users u ON u.id = t.user_id
            WHERE t.id = $1::uuid AND t.site = $2
            """,
            topic_id, site, user_id,
        )
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tópico não encontrado")

        posts_rows = await conn.fetch(
            """
            SELECT p.id::text, p.user_id::text, p.topic_id::text, p.body, p.site,
                   u.display_name, u.avatar_url, p.created_at::text,
                   COALESCE((SELECT jsonb_object_agg(type, cnt) FROM (
                       SELECT type, COUNT(*)::int AS cnt FROM forum_reactions
                       WHERE target_id = p.id AND target_type = 'post' GROUP BY type
                   ) x), '{}'::jsonb) AS reactions,
                   COALESCE((SELECT array_agg(type) FROM forum_reactions
                       WHERE target_id = p.id AND target_type = 'post' AND user_id = $3::uuid
                   ), '{}') AS my_reactions
            FROM forum_posts p
            JOIN forum_users u ON u.id = p.user_id
            WHERE p.topic_id = $1::uuid AND p.site = $2
            ORDER BY p.created_at ASC
            LIMIT $4 OFFSET $5
            """,
            topic_id, site, user_id, per_page, offset,
        )

    topic = _topic_from_row(row)
    posts = [_post_from_row(p) for p in posts_rows]
    return TopicDetailOut(topic=topic, posts=posts, total_posts=topic.reply_count, page=page, per_page=per_page)


@router.get("/users/{user_id}", tags=["Forum"])
async def get_user_profile(user_id: str, request: Request):
    """Perfil público com agregações pra montar a página de perfil."""
    site = resolve_site(request)
    async with get_conn() as conn:
        u = await conn.fetchrow(
            """
            SELECT id::text, display_name, avatar_url, created_at::text,
                   COALESCE(bio, '') AS bio, COALESCE(email, '') AS email,
                   birth_year, COALESCE(city, '') AS city,
                   COALESCE(shows_attended, '{}'::text[]) AS shows_attended
            FROM forum_users WHERE id = $1::uuid
            """,
            user_id,
        )
        if not u:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")

        stats = await conn.fetchrow(
            """
            SELECT
              (SELECT COUNT(*) FROM forum_posts  WHERE user_id = $1::uuid AND site = $2)::int AS posts_count,
              (SELECT COUNT(*) FROM forum_topics WHERE user_id = $1::uuid AND site = $2)::int AS topics_count,
              (SELECT COUNT(*) FROM forum_reactions WHERE user_id = $1::uuid AND site = $2 AND type = 'tava_la')::int AS tava_la_count,
              (
                SELECT COUNT(*) FROM forum_reactions r
                WHERE r.type = 'mata' AND r.site = $2 AND (
                  (r.target_type = 'post'  AND r.target_id IN (SELECT id FROM forum_posts  WHERE user_id = $1::uuid AND site = $2))
                  OR
                  (r.target_type = 'topic' AND r.target_id IN (SELECT id FROM forum_topics WHERE user_id = $1::uuid AND site = $2))
                )
              )::int AS likes_received,
              (
                SELECT COUNT(*) + 1 FROM (
                  SELECT user_id, COUNT(*) c FROM forum_posts WHERE site = $2 GROUP BY user_id
                ) x WHERE x.c > (SELECT COUNT(*) FROM forum_posts WHERE user_id = $1::uuid AND site = $2)
              )::int AS rank_pos
            """,
            user_id, site,
        )

        recent = await conn.fetch(
            """
            SELECT 'post' AS kind, p.id::text, p.created_at::text, p.body, t.title AS target_title, t.id::text AS target_id
            FROM forum_posts p JOIN forum_topics t ON t.id = p.topic_id
            WHERE p.user_id = $1::uuid AND p.site = $2
            UNION ALL
            SELECT 'topic' AS kind, t.id::text, t.created_at::text, t.body, t.title AS target_title, t.id::text AS target_id
            FROM forum_topics t WHERE t.user_id = $1::uuid AND t.site = $2
            ORDER BY 3 DESC
            LIMIT 10
            """,
            user_id, site,
        )

    p, t, tl = stats["posts_count"], stats["topics_count"], stats["tava_la_count"]
    return {
        "user_id": u["id"],
        "display_name": u["display_name"],
        "avatar_url": u["avatar_url"],
        "created_at": u["created_at"],
        "bio": u["bio"],
        "email": u["email"],
        "birth_year": u["birth_year"],
        "city": u["city"],
        "shows_attended": list(u["shows_attended"] or []),
        "posts_count": p,
        "topics_count": t,
        "tava_la_count": tl,
        "likes_received": stats["likes_received"],
        "rank_pos": stats["rank_pos"],
        "veterano": p >= 100,
        "arquivista": t >= 8,
        "recent_activity": [
            {"kind": r["kind"], "id": r["id"], "created_at": r["created_at"], "snippet": (r["body"] or "")[:200], "target_title": r["target_title"], "target_id": r["target_id"]}
            for r in recent
        ],
    }


@router.patch("/users/me", tags=["Forum"])
async def update_my_profile(
    payload: UserProfileUpdate,
    user_id: str = Depends(require_auth),
):
    """Permite ao usuário logado editar bio, email, ano de nascimento, cidade e shows que esteve."""
    fields = []
    values: list = []
    idx = 1
    for col, val in [
        ("display_name", payload.display_name),
        ("bio", payload.bio),
        ("email", payload.email),
        ("birth_year", payload.birth_year),
        ("city", payload.city),
        ("shows_attended", payload.shows_attended),
    ]:
        if val is not None:
            fields.append(f"{col} = ${idx}")
            values.append(val)
            idx += 1
    if not fields:
        return {"updated": False, "reason": "nada pra atualizar"}
    values.append(user_id)
    sql = f"UPDATE forum_users SET {', '.join(fields)} WHERE id = ${idx}::uuid"  # noqa: S608 (col names whitelisted, values via placeholders)
    async with get_conn() as conn:
        await conn.execute(sql, *values)
    logger.info("Perfil atualizado user_id=%s fields=%s", user_id, [f.split(" = ")[0] for f in fields])
    return {"updated": True, "fields": len(fields)}


@router.get("/users/{user_id}/badges", tags=["Forum"])
async def get_user_badges(user_id: str, request: Request):
    """Badges automáticos derivados de counts. Cacheável."""
    site = resolve_site(request)
    async with get_conn() as conn:
        row = await conn.fetchrow(
            """
            SELECT
              (SELECT COUNT(*) FROM forum_posts  WHERE user_id = $1::uuid AND site = $2)::int AS posts_count,
              (SELECT COUNT(*) FROM forum_topics WHERE user_id = $1::uuid AND site = $2)::int AS topics_count,
              (SELECT COUNT(*) FROM forum_reactions WHERE user_id = $1::uuid AND site = $2 AND type = 'tava_la')::int AS tava_la_count
            """,
            user_id, site,
        )
    if not row:
        return {"veterano": False, "arquivista": False, "tava_la": 0}
    p, t, tl = row["posts_count"], row["topics_count"], row["tava_la_count"]
    return {
        "posts_count": p,
        "topics_count": t,
        "tava_la_count": tl,
        "veterano": p >= 100,
        "arquivista": t >= 8,
        "tava_la": tl,
    }


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
    user_id: str = Depends(require_auth),
):
    site = resolve_site(request)
    async with get_conn() as conn:
        exists = await conn.fetchval(
            "SELECT 1 FROM forum_topics WHERE id = $1::uuid AND site = $2",
            topic_id, site,
        )
        if not exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tópico não encontrado")

        post_id = str(uuid.uuid4())
        async with conn.transaction():
            row = await conn.fetchrow(
                """
                INSERT INTO forum_posts (id, topic_id, body, site, user_id)
                VALUES ($1::uuid, $2::uuid, $3, $4, $5::uuid)
                RETURNING id::text, user_id::text, topic_id::text, body, site, created_at::text
                """,
                post_id, topic_id, payload.body, site, user_id,
            )
            await conn.execute(
                "UPDATE forum_topics SET last_post_at = now() WHERE id = $1::uuid AND site = $2",
                topic_id, site,
            )
        user = await conn.fetchrow(
            "SELECT display_name, avatar_url FROM forum_users WHERE id = $1::uuid", user_id
        )

    logger.info("Nova resposta id=%s site=%s topic=%s user=%s", post_id, site, topic_id, user_id)
    return PostOut(
        **dict(row),
        display_name=user["display_name"],
        avatar_url=user["avatar_url"],
        reactions={},
        my_reactions=[],
    )


@router.post("/reactions", status_code=status.HTTP_200_OK, tags=["Forum"])
@limiter.limit("30/minute")
async def toggle_reaction(
    request: Request,
    payload: ReactionCreate,
    user_id: str = Depends(require_auth),
):
    site = resolve_site(request)
    table = "forum_topics" if payload.target_type == "topic" else "forum_posts"
    async with get_conn() as conn:
        exists = await conn.fetchval(
            f"SELECT 1 FROM {table} WHERE id = $1::uuid AND site = $2",  # noqa: S608 (table de whitelist binaria)
            payload.target_id, site,
        )
        if not exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alvo não encontrado")

        already = await conn.fetchval(
            """
            SELECT 1 FROM forum_reactions
            WHERE user_id = $1::uuid AND target_id = $2::uuid AND target_type = $3 AND type = $4
            """,
            user_id, payload.target_id, payload.target_type, payload.type,
        )
        if already:
            await conn.execute(
                """
                DELETE FROM forum_reactions
                WHERE user_id = $1::uuid AND target_id = $2::uuid AND target_type = $3 AND type = $4
                """,
                user_id, payload.target_id, payload.target_type, payload.type,
            )
            active = False
        else:
            await conn.execute(
                """
                INSERT INTO forum_reactions (id, target_id, target_type, type, user_id, site)
                VALUES ($1::uuid, $2::uuid, $3, $4, $5::uuid, $6)
                ON CONFLICT (user_id, target_id, target_type, type) DO NOTHING
                """,
                str(uuid.uuid4()), payload.target_id, payload.target_type,
                payload.type, user_id, site,
            )
            active = True

        count = await conn.fetchval(
            """
            SELECT COUNT(*) FROM forum_reactions
            WHERE target_id = $1::uuid AND target_type = $2 AND type = $3
            """,
            payload.target_id, payload.target_type, payload.type,
        )

    return {"active": active, "count": int(count or 0)}


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Forum"])
async def delete_post(
    post_id: str,
    request: Request,
    user_id: str = Depends(require_auth),
):
    """Apaga uma resposta. Autor ou admin podem apagar."""
    site = resolve_site(request)
    async with get_conn() as conn:
        owner = await conn.fetchval(
            "SELECT user_id::text FROM forum_posts WHERE id = $1::uuid AND site = $2",
            post_id, site,
        )
        if not owner:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resposta não encontrada")
        if owner != user_id and not settings.is_admin(user_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão pra apagar.")
        await conn.execute(
            "DELETE FROM forum_posts WHERE id = $1::uuid AND site = $2",
            post_id, site,
        )
    logger.info("Post apagado id=%s por user=%s admin=%s", post_id, user_id, settings.is_admin(user_id))


@router.delete("/topics/{topic_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Forum"])
async def delete_topic(
    topic_id: str,
    request: Request,
    user_id: str = Depends(require_auth),
):
    """Apaga um tópico inteiro (e respostas em cascata). Autor ou admin podem apagar."""
    site = resolve_site(request)
    async with get_conn() as conn:
        owner = await conn.fetchval(
            "SELECT user_id::text FROM forum_topics WHERE id = $1::uuid AND site = $2",
            topic_id, site,
        )
        if not owner:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tópico não encontrado")
        if owner != user_id and not settings.is_admin(user_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão pra apagar.")
        await conn.execute(
            "DELETE FROM forum_topics WHERE id = $1::uuid AND site = $2",
            topic_id, site,
        )
    logger.info("Tópico apagado id=%s por user=%s admin=%s", topic_id, user_id, settings.is_admin(user_id))


@router.post("/reports", status_code=status.HTTP_201_CREATED, tags=["Forum"])
async def create_report(
    request: Request,
    payload: ReportCreate,
    user_id: str = Depends(require_auth),
):
    site = resolve_site(request)
    report_id = str(uuid.uuid4())
    async with get_conn() as conn:
        await conn.execute(
            """
            INSERT INTO forum_reports (id, target_id, target_type, reason, reporter_id, site)
            VALUES ($1::uuid, $2::uuid, $3, $4, $5::uuid, $6)
            """,
            report_id, payload.target_id, payload.target_type, payload.reason, user_id, site,
        )
    logger.info("Report id=%s site=%s target=%s/%s", report_id, site, payload.target_type, payload.target_id)
    return {"status": "ok", "id": report_id}
