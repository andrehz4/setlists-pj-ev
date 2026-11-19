"""Baixa a letra com tempo (LRCLIB, grátis) de cada faixa de uma pasta de disco. Fica só no SSD (direito autoral).
Uso: python letras.py <pasta_do_disco> <nome_disco>  ->  SAIDA/letras/<pasta>/<faixa>.json (+ _faltando.txt)"""
import json
import re
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path
from config import SAIDA

API = "https://lrclib.net/api"
UA = {"User-Agent": "analise-musica/0.1"}


def pedir(url):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20) as r:
            return json.load(r)
    except Exception:
        return None


def duracao(arq):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(arq)],
                         capture_output=True, text=True).stdout.strip()
    return round(float(out)) if out else 0


def buscar(titulo, disco, dur):
    q = urllib.parse.urlencode({"artist_name": "Pearl Jam", "track_name": titulo, "album_name": disco, "duration": dur})
    d = pedir(f"{API}/get?{q}")
    if d and d.get("syncedLyrics"):
        return d
    lista = pedir(f"{API}/search?" + urllib.parse.urlencode({"artist_name": "Pearl Jam", "track_name": titulo})) or []
    lista = [x for x in lista if x.get("syncedLyrics") and abs((x.get("duration") or 0) - dur) <= 4]
    return lista[0] if lista else (d if d and d.get("instrumental") else None)


def main():
    pasta, disco = Path(sys.argv[1]), sys.argv[2]
    destino = SAIDA / "letras" / pasta.name
    destino.mkdir(parents=True, exist_ok=True)
    faltando = []
    for arq in sorted(p for p in pasta.iterdir() if p.suffix in {".wav", ".opus", ".m4a", ".webm", ".mp3"}):
        titulo = re.sub(r"^\d+-", "", arq.stem)
        d = buscar(titulo, disco, duracao(arq))
        if d:
            json.dump(d, open(destino / f"{titulo}.json", "w"), ensure_ascii=False)
        else:
            faltando.append(titulo)
        time.sleep(0.3)
    (destino / "_faltando.txt").write_text("\n".join(faltando))
    print(f"[letras] {pasta.name}: {len(list(destino.glob('*.json')))} com letra, faltando: {faltando or 'nenhuma'}")


if __name__ == "__main__":
    main()
