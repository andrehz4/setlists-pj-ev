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
    # cada trecho: src, ss, dur, at (segundo no reel), opcional baixo={"ate": s, "vol": v} (volume baixo até s do trecho e sobe)
    # nivela com loudnorm e cruza com fades curtos; a fala do gancho entra por cima
    xf = P.get("xfade", 0.18)
    ins, fil = [], []
    for i, a in enumerate(P["audio"]):
        ss = max(0, a["ss"] - xf / 2)
        d = a["dur"] + xf
        ins += ["-ss", str(ss), "-t", str(d), "-i", os.path.join(B, a["src"] + ".mp4")]
        at = max(0, a["at"] - xf / 2)
        vol = ""
        if a.get("baixo"):
            x, v = a["baixo"]["ate"], a["baixo"]["vol"]
            vol = f",volume='if(lt(t,{x}),{v},min(1,{v}+(t-{x})/0.25*{1 - v}))':eval=frame"
        fade_out = f"afade=t=out:st={d - a.get('fade', xf)}:d={a.get('fade', xf)}"
        fil.append(f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo,loudnorm=I=-14:TP=-1.5:LRA=11{vol},"
                   f"afade=t=in:d={xf},{fade_out},adelay={int(at * 1000)}:all=1[a{i}]")
    n = len(P["audio"])
    fil.append("".join(f"[a{i}]" for i in range(n)) + f"amix=inputs={n}:normalize=0:dropout_transition=0[m]")
    vz = P["voz"]
    ins += ["-i", vz["arq"]]
    fil.append(f"[{n}:a]aresample=48000,aformat=channel_layouts=stereo,atempo={vz.get('tempo', 1)},volume={vz.get('vol', 1.0)},"
               f"adelay={int(vz['at'] * 1000)}:all=1,asplit=2[vz][vz2]")
    fil.append("[m][vz]amix=inputs=2:normalize=0:dropout_transition=0[m2]")
    fil.append(f"[m2]atrim=0:{P['duracao']},alimiter=limit=0.89[o]")
    fil.append(f"[vz2]apad,atrim=0:{P['duracao']},alimiter=limit=0.89[ov]")
    out = os.path.join(S, "_audio-ao-vivo.wav"); outv = os.path.join(S, "_audio-so-voz.wav")
    run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", ";".join(fil), "-map", "[o]", "-ar", "48000", out,
         "-map", "[ov]", "-ar", "48000", outv])
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
    v, ov = os.path.join(S, "_video-mudo.mp4"), os.path.join(AQUI, "ov")
    comum = ["-filter_complex", "[0:v][1:v]overlay=eof_action=pass,format=yuv420p[v]", "-map", "[v]",
             "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-maxrate", "12M", "-bufsize", "24M", "-r", "30",
             "-t", str(P["duracao"]), "-movflags", "+faststart"]
    base = ["ffmpeg", "-v", "error", "-y", "-i", v, "-framerate", "30", "-i", os.path.join(ov, "f%05d.png")]
    saidas = {"AO-VIVO": "_audio-ao-vivo.wav"}
    feitos = []
    for nome, aud in saidas.items():
        out = os.path.join(S, f"better-man-decadas-{nome}.mp4")
        if aud:
            run([*base, "-i", os.path.join(S, aud), *comum, "-map", "2:a", "-c:a", "aac", "-b:a", "256k", out])
        else:
            run([*base, *comum, "-an", out])
        cel = out.replace(".mp4", "-celular.mp4")
        run(["ffmpeg", "-v", "error", "-y", "-i", out, "-c:v", "libx264", "-preset", "slow", "-b:v", "5000k", "-maxrate", "6000k",
             "-bufsize", "10000k", "-c:a", "copy", "-movflags", "+faststart", cel])
        feitos += [out, cel]
    return feitos


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
