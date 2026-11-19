"""Treino POR SEGUNDO (padrão desde 19/11/2026): usa as notas dinâmicas da DEAM (2 por segundo) médias por trecho de 5 s.
Ensina o que muda DENTRO da música (refrão x outro). Em Black chegou a erro médio 0,13 SD contra o datascrolls.
3 tipos de modelo x 3 rodadas (amostras de músicas) = 9 por eixo.
Uso: python treino_seg.py   ->  MODELOS/humor-seg.joblib (humor.py lê com VARIANTE=-seg)"""
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.kernel_ridge import KernelRidge
from sklearn.linear_model import RidgeCV
from sklearn.model_selection import GroupKFold, cross_val_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVR
from config import SAIDA, TREINO, MODELOS

DIN = TREINO / "deam/annotations/annotations averaged per song/dynamic (per second annotations)"
CAMADA = {"valencia": 6, "energia": 5}  # melhores camadas do MERT-95M (treino.py)
TIPOS = {
    "ridge": lambda: RidgeCV(alphas=np.logspace(0, 5, 12)),
    "svr": lambda: SVR(C=1.0),
    "krr": lambda: KernelRidge(alpha=1.0, kernel="rbf", gamma=1.0 / 2048),
}


def dados(eixo, arquivo):
    din = pd.read_csv(DIN / arquivo).set_index("song_id")
    tempos = {int(c.split("_")[1][:-2]) / 1000: c for c in din.columns}
    z = np.load(SAIDA / "emb-deam.npz")
    ids = np.array([int(Path(f).stem) for f in z["faixa"]])
    emb = z["emb"][:, CAMADA[eixo]].astype(np.float32)
    X, y, g = [], [], []
    for i, (sid, t) in enumerate(zip(ids, z["inicio"])):
        if sid not in din.index:
            continue
        vals = din.loc[sid, [c for tt, c in tempos.items() if t <= tt < t + 5]].dropna()
        if len(vals) >= 6:
            X.append(emb[i]); y.append(vals.mean()); g.append(sid)
    return np.array(X), np.array(y), np.array(g)


def main():
    rng = np.random.default_rng(7)
    modelos = {}
    for eixo, arq in [("valencia", "valence.csv"), ("energia", "arousal.csv")]:
        X, y, g = dados(eixo, arq)
        musicas = np.unique(g)
        modelos[eixo] = []
        for tipo, fab in TIPOS.items():
            sub = rng.choice(len(y), min(len(y), 6000), replace=False)  # CV numa amostra (SVR/KRR são lentos)
            r2 = cross_val_score(make_pipeline(StandardScaler(), fab()), X[sub], y[sub], groups=g[sub],
                                 cv=GroupKFold(5), scoring="r2").mean()
            print(f"[treino-seg] {eixo} {tipo}: R² por trecho {r2:.3f}", flush=True)
            for _ in range(3):
                escolha = np.isin(g, rng.choice(musicas, len(musicas), replace=True))
                modelos[eixo].append(make_pipeline(StandardScaler(), fab()).fit(X[escolha], y[escolha]))
    MODELOS.mkdir(parents=True, exist_ok=True)
    joblib.dump({"camada": CAMADA, "modelos": modelos}, MODELOS / "humor-seg.joblib")
    print(f"[treino-seg] salvo em {MODELOS / 'humor-seg.joblib'}")


if __name__ == "__main__":
    main()
