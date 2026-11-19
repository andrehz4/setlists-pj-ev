# Endireita a foto do folheto (@mrtsurt) e recorta cada produto em design/uploads/item-*.jpg (fora do git).
# Uso: python3 reels-especiais/merch-ibirapuera/recorta.py
import os
from PIL import Image, ImageEnhance
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "design", "uploads")

def solve(A, B):
    n = len(B); M = [A[i] + [B[i]] for i in range(n)]
    for i in range(n):
        p = max(range(i, n), key=lambda k: abs(M[k][i])); M[i], M[p] = M[p], M[i]
        for k in range(n):
            if k != i:
                f = M[k][i] / M[i][i]; M[k] = [a - f * b for a, b in zip(M[k], M[i])]
    return [M[i][n] / M[i][i] for i in range(n)]

def warp(img, src, W, H):
    A, B = [], []
    for (x, y), (u, v) in zip(src, [(0, 0), (W, 0), (W, H), (0, H)]):
        A.append([u, v, 1, 0, 0, 0, -x * u, -x * v]); B.append(x)
        A.append([0, 0, 0, u, v, 1, -y * u, -y * v]); B.append(y)
    return img.transform((W, H), Image.PERSPECTIVE, tuple(solve(A, B)), Image.BICUBIC)

foto = Image.open(os.path.join(D, "folheto.png")).convert("RGB").rotate(-30, expand=True, resample=Image.BICUBIC)
grade = warp(foto, [(567, 562), (1505, 503), (1478, 960), (732, 1200)], 1600, 1100)
ITENS = {
    "samba": (12, 12, 380, 356), "skyline": (402, 12, 782, 356), "cocar": (798, 12, 1200, 356),
    "surf": (1195, 12, 1600, 350), "moletom": (14, 470, 478, 965), "bone": (548, 470, 948, 965),
    "zippo": (975, 470, 1445, 985),
}
for nome, box in ITENS.items():
    c = grade.crop(box)
    c = ImageEnhance.Contrast(c).enhance(1.12)
    c = c.resize((c.width * 2, c.height * 2), Image.LANCZOS)
    c.save(os.path.join(D, f"item-{nome}.jpg"), quality=92)
    print(nome, c.size)
