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


def _dia(d, h, m):
    return datetime(2026, 9, d, h, m, tzinfo=UTC)


@pytest.mark.parametrize("agora,esperado", [
    (_utc(17, 10), _utc(20, 30)),  # 14h10 BRT sai 17h30
    (_utc(19, 59), _utc(20, 30)),  # folga de 31 min, cabe
    (_utc(20, 0), _utc(20, 30)),  # folga de 30 min exatos, cabe
    (_utc(20, 1), _utc(22, 30)),  # 29 min, pula pro seguinte
    (_utc(20, 30), _utc(22, 30)),
    (_utc(23, 40), _dia(25, 2, 30)),  # vira o dia em UTC
    (_dia(25, 2, 5), _dia(25, 4, 30)),
    (_dia(25, 4, 0), _dia(25, 4, 30)),
    (_dia(25, 5, 0), _dia(25, 8, 30)),
])
def test_proximo_slot_e_o_horario_fixo_com_folga(agora, esperado):
    assert agenda.proximo_slot(agora) == esperado


def test_horarios_casam_com_o_news_fetch_mais_30_min():
    # Mudou aqui? Mude o gatilho "Contrib Curadoria" do TriggerAll e colab/api.js.
    assert agenda.HORAS_UTC == (2, 4, 8, 11, 14, 16, 20, 22)
    rotulos = [agenda.hora_brt(_utc(h, agenda.MINUTO)) for h in agenda.HORAS_UTC]
    assert rotulos == ["23h30", "1h30", "5h30", "8h30", "11h30", "13h30", "17h30", "19h30"]


def test_todo_slot_e_um_horario_fixo():
    agora = _utc(0, 0)
    for _ in range(200):
        slot = agenda.proximo_slot(agora)
        assert slot.minute == agenda.MINUTO and slot.hour in agenda.HORAS_UTC
        assert slot - agora >= agenda.FOLGA
        agora += timedelta(minutes=7)


def test_slot_ocupado_pula_pro_horario_seguinte():
    ocupados = {_utc(20, 30), _utc(22, 30)}
    assert agenda.escolher_slot(_utc(17, 10), ocupados) == _dia(25, 2, 30)


def test_ocupado_antes_do_proximo_nao_atrapalha():
    assert agenda.escolher_slot(_utc(17, 10), {_utc(16, 30)}) == _utc(20, 30)


def test_agenda_cheia_falha():
    slots = agenda._horarios_desde(_utc(0, 0))
    ocupados = {s for s in (next(slots) for _ in range(80)) if s >= _utc(20, 30)}
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
