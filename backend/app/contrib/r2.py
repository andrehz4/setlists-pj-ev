"""URLs pré-assinadas (AWS SigV4, query string) pro Cloudflare R2.

O navegador sobe o arquivo DIRETO pro R2 com a URL assinada; o Railway
nunca recebe o binário. Content-Type e Content-Length entram na assinatura,
então o tamanho declarado é o único aceito pelo R2.
Sem SDK de propósito: são ~60 linhas de hashlib/hmac e ficam testáveis.
"""
import hashlib
import hmac
from datetime import UTC, datetime
from urllib.parse import quote

ALGO = "AWS4-HMAC-SHA256"


def _hmac(key: bytes, msg: str) -> bytes:
    return hmac.new(key, msg.encode(), hashlib.sha256).digest()


def _enc(value: str, safe: str = "-_.~") -> str:
    return quote(value, safe=safe)


def presign(
    *,
    method: str,
    host: str,
    path: str,
    access_key: str,
    secret_key: str,
    region: str = "auto",
    expires: int = 900,
    headers: dict[str, str] | None = None,
    now: datetime | None = None,
) -> str:
    """Devolve a URL https assinada. `headers` (além do host) viram obrigatórios."""
    now = now or datetime.now(UTC)
    amz_date = now.strftime("%Y%m%dT%H%M%SZ")
    day = amz_date[:8]
    scope = f"{day}/{region}/s3/aws4_request"

    signed = {"host": host, **{k.lower(): str(v).strip() for k, v in (headers or {}).items()}}
    names = sorted(signed)
    signed_headers = ";".join(names)

    query = {
        "X-Amz-Algorithm": ALGO,
        "X-Amz-Credential": f"{access_key}/{scope}",
        "X-Amz-Date": amz_date,
        "X-Amz-Expires": str(expires),
        "X-Amz-SignedHeaders": signed_headers,
    }
    canonical_query = "&".join(f"{_enc(k)}={_enc(v)}" for k, v in sorted(query.items()))
    canonical_uri = _enc(path, safe="/-_.~")
    canonical_headers = "".join(f"{n}:{signed[n]}\n" for n in names)

    canonical_request = "\n".join(
        [method, canonical_uri, canonical_query, canonical_headers, signed_headers, "UNSIGNED-PAYLOAD"]
    )
    to_sign = "\n".join(
        [ALGO, amz_date, scope, hashlib.sha256(canonical_request.encode()).hexdigest()]
    )

    key = _hmac(("AWS4" + secret_key).encode(), day)
    for part in (region, "s3", "aws4_request"):
        key = _hmac(key, part)
    signature = hmac.new(key, to_sign.encode(), hashlib.sha256).hexdigest()

    return f"https://{host}{canonical_uri}?{canonical_query}&X-Amz-Signature={signature}"


def r2_url(settings, method: str, key: str, *, expires: int = 900, headers: dict | None = None) -> str:
    """Atalho pro bucket configurado em ContribSettings (path-style)."""
    return presign(
        method=method,
        host=f"{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        path=f"/{settings.R2_BUCKET}/{key}",
        access_key=settings.R2_ACCESS_KEY_ID,
        secret_key=settings.R2_SECRET_ACCESS_KEY,
        expires=expires,
        headers=headers,
    )
