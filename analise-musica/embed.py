"""Passa o MERT (m-a-p) no áudio e guarda a "escuta" em trechos de 5 s.
Uso: python embed.py <nome> <arquivo_ou_pasta>...   ->  SAIDA/emb-<nome>.npz
Cada trecho vira a média no tempo de todas as camadas: [n_trechos, camadas, dim]."""
import os
import sys
from pathlib import Path
from audio import carregar
import numpy as np
import torch
from transformers import AutoModel, Wav2Vec2FeatureExtractor
from config import SAIDA

MODELO = os.environ.get("MERT", "m-a-p/MERT-v1-95M")
TRECHO_S = 5.0
EXT = {".wav", ".opus", ".m4a", ".webm", ".mp3"}
dev = "cuda" if torch.cuda.is_available() else ("mps" if torch.backends.mps.is_available() else "cpu")


def arquivos(args):
    for a in map(Path, args):
        yield from (sorted(p for p in a.rglob("*") if p.suffix in EXT) if a.is_dir() else [a])


def main():
    nome, entradas = sys.argv[1], sys.argv[2:]
    proc = Wav2Vec2FeatureExtractor.from_pretrained(MODELO, trust_remote_code=True)
    modelo = AutoModel.from_pretrained(MODELO, trust_remote_code=True).to(dev).eval()
    sr = proc.sampling_rate
    n = int(TRECHO_S * sr)
    embs, faixas, inicios = [], [], []
    lista = list(arquivos(entradas))
    for i, arq in enumerate(lista):
        y = carregar(arq, sr)
        pedacos = [y[k:k + n] for k in range(0, len(y) - n + 1, n)]
        for lote in range(0, len(pedacos), 16):
            x = proc(pedacos[lote:lote + 16], sampling_rate=sr, return_tensors="pt", padding=True)
            with torch.no_grad():
                out = modelo(x["input_values"].to(dev), output_hidden_states=True)
            h = torch.stack(out.hidden_states, dim=1).mean(dim=2)  # [lote, camadas, dim]
            embs.append(h.cpu().numpy().astype(np.float16))
        faixas += [str(arq)] * len(pedacos)
        inicios += [k * TRECHO_S for k in range(len(pedacos))]
        print(f"[embed] {i + 1}/{len(lista)} {arq.stem}", flush=True)
    SAIDA.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(SAIDA / f"emb-{nome}.npz", emb=np.concatenate(embs), faixa=np.array(faixas), inicio=np.array(inicios))
    print(f"[embed] {len(faixas)} trechos -> {SAIDA / f'emb-{nome}.npz'}")


if __name__ == "__main__":
    main()
