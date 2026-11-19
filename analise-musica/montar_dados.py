"""Monta o dados.json do reel "Som x Letra" de uma música a partir do roteiro (roteiros/<slug>.json) e das medições
no SSD. Usa o dados do Black (design/dados-black-v2.json) como molde e troca só o que muda por música.
Uso: python montar_dados.py roteiros/<slug>.json <pasta_reel>   (grava dados.json e dados.js na pasta)"""
import json
import sys
from pathlib import Path
import numpy as np
import pandas as pd
import ranking as r
from config import SAIDA

AQUI = Path(__file__).parent
PT = {"LOVE": "AMOR", "SORROW": "TRISTEZA", "RESIGNATION": "RESIGNAÇÃO", "DEFIANCE": "REBELDIA", "BITTERNESS": "AMARGURA",
      "SADNESS": "TRISTEZA", "DESPAIR": "DESESPERO", "HOPE": "ESPERANÇA", "LONGING": "SAUDADE", "GUILT": "CULPA",
      "HORROR": "HORROR", "DEVOTION": "DEVOÇÃO", "SERENITY": "SERENIDADE", "UNEASE": "INQUIETAÇÃO", "PAIN": "DOR",
      "GRIEF": "LUTO", "LOSS": "PERDA", "ANGUISH": "ANGÚSTIA", "LONELINESS": "SOLIDÃO", "DREAD": "PAVOR"}
rot = lambda s: f"{int(s // 60)}:{int(s % 60):02d}"


def som_do_disco(disco):
    h = pd.read_csv(SAIDA / f"humor-{disco}-seg.csv")
    h = h[~h.faixa.str.contains(r.BONUS)]
    if disco != "ten-1991":  # mesma régua do ranking.py
        dp = h.valencia.std()
        h = h.assign(valencia_sd=(h.valencia - h.valencia.mean()) / dp, valencia_disp_sd=h.valencia_disp / dp)
    return h


def medidas(disco, faixa, de, ate):
    arq = SAIDA / ("medidas-ten-1991.csv" if disco == "ten-1991" else f"medidas-{disco}.csv")
    m = pd.read_csv(arq)
    m = m[~m.faixa.str.contains(r.BONUS)]
    z = lambda c: (m[c] - m[c].mean()) / m[c].std()
    m = m.assign(vol=z("lufs"), agu=z("centroide_hz"))
    f = m[m.faixa.map(r.limpa) == faixa.lower()]
    pts = [f.iloc[(f.t - t).abs().argmin()] for t in range(int(de), int(ate) + 1, 2)]
    return [[int(round(p.t)), round(float(p.vol), 2)] for p in pts], [[int(round(p.t)), round(float(p.agu), 2)] for p in pts]


def main():
    rt = json.load(open(sys.argv[1]))
    pasta = Path(sys.argv[2])
    d = json.load(open(AQUI / "design" / "dados-black-v2.json"))
    ini = float(rt["ini"])
    fim = ini + 42
    nome, disco_nome, faixa = rt["faixa"], rt["nome_disco"], rt["faixa"]

    h = som_do_disco(rt["disco"])
    som = h[h.faixa.map(r.limpa) == faixa.lower()]
    w = som[(som.t >= ini - 15) & (som.t <= fim + 5)]
    d["som"] = {"curva_30s": [[round(t, 1), round(v, 2)] for t, v in zip(w.t, w.valencia_sd)],
                "incerteza_sd": round(float(som[(som.t >= ini) & (som.t <= fim)].valencia_disp_sd.mean()), 2)}
    vol, agu = medidas(rt["disco"], faixa, ini - 15, fim + 5)
    d["volume"], d["agudos"] = {"curva": vol}, {"curva": agu}

    g = r.letras_do_disco(SAIDA / rt["pasta_letra"])
    L = g[g.faixa.map(r.limpa) == faixa.lower()].sort_values("k")
    Lw = L[(L.k >= ini) & (L.k < fim)]
    verso = lambda x: {"t": float(x.k), "sd": round(float(x.sd), 2), "disp": round(float(x.disp), 2),
                       "emocao": x.emocao, "emocao_pt": PT.get(x.emocao, x.emocao)}
    antes = L[L.k < ini]
    d["letra"] = {"versos": [verso(x) for x in Lw.itertuples()],
                  "incerteza_sd": round(float(Lw.disp.mean()), 2)}
    if len(antes):
        d["letra"]["verso_anterior"] = {k: v for k, v in verso(antes.iloc[-1]).items() if k != "disp"}

    som_em = lambda t: float(np.interp(t, som.t, som.valencia_sd))
    secoes = []
    for nome_s, a, b in rt["secoes"]:
        x = som[(som.t >= a) & (som.t < b)]
        lv = Lw[(Lw.k >= a) & (Lw.k < b)]
        secoes.append({"nome": nome_s, "ini": a, "fim": b, "som_sd": round(float(x.valencia_sd.mean()), 2),
                       "letra_sd": round(float(lv.sd.mean()), 2) if len(lv) else None})
    d["secoes"] = secoes
    longe = max(Lw.itertuples(), key=lambda x: abs(som_em(x.k) - x.sd))
    d["maior_divergencia"] = {"t": float(longe.k), "rotulo": "MAIOR DISTÂNCIA"}
    d["anotacoes"][0].update({"de_t": secoes[-1]["ini"], "ate_t": secoes[-1]["fim"], "texto": rt.get("anotacao", d["anotacoes"][0]["texto"])})

    d.update({"musica": nome, "disco": disco_nome, "ano": rt["ano"], "momentos": [{"t_musica": t, "texto": tx} for t, tx in rt["momentos"]],
              "ranking_letra_disco": "", "nota": f"valores em desvios-padrão (SD) contra a média do próprio disco; 0 = média do {disco_nome}"})
    d["trecho"] = {"ini_s": ini, "fim_s": fim, "ini_rotulo": rot(ini), "fim_rotulo": rot(fim), "duracao_video_s": 42}
    d["rotulos"].update({"pergunta": rt["pergunta"], "media": f"média do {disco_nome}", "veredito": rt["veredito"],
                         "maior_distancia": "MAIOR DISTÂNCIA"})
    d["fundo_video"]["src"] = "fundo.mp4"
    d["cta"]["linha1"] = f"Qual o seu sentimento escutando {nome}?"

    voz = json.load(open(pasta / "voz.json"))  # gerado pelo voz.mjs: frases da abertura com tempos reais
    d["abertura"].update({"duracao_s": voz["abertura_s"], "frases": voz["frases"], "narracao": "voz.mjs",
                          "clipes": [f"clipe-{i}.mp4" for i in range(1, len(rt["abertura_clipes"]) + 1)]})
    inicio = ini - voz["abertura_s"]
    d["instagram_musica"] = {"faixa": nome, "inicio_na_biblioteca": rot(inicio),
                             "nota": "a música do IG começa antes do trecho para o gráfico pegar o início exato"}
    json.dump(d, open(pasta / "dados.json", "w"), ensure_ascii=False, indent=1)
    open(pasta / "dados.js", "w").write("window.SOM_LETRA_DADOS = " + json.dumps(d, ensure_ascii=False, indent=1) + ";\n")
    print(f"[dados] {nome} {rot(ini)}-{rot(fim)} versos={len(Lw)} secoes={[(s['nome'], s['som_sd'], s['letra_sd']) for s in secoes]}"
          f" maior={longe.k} IG a partir de {rot(inicio)}")


if __name__ == "__main__":
    main()
