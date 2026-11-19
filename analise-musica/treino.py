"""Treina as cabeças de humor (valência e energia) em cima do MERT com as notas de ouvintes da DEAM.
3 tipos de modelo x 3 rodadas (amostras diferentes) = 9 por eixo, como o datascrolls (3 modelos, 3 runs).
Uso: [VARIANTE=-330] python treino.py   ->  MODELOS/humor.joblib + R² de validação cruzada no terminal."""
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import RidgeCV
from sklearn.model_selection import cross_val_score
from sklearn.kernel_ridge import KernelRidge
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVR
import os
from config import SAIDA, TREINO, MODELOS

V = os.environ.get("VARIANTE", "")  # ex.: "-330" para o MERT grande

NOTAS = TREINO / "deam/annotations/annotations averaged per song/song_level"
TIPOS = {
    "ridge": lambda s: RidgeCV(alphas=np.logspace(-1, 4, 12)),
    "svr": lambda s: SVR(C=3.0),
    "krr": lambda s: KernelRidge(alpha=1.0, kernel="rbf", gamma=1.0 / 2048),
}


def carregar():
    z = np.load(SAIDA / f"emb-deam{V}.npz")
    df = pd.DataFrame({"id": [int(Path(f).stem) for f in z["faixa"]], "ini": z["inicio"]})
    ok = (df.ini >= 15) | (df.id > 2000)  # trechos de 45 s só têm nota a partir dos 15 s
    emb = z["emb"].astype(np.float32)
    ids = sorted(df[ok].id.unique())
    X = np.stack([emb[(df.id == i).values & ok.values].mean(0) for i in ids])  # [músicas, camadas, dim]
    notas = pd.concat(pd.read_csv(f, skipinitialspace=True) for f in sorted(NOTAS.glob("*.csv")))
    notas = notas.set_index("song_id").loc[ids]
    return X, notas[["valence_mean", "arousal_mean"]].values


def main():
    X, Y = carregar()
    print(f"[treino] {len(X)} músicas, {X.shape[1]} camadas")
    escolha = {}
    for e, eixo in enumerate(["valencia", "energia"]):
        r2 = [cross_val_score(make_pipeline(StandardScaler(), RidgeCV(alphas=np.logspace(-1, 4, 12))),
                              X[:, c], Y[:, e], cv=5, scoring="r2").mean() for c in range(X.shape[1])]
        c = int(np.argmax(r2))
        escolha[eixo] = c
        print(f"[treino] {eixo}: melhor camada {c}, R² ridge {r2[c]:.3f}")
    modelos = {}
    rng = np.random.default_rng(7)
    for e, eixo in enumerate(["valencia", "energia"]):
        Xc, y = X[:, escolha[eixo]], Y[:, e]
        modelos[eixo] = []
        for tipo, fab in TIPOS.items():
            cv = cross_val_score(make_pipeline(StandardScaler(), fab(0)), Xc, y, cv=5, scoring="r2").mean()
            print(f"[treino] {eixo} {tipo}: R² {cv:.3f}")
            for rodada in range(3):
                amostra = rng.choice(len(y), len(y), replace=True)
                m = make_pipeline(StandardScaler(), fab(rodada)).fit(Xc[amostra], y[amostra])
                modelos[eixo].append(m)
    MODELOS.mkdir(parents=True, exist_ok=True)
    joblib.dump({"camada": escolha, "modelos": modelos}, MODELOS / f"humor{V}.joblib")
    print(f"[treino] salvo em {MODELOS / 'humor.joblib'}")


if __name__ == "__main__":
    main()
