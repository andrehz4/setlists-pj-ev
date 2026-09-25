"""SQL das rotas do robô de curadoria (bot.py)."""
import json
from datetime import UTC, datetime


def jsonb(value, padrao):
    """asyncpg devolve jsonb como str; normaliza."""
    if value is None:
        return padrao
    return json.loads(value) if isinstance(value, str) else value


async def fila(conn, limite: int = 10):
    return await conn.fetch(
        """
        SELECT s.id::text, s.title, s.body, s.media, s.video_opts, s.scheduled_at, m.nome, m.email
        FROM contrib_submissions s JOIN contrib_membros m ON m.id = s.user_id
        WHERE s.status = 'enviado'
        ORDER BY s.scheduled_at ASC LIMIT $1
        """,
        limite,
    )


async def travar(conn, submission_id: str):
    return await conn.fetchrow(
        """
        SELECT status, title, body, video_opts FROM contrib_submissions
        WHERE id = $1::uuid FOR UPDATE
        """,
        submission_id,
    )


async def gravar_veredito(conn, submission_id: str, *, status, title, body, video, reason, analise):
    await conn.execute(
        """
        UPDATE contrib_submissions
        SET status = $2, title = $3, body = $4, video_opts = COALESCE($5::jsonb, video_opts),
            reason = $6, ai_verdict = $7::jsonb, updated_at = now()
        WHERE id = $1::uuid
        """,
        submission_id, status, title, body, video, reason, analise,
    )


async def pedidos_novos(conn):
    return await conn.fetch(
        """
        UPDATE contrib_membros SET avisado_em = now()
        WHERE status = 'pendente' AND avisado_em IS NULL AND google_sub IS NOT NULL
        RETURNING email, nome, pedido_em
        """
    )


async def contagem(conn):
    return await conn.fetchrow(
        """
        SELECT (SELECT COUNT(*) FROM contrib_submissions WHERE status = 'enviado')::int AS fila,
               (SELECT COUNT(*) FROM contrib_membros
                WHERE status = 'pendente' AND avisado_em IS NULL AND google_sub IS NOT NULL)::int AS pedidos,
               (SELECT COUNT(*) FROM contrib_submissions
                WHERE status IN ('aprovado', 'ajustado') AND scheduled_at <= now() + interval '2 minutes')::int AS prontos
        """
    )


_PRONTO = "status IN ('aprovado', 'ajustado')"


async def prontos(conn, limite: int = 5):
    return await conn.fetch(
        f"""
        SELECT s.id::text, s.status, s.title, s.body, s.media, s.scheduled_at, s.ai_verdict, m.nome
        FROM contrib_submissions s JOIN contrib_membros m ON m.id = s.user_id
        WHERE s.{_PRONTO} AND s.scheduled_at <= now() + interval '2 minutes'
        ORDER BY s.scheduled_at ASC LIMIT $1
        """,
        limite,
    )


async def marcar_tentativa(conn, submission_id: str, caption: str) -> bool:
    r = await conn.execute(
        f"""
        UPDATE contrib_submissions
        SET ai_verdict = COALESCE(ai_verdict, '{{}}'::jsonb)
              || jsonb_build_object('publicacao', jsonb_build_object('tentativa_em', now(), 'caption', $2::text)),
            updated_at = now()
        WHERE id = $1::uuid AND {_PRONTO}
        """,
        submission_id, caption,
    )
    return r.endswith(" 1")


async def marcar_publicado(conn, submission_id: str, dados: dict) -> bool:
    r = await conn.execute(
        f"""
        UPDATE contrib_submissions
        SET status = 'publicado',
            ai_verdict = COALESCE(ai_verdict, '{{}}'::jsonb) || jsonb_build_object('publicado', $2::jsonb),
            updated_at = now()
        WHERE id = $1::uuid AND {_PRONTO}
        """,
        submission_id, json.dumps({**dados, "em": datetime.now(UTC).isoformat()}),
    )
    return r.endswith(" 1")
