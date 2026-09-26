"""Colaboradores: agenda, assinatura R2 e limite de tamanho dos arquivos (regra 0)."""
import re
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from app.contrib import agenda
from app.contrib.r2 import presign

MAX_LINHAS = 160
MAX_COLUNAS = 130  # largura máxima de linha, pra leitura fácil (gente e IA)
# Sobe até achar app/contrib: aqui os testes ficam em tests/, no Terra Gentil em tests/contrib/.
PASTA = next(p / "app" / "contrib" for p in Path(__file__).resolve().parents if (p / "app" / "contrib").is_dir())


def _utc(h, m):
    return datetime(2026, 9, 24, h, m, tzinfo=UTC)


@pytest.mark.parametrize("agora,esperado", [
    (_utc(17, 10), _utc(18, 30)),
    (_utc(17, 50), _utc(18, 30)),
    (_utc(17, 0), _utc(18, 30)),
    (_utc(23, 40), datetime(2026, 9, 25, 0, 30, tzinfo=UTC)),
])
def test_proximo_slot_e_sempre_meia_da_proxima_hora(agora, esperado):
    assert agenda.proximo_slot(agora) == esperado


def test_slot_ocupado_pula_pra_hora_seguinte():
    ocupados = {_utc(18, 30), _utc(19, 30)}
    assert agenda.escolher_slot(_utc(17, 10), ocupados) == _utc(20, 30)


def test_agenda_cheia_falha():
    ocupados = {_utc(18, 30) + timedelta(hours=i) for i in range(agenda.MAX_SALTOS)}
    with pytest.raises(ValueError):
        agenda.escolher_slot(_utc(17, 10), ocupados)


def test_dia_do_limite_e_em_brasilia():
    # 02h UTC do dia 25 ainda é 23h do dia 24 em Brasília
    assert agenda.inicio_do_dia_brt(datetime(2026, 9, 25, 2, 0, tzinfo=UTC)) == _utc(3, 0)


def test_rotulo_em_horario_de_brasilia():
    assert agenda.hora_brt(_utc(18, 30)) == "15h30"


def test_presign_bate_com_exemplo_oficial_da_aws():
    # Vetor da documentação "Authenticating Requests: Using Query Parameters" (S3 SigV4)
    url = presign(
        method="GET", host="examplebucket.s3.amazonaws.com", path="/test.txt",
        access_key="AKIAIOSFODNN7EXAMPLE", secret_key="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        region="us-east-1", expires=86400, now=datetime(2013, 5, 24, tzinfo=UTC),
    )
    assert url.endswith("X-Amz-Signature=aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404")


def test_presign_assina_tamanho_e_tipo():
    url = presign(
        method="PUT", host="h", path="/b/k.jpg", access_key="a", secret_key="s",
        headers={"Content-Type": "image/jpeg", "Content-Length": "10"},
    )
    assert "X-Amz-SignedHeaders=content-length%3Bcontent-type%3Bhost" in url


@pytest.mark.parametrize("arquivo", sorted(PASTA.glob("*.py")), ids=lambda p: p.name)
def test_regra_zero_arquivos_curtos(arquivo):
    linhas = len(arquivo.read_text(encoding="utf-8").splitlines())
    assert linhas <= MAX_LINHAS, f"{arquivo.name} tem {linhas} linhas (máx {MAX_LINHAS}); quebrar em módulos"


@pytest.mark.parametrize("arquivo", sorted(PASTA.glob("*.py")), ids=lambda p: p.name)
def test_regra_zero_linhas_estreitas(arquivo):
    largas = [n for n, linha in enumerate(arquivo.read_text(encoding="utf-8").splitlines(), 1)
              if len(linha) > MAX_COLUNAS]
    assert not largas, f"{arquivo.name}: linhas {largas} passam de {MAX_COLUNAS} caracteres"


# O módulo também roda no backend do Terra Gentil (scripts/contrib/sync-terra-gentil.sh).
# Do host ele só pode usar o que existe igual nos dois: settings e get_conn.
IMPORTS_DO_HOST = {"app.core.config", "app.services.db"}


@pytest.mark.parametrize("arquivo", sorted(PASTA.glob("*.py")), ids=lambda p: p.name)
def test_portavel_so_importa_do_host_o_que_o_terra_gentil_tem(arquivo):
    usados = set(re.findall(r"^from (app\.[\w.]+) import", arquivo.read_text(encoding="utf-8"), re.M))
    extras = {m for m in usados if not m.startswith("app.contrib")} - IMPORTS_DO_HOST
    assert not extras, f"{arquivo.name} importa {extras}, que não existe no Terra Gentil"
