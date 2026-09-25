"""Quem pode postar: acesso só por convite, aprovado pelo Andre.

Fluxos:
- Andre cadastra o Gmail antes (admin) -> a pessoa confirma o Gmail -> já entra aprovada.
- A pessoa pede sozinha -> fica "pendente" até o Andre aprovar.
- "bloqueado" corta o acesso sem apagar o histórico.
"""
from fastapi import Depends, HTTPException

from app.dependencies import require_auth
from app.services.db import get_conn

STATUS = ("pendente", "aprovado", "bloqueado")
_COLS = "email, user_id::text, nome, status, pedido_em, decidido_em"


async def status_do_usuario(conn, user_id: str) -> str | None:
    return await conn.fetchval("SELECT status FROM contrib_membros WHERE user_id = $1::uuid", user_id)


async def vincular(conn, *, email: str, user_id: str, nome: str | None) -> str:
    """Liga o Gmail confirmado ao usuário do fórum. Devolve o status resultante."""
    row = await conn.fetchrow("SELECT user_id::text, status FROM contrib_membros WHERE email = $1", email)
    if row and row["user_id"] and row["user_id"] != user_id:
        raise HTTPException(409, "Esse Gmail já está ligado a outra conta.")
    if row:
        await conn.execute(
            "UPDATE contrib_membros SET user_id = $2::uuid, nome = COALESCE(nome, $3) WHERE email = $1",
            email, user_id, nome,
        )
        return row["status"]
    await conn.execute(
        "INSERT INTO contrib_membros (email, user_id, nome, status) VALUES ($1, $2::uuid, $3, 'pendente')",
        email, user_id, nome,
    )
    return "pendente"


async def definir(conn, *, email: str, status: str) -> None:
    """Admin: convida (cria já aprovado), aprova ou bloqueia."""
    await conn.execute(
        """
        INSERT INTO contrib_membros (email, status, decidido_em) VALUES ($1, $2, now())
        ON CONFLICT (email) DO UPDATE SET status = EXCLUDED.status, decidido_em = now()
        """,
        email, status,
    )


async def listar(conn):
    return await conn.fetch(f"SELECT {_COLS} FROM contrib_membros ORDER BY pedido_em DESC LIMIT 200")


async def require_membro(user_id: str = Depends(require_auth)) -> str:
    """Dependência das rotas de envio: só membro aprovado passa."""
    async with get_conn() as conn:
        status = await status_do_usuario(conn, user_id)
    if status != "aprovado":
        raise HTTPException(403, "Acesso de colaborador ainda não aprovado.")
    return user_id
