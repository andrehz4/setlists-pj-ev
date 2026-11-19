"""Curva de humor do som por faixa, em SD contra a média do disco (método datascrolls).
Janela de 30 s (6 trechos de 5 s do MERT), 9 modelos por eixo -> média e dispersão.
Referência: disco de referência (ex.: Redux) + offset da mixagem medida (ex.: 1991).
Uso: python humor.py <emb_medida> <emb_referencia>   ->  SAIDA/humor-<emb_medida>.csv"""
import sys
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import os
from config import SAIDA, MODELOS

V = os.environ.get("VARIANTE", "")

JANELA = 6  # trechos de 5 s = 30 s


def curvas(nome, pacote):
    z = np.load(SAIDA / f"emb-{nome}.npz")
    emb, faixas, ini = z["emb"].astype(np.float32), z["faixa"], z["inicio"]
    linhas = []
    for f in dict.fromkeys(faixas):
        idx = np.where(faixas == f)[0]
        for k in range(len(idx)):
            sel = idx[max(0, k - JANELA // 2): k + JANELA // 2]
            linha = {"faixa": Path(f).stem, "t": ini[idx[k]] + 2.5}
            for eixo, ms in pacote["modelos"].items():
                x = emb[sel, pacote["camada"][eixo]].mean(0, keepdims=True)
                p = np.array([m.predict(x)[0] for m in ms])
                linha[eixo], linha[eixo + "_disp"] = p.mean(), p.std()
            linhas.append(linha)
    return pd.DataFrame(linhas)


def main():
    medida, referencia = sys.argv[1], sys.argv[2]
    pacote = joblib.load(MODELOS / f"humor{V}.joblib")
    med, ref = curvas(medida, pacote), curvas(referencia, pacote)
    for eixo in pacote["modelos"]:
        offset = med[eixo].mean() - ref[eixo].mean()  # diferença entre as mixagens
        dp = ref[eixo].std()
        med[eixo + "_sd"] = (med[eixo] - ref[eixo].mean() - offset) / dp
        med[eixo + "_disp_sd"] = med[eixo + "_disp"] / dp
    med.to_csv(SAIDA / f"humor-{medida}{V}.csv", index=False)
    print(f"[humor] {len(med)} pontos -> {SAIDA / f'humor-{medida}{V}.csv'}")


if __name__ == "__main__":
    main()
