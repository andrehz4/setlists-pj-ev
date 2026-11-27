# Monta o reel "Better Man ao vivo em 4 décadas" (vídeo mudo 1080x1920 + trilha ao vivo).
# Uso: python3 gera.py  (lê plano.json; escreve em saida/ e ov/)
import json, os, subprocess, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
B = os.path.join(AQUI, "brutos")
S = os.path.join(AQUI, "saida")
T = os.path.join(S, "_pecas")
os.makedirs(T, exist_ok=True)
P = json.load(open(os.path.join(AQUI, "plano.json")))
DIM = {}


def run(c):
    r = subprocess.run(c, capture_output=True, text=True)
    if r.returncode:
        sys.exit("ERRO: " + " ".join(c) + "\n" + r.stderr[-2000:])
    return r


def dim(src):
    if src not in DIM:
        o = run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", os.path.join(B, src + ".mp4")]).stdout
        DIM[src] = tuple(int(x) for x in o.strip().split(",")[:2])
    return DIM[src]


def peca_video(i, p, nq):
    # p: src, ss, dur, cx, cy (fração do quadro), h (fração da altura do quadro)
    W, H = dim(p["src"])
    ch = round(H * p.get("h", 1.0) / 2) * 2
    cw = round(ch * 9 / 16 / 2) * 2
    x = min(max(0, round(W * p["cx"] - cw / 2)), W - cw)
    y = min(max(0, round(H * p.get("cy", 0.5) - ch / 2)), H - ch)
    pre = "bwdif," if p["src"] == "2005" else ""
    vf = f"{pre}crop={cw}:{ch}:{x}:{y},scale=1080:1920:flags=lanczos,unsharp=5:5:0.6,setsar=1,fps=30,format=yuv420p"
    out = os.path.join(T, f"v{i:02d}.mp4")
    run(["ffmpeg", "-v", "error", "-y", "-ss", str(p["ss"]), "-i", os.path.join(B, p["src"] + ".mp4"), "-frames:v", str(nq),
         "-vf", vf, "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "16", out])
    return out


def video():
    lst = os.path.join(T, "lista.txt")
    with open(lst, "w") as f:
        cum, fim_ant = 0.0, 0
        for i, p in enumerate(P["video"]):
            cum += p["dur"]; fim = round(cum * 30)
            f.write(f"file '{peca_video(i, p, fim - fim_ant)}'\n"); fim_ant = fim
    out = os.path.join(S, "_video-mudo.mp4")
    run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", out])
    return out


def audio():
    # cada trecho: src, ss, dur, at (segundo no reel); nivela com loudnorm e cruza com fades curtos
    xf = P.get("xfade", 0.18)
    ins, fil = [], []
    for i, a in enumerate(P["audio"]):
        ss = max(0, a["ss"] - xf / 2)
        d = a["dur"] + xf
        ins += ["-ss", str(ss), "-t", str(d), "-i", os.path.join(B, a["src"] + ".mp4")]
        at = max(0, a["at"] - xf / 2)
        fil.append(f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo,loudnorm=I=-14:TP=-1.5:LRA=11,"
                   f"afade=t=in:d={xf},afade=t=out:st={d - xf}:d={xf},adelay={int(at * 1000)}:all=1[a{i}]")
    n = len(P["audio"])
    fil.append("".join(f"[a{i}]" for i in range(n)) + f"amix=inputs={n}:normalize=0:dropout_transition=0[m]")
    # fim: abaixa o ao vivo e entra a voz "Bora seguir a gente!"
    vz = P.get("voz")
    if vz:
        ins += ["-i", vz["arq"]]
        tv = vz["at"]
        fil.append(f"[m]volume='if(gte(t,{tv - 0.3}),0.45,1)':eval=frame[mb]")
        fil.append(f"[{n}:a]aresample=48000,aformat=channel_layouts=stereo,volume={vz.get('vol', 1.4)},adelay={int(tv * 1000)}:all=1[vz]")
        fil.append("[mb][vz]amix=inputs=2:normalize=0:dropout_transition=0[m2]")
        last = "m2"
    else:
        last = "m"
    fil.append(f"[{last}]afade=t=out:st={P['duracao'] - 0.6}:d=0.6,atrim=0:{P['duracao']},alimiter=limit=0.89[o]")
    out = os.path.join(S, "_audio-ao-vivo.wav")
    run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", ";".join(fil), "-map", "[o]", "-ar", "48000", out])
    return out


def overlay():
    # dados do overlay (série décadas) + captura PNG transparente
    ov = os.path.join(AQUI, "ov"); os.makedirs(ov, exist_ok=True)
    js = os.path.join(AQUI, "reel-dados.js")
    open(js, "w").write("window.REEL_DADOS = " + json.dumps(P["overlay"], ensure_ascii=False) + ";\n")
    html = os.path.abspath(os.path.join(AQUI, "..", "decadas-overlay", "overlay.html"))
    cap = os.path.abspath(os.path.join(AQUI, "..", "agitados-overlay", "capturar.mjs"))
    run(["node", cap, html + "#" + js, ov, "0", str(P["duracao"]), "30"])
    return ov


def final():
    v, a, ov = os.path.join(S, "_video-mudo.mp4"), os.path.join(S, "_audio-ao-vivo.wav"), os.path.join(AQUI, "ov")
    comum = ["-filter_complex", "[0:v][1:v]overlay=eof_action=pass,format=yuv420p[v]", "-map", "[v]",
             "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-maxrate", "12M", "-bufsize", "24M", "-r", "30",
             "-t", str(P["duracao"]), "-movflags", "+faststart"]
    vivo = os.path.join(S, "better-man-decadas-AO-VIVO.mp4")
    run(["ffmpeg", "-v", "error", "-y", "-i", v, "-framerate", "30", "-i", os.path.join(ov, "f%05d.png"), "-i", a,
         *comum, "-map", "2:a", "-c:a", "aac", "-b:a", "256k", vivo])
    mudo = os.path.join(S, "better-man-decadas-MUDO.mp4")
    run(["ffmpeg", "-v", "error", "-y", "-i", v, "-framerate", "30", "-i", os.path.join(ov, "f%05d.png"), *comum, "-an", mudo])
    return vivo, mudo


if __name__ == "__main__":
    etapa = sys.argv[1] if len(sys.argv) > 1 else "tudo"
    if etapa in ("tudo", "video"):
        print("video:", video())
    if etapa in ("tudo", "audio"):
        print("audio:", audio())
    if etapa in ("tudo", "overlay"):
        print("overlay:", overlay())
    if etapa in ("tudo", "final"):
        print("final:", final())
