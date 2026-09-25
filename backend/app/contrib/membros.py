"""Quem pode postar: acesso só por convite, aprovado pelo Andre.

Fluxos:
- Andre convida o Gmail antes (admin) -> no primeiro login a pessoa já entra aprovada.
- A pessoa entra sozinha -> fica "pendente" até o Andre aprovar.
- "bloqueado" corta o acesso sem apagar o histórico.
"""
STATUS = ("pendente", "aprovado", "bloqueado")
_COLS = "id::text, email, nome, avatar, instagram, status, pedido_em, decidido_em, (google_sub IS NOT NULL) AS entrou"


async def entrar(conn, *, id: str, email: str, sub: str, nome: str | None, avatar: str | None) -> str:
    """Login pelo Google. Casa com convite pendente pelo e-mail. Devolve o status."""
    row = await conn.fetchrow("SELECT google_sub, status FROM contrib_membros WHERE email = $1", email)
    if row and row["google_sub"] and row["google_sub"] != sub:
        raise ValueError("Gmail ligado a outra conta Google")
    if row:
        await conn.execute(
            """
            UPDATE contrib_membros SET id = $2::uuid, google_sub = $3, nome = $4, avatar = $5
            WHERE email = $1
            """,
            email, id, sub, nome, avatar,
        )
        return row["status"]
    await conn.execute(
        """
        INSERT INTO contrib_membros (id, email, google_sub, nome, avatar, status)
        VALUES ($1::uuid, $2, $3, $4, $5, 'pendente')
        """,
        id, email, sub, nome, avatar,
    )
    return "pendente"


async def perfil_de(conn, id: str):
    """(status, instagram) do membro, ou None se não existe."""
    return await conn.fetchrow("SELECT status, instagram FROM contrib_membros WHERE id = $1::uuid", id)


async def definir(conn, *, email: str, status: str, novo_id: str) -> None:
    """Admin: convida (cria já aprovado), aprova ou bloqueia."""
    await conn.execute(
        """
        INSERT INTO contrib_membros (id, email, status, decidido_em) VALUES ($3::uuid, $1, $2, now())
        ON CONFLICT (email) DO UPDATE SET status = EXCLUDED.status, decidido_em = now()
        """,
        email, status, novo_id,
    )


async def listar(conn):
    return await conn.fetch(f"SELECT {_COLS} FROM contrib_membros ORDER BY pedido_em DESC LIMIT 200")
