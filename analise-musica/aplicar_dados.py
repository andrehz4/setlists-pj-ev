"""Aplica os números finais e os arquivos locais no JSON que o Claude Design devolve (ele trabalha com uma cópia antiga).
Uso: python aplicar_dados.py <dados.json do design> <humor-<disco>-seg.csv> <faixa> <dados.js de saída>"""
import json
import sys
import pandas as pd

entrada, curva, faixa, saida_js = sys.argv[1:5]
d = json.load(open(entrada))
h = pd.read_csv(curva)
h = h[h.faixa.str.contains(faixa)]
ini, fim = d["trecho"]["ini_s"], d["trecho"]["fim_s"]
w = h[(h.t >= ini - 15) & (h.t <= fim + 5)]
d["som"]["curva_30s"] = [[round(t, 1), round(v, 2)] for t, v in zip(w.t, w.valencia_sd)]
d["som"]["incerteza_sd"] = round(float(h[(h.t >= ini) & (h.t <= fim)].valencia_disp_sd.mean()), 2)
for s in d["secoes"]:
    x = h[(h.t >= s["ini"]) & (h.t < s["fim"])]
    s["som_sd"] = round(float(x.valencia_sd.mean()), 2)
d["abertura"]["clipes"] = [f"clipe-{i}.mp4" for i in range(1, 7)]
d["fundo_video"]["src"] = "fundo-black-42s.mp4"
d.setdefault("instagram_musica", {})["inicio_na_biblioteca"] = f"{int((ini - d['abertura']['duracao_s']) // 60)}:{int((ini - d['abertura']['duracao_s']) % 60):02d}"
d["status_numeros"] = "finais (modelo por segundo)"
json.dump(d, open(entrada, "w"), ensure_ascii=False, indent=1)
open(saida_js, "w").write("window.SOM_LETRA_DADOS = " + json.dumps(d, ensure_ascii=False, indent=1) + ";\n")
print("[dados]", [s["som_sd"] for s in d["secoes"]], "música no IG a partir de", d["instagram_musica"]["inicio_na_biblioteca"])
