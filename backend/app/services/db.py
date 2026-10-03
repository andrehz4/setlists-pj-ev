import logging
from contextlib import asynccontextmanager

import asyncpg

from app.core.config import settings

logger = logging.getLogger(__name__)

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        logger.info("Criando pool asyncpg para Supabase")
        # command_timeout: consulta travada não segura a conexão pra sempre.
        # statement_cache_size=0: compatível com o pooler do Supabase (porta 6543, modo transação).
        _pool = await asyncpg.create_pool(
            settings.DATABASE_URL, min_size=1, max_size=10, command_timeout=30, statement_cache_size=0
        )
    return _pool


@asynccontextmanager
async def get_conn():
    pool = await get_pool()
    async with pool.acquire() as conn:
        yield conn


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
