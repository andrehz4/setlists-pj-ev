"""Volume (EBU R128) e agudos (centroide espectral) em janelas de 8 s, por faixa.
Uso: .venv/bin/python medidas.py <pasta_de_audio> <nome_saida>
Grava SAIDA/medidas-<nome>.csv com faixa, t (centro da janela, s), lufs, centroide_hz."""
import sys
import librosa
import numpy as np
import pandas as pd
import pyloudnorm as pyln
from config import SAIDA, JANELA_S, PASSO_S

SR = 44100


def medir_faixa(caminho):
    y, _ = librosa.load(caminho, sr=SR, mono=False)
    estereo = y.T if y.ndim == 2 else y
    mono = y.mean(axis=0) if y.ndim == 2 else y
    medidor = pyln.Meter(SR)
    jan, passo = int(JANELA_S * SR), int(PASSO_S * SR)
    cent = librosa.feature.spectral_centroid(y=mono, sr=SR, n_fft=4096, hop_length=2048)[0]
    linhas = []
    for ini in range(0, max(1, len(mono) - jan), passo):
        trecho = estereo[ini:ini + jan]
        lufs = medidor.integrated_loudness(trecho)
        a, b = ini // 2048, (ini + jan) // 2048
        linhas.append({"t": (ini + jan / 2) / SR, "lufs": lufs, "centroide_hz": float(np.mean(cent[a:b]))})
    return linhas


def main():
    pasta, nome = sys.argv[1], sys.argv[2]
    from pathlib import Path
    arquivos = sorted(p for p in Path(pasta).iterdir() if p.suffix in {".wav", ".opus", ".m4a", ".webm", ".mp3"})
    todas = []
    for arq in arquivos:
        for l in medir_faixa(str(arq)):
            todas.append({"faixa": arq.stem, **l})
        print(f"[medidas] {arq.stem}")
    df = pd.DataFrame(todas).replace(-np.inf, np.nan).dropna()
    SAIDA.mkdir(parents=True, exist_ok=True)
    df.to_csv(SAIDA / f"medidas-{nome}.csv", index=False)
    print(f"[medidas] {len(df)} janelas -> {SAIDA / f'medidas-{nome}.csv'}")


if __name__ == "__main__":
    main()
