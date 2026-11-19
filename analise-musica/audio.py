"""Leitura de áudio de qualquer formato (wav, webm/opus, m4a, mp3) via ffmpeg, mono, na taxa pedida."""
import subprocess
import numpy as np


def carregar(caminho, sr):
    cmd = ["ffmpeg", "-v", "error", "-i", str(caminho), "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"]
    bruto = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(bruto, dtype=np.float32)
