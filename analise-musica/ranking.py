"""Ranking "Som x Letra": em cada música, acha a janela de ~42 s COM LETRA onde som e letra mais se descolam.
Tudo em SD contra a média do próprio disco. Regra de publicação: distância >= 1,5 SD e >= 2x (incerteza do som + dispersão da letra).
Uso: python ranking.py  ->  SAIDA/ranking.csv (lê humor-<disco>-seg.csv e letras/<disco>/notas-leitor-*.csv)"""
import re
from pathlib import Path
import numpy as np
import pandas as pd
from config import SAIDA

JANELA_S = 42
DISP_LETRA_PADRAO = 0.17  # dispersão média medida com 5 leitores no Ten
BONUS = re.compile(r"alternate|demo|only\)|remix|live|bonus|instrumental", re.I)  # versões extras de reedição


def letras_do_disco(pasta):
    arqs = sorted(pasta.glob("notas-leitor-*.csv"))
    if not arqs:
        return None
    a = pd.concat(pd.read_csv(f) for f in arqs)
    a = a[~a.faixa.str.contains(BONUS)]
    a["k"] = a.tempo_s.round(1)
    g = a.groupby(["faixa", "k"]).agg(nota=("nota", "mean"), disp=("nota", "std"),
                                      emocao=("emocao", lambda s: s.mode()[0])).reset_index()
    dp = g.nota.std()
    g["sd"] = (g.nota - g.nota.mean()) / dp
    g["disp"] = g.disp.fillna(DISP_LETRA_PADRAO * dp) / dp if len(arqs) > 1 else DISP_LETRA_PADRAO
    return g


def limpa(nome):
    return re.sub(r"^\d+-|\s*\((Remastered|Brendan O'Brien Mix)[^)]*\)", "", nome).strip().lower()


def melhor_janela(som, letra):
    melhor = None
    for ini in np.arange(som.t.min(), max(som.t.min() + 1, som.t.max() - JANELA_S), 2.5):
        s = som[(som.t >= ini) & (som.t < ini + JANELA_S)]
        L = letra[(letra.k >= ini) & (letra.k < ini + JANELA_S)]
        if len(L) < 3 or s.empty:
            continue
        lt = np.array([letra[letra.k <= t].sd.iloc[-1] if (letra.k <= t).any() else np.nan for t in s.t])
        dist = np.nanmean(s.valencia_sd.values - lt)
        margem = s.valencia_disp_sd.mean() + L.disp.mean()
        cand = {"ini_s": ini, "dist": dist, "margem": margem, "som": s.valencia_sd.mean(), "letra": L.sd.mean(),
                "emocao": L.loc[L.sd.idxmin(), "emocao"], "versos": len(L)}
        if melhor is None or abs(cand["dist"]) > abs(melhor["dist"]):
            melhor = cand
    return melhor


def main():
    linhas = []
    for curva in sorted(SAIDA.glob("humor-*-seg.csv")):
        disco = curva.stem[len("humor-"):-len("-seg")]
        pasta = SAIDA / "letras" / disco if disco != "ten-1991" else SAIDA / "letras-ten"
        g = letras_do_disco(pasta)
        if g is None:
            continue
        h = pd.read_csv(curva)
        h = h[~h.faixa.str.contains(BONUS)]
        if disco != "ten-1991":  # renormaliza contra o disco SEM as faixas bônus (o Ten usa o Redux de referência)
            dp = h.valencia.std()
            h = h.assign(valencia_sd=(h.valencia - h.valencia.mean()) / dp, valencia_disp_sd=h.valencia_disp / dp)
        for faixa, som in h.groupby("faixa"):
            letra = g[g.faixa.map(limpa) == limpa(faixa)].sort_values("k")
            if letra.empty:
                continue
            m = melhor_janela(som, letra)
            if m:
                m.update({"disco": disco, "faixa": re.sub(r"^\d+-", "", faixa), "passa": abs(m["dist"]) >= max(1.5, 2 * m["margem"])})
                linhas.append(m)
    df = pd.DataFrame(linhas).sort_values("dist", key=abs, ascending=False)
    df["trecho"] = df.ini_s.map(lambda s: f"{int(s // 60)}:{int(s % 60):02d}")
    df.round(2).to_csv(SAIDA / "ranking.csv", index=False)
    print(df[["disco", "faixa", "trecho", "dist", "margem", "som", "letra", "emocao", "passa"]].round(2).head(40).to_string(index=False))
    print(f"\n[ranking] {len(df)} músicas, {int(df.passa.sum())} passam na regra -> {SAIDA / 'ranking.csv'}")


if __name__ == "__main__":
    main()
