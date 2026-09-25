"""SQL do módulo. Só toca contrib_submissions (e lê forum_users no admin)."""
import json
from datetime import datetime

# Trava de transação que serializa a escolha de slot e o limite diário.
LOCK_SQL = "SELECT pg_advisory_xact_lock(hashtext('contrib_submissions'))"

_COLS = """id::text, status, title, body, media, scheduled_at, reason, created_at"""


async def count_since(conn, user_id: str, since: datetime) -> int:
    return await conn.fetchval(
        "SELECT COUNT(*) FROM contrib_submissions WHERE user_id = $1::uuid AND created_at >= $2",
        user_id, since,
    ) or 0


async def taken_slots(conn, site: str, since: datetime) -> set[datetime]:
    rows = await conn.fetch(
        """
        SELECT scheduled_at FROM contrib_submissions
        WHERE site = $1 AND scheduled_at >= $2 AND status NOT IN ('recusado', 'cancelado')
        """,
        site, since,
    )
    return {r["scheduled_at"] for r in rows}


async def insert(conn, *, id, site, user_id, title, body, media, scheduled_at, now):
    return await conn.fetchrow(
        f"""
        INSERT INTO contrib_submissions
          (id, site, user_id, title, body, media, agreed_rules_at, scheduled_at)
        VALUES ($1::uuid, $2, $3::uuid, $4, $5, $6::jsonb, $7, $8)
        RETURNING {_COLS}
        """,
        id, site, user_id, title, body, json.dumps(media), now, scheduled_at,
    )


async def list_mine(conn, user_id: str, site: str, limit: int = 50):
    return await conn.fetch(
        f"""
        SELECT {_COLS} FROM contrib_submissions
        WHERE user_id = $1::uuid AND site = $2
        ORDER BY created_at DESC LIMIT $3
        """,
        user_id, site, limit,
    )


async def cancel(conn, submission_id: str, user_id: str) -> str | None:
    """Cancela só se ainda está 'enviado'. Devolve o status atual (None = não existe/não é dono)."""
    status = await conn.fetchval(
        "SELECT status FROM contrib_submissions WHERE id = $1::uuid AND user_id = $2::uuid",
        submission_id, user_id,
    )
    if status == "enviado":
        await conn.execute(
            "UPDATE contrib_submissions SET status = 'cancelado', updated_at = now() WHERE id = $1::uuid",
            submission_id,
        )
        return "cancelado"
    return status


async def list_all(conn, site: str, limit: int = 100):
    return await conn.fetch(
        """
        SELECT s.id::text, s.status, s.title, s.body, s.media, s.scheduled_at,
               s.reason, s.created_at, u.display_name
        FROM contrib_submissions s JOIN forum_users u ON u.id = s.user_id
        WHERE s.site = $1 ORDER BY s.created_at DESC LIMIT $2
        """,
        site, limit,
    )


def media_of(row) -> list[dict]:
    """asyncpg devolve jsonb como str; normaliza pra lista."""
    value = row["media"]
    return json.loads(value) if isinstance(value, str) else list(value or [])
