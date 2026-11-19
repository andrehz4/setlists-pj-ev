"""Caminhos do módulo análise-musica. Dados pesados (áudio, bases, modelos, venv) ficam SEMPRE no SSD."""
from pathlib import Path

SSD = Path("/Volumes/SSD Terra Gentil/setlists-pj-ev/musica-x-letra")
AUDIO = SSD / "audio"            # ten-1991/, ten-redux/, albuns/<ano-disco>/
TREINO = SSD / "treino"          # bases de notas de ouvintes (deam/, pmemo/)
MODELOS = SSD / "modelos"        # cabeças de humor treinadas
SAIDA = SSD / "saida"            # CSVs de medição e quadros do vídeo
JANELA_S = 8.0                   # janela de medição (igual ao datascrolls)
PASSO_S = 0.5                    # resolução da curva

if not SSD.exists():
    raise SystemExit(f"SSD não montado: {SSD}")
