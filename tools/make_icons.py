"""タブのアイコンと、iPhone のホーム画面のアイコンを作る。元は App Store に出ているアプリのアイコン（1024 角）。
タブ（favicon.ico・16/32/48）: 輪だけを抜き出して縁いっぱいに置き、地は透明（アプリの web 用の favicon.png と同じ置き方）。
ホーム画面（apple-touch-icon.png・180）: アプリのアイコンをそのまま縮める（角は iPhone が丸める）。
使い方: python3 tools/make_icons.py [元のアイコン]
"""
import os, sys
import numpy as np
from PIL import Image

src = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/projects/OMIT.-app/assets/icon.png")
icon = Image.open(src).convert("RGB")
px = np.asarray(icon, dtype=np.float64)

# 地の色（四隅）と輪の色（地から一番遠い 1% の平均）を取り、各点を「輪の色が何割か」に戻す
h, w, _ = px.shape
corners = np.concatenate([px[:32, :32], px[:32, -32:], px[-32:, :32], px[-32:, -32:]]).reshape(-1, 3)
bg = np.median(corners, axis=0)
dist = np.linalg.norm(px - bg, axis=2)
gold = px[dist >= np.percentile(dist, 99)].mean(axis=0)
axis = gold - bg
alpha = np.clip(((px - bg) @ axis) / (axis @ axis), 0, 1)

# 輪の外接の正方形に、縮めた時に縁で切れない程度の余白を足して切り抜く
ys, xs = np.where(alpha > 0.04)
cy, cx = (ys.min() + ys.max()) / 2, (xs.min() + xs.max()) / 2
half = max(ys.max() - ys.min(), xs.max() - xs.min()) / 2 * 1.04
box = tuple(int(round(v)) for v in (cx - half, cy - half, cx + half, cy + half))

ring = np.zeros((h, w, 4), dtype=np.uint8)
ring[..., :3] = np.round(gold).astype(np.uint8)
ring[..., 3] = np.round(alpha * 255).astype(np.uint8)
ring = Image.fromarray(ring, "RGBA").crop(box).resize((256, 256), Image.Resampling.LANCZOS)
ring.save("favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

icon.resize((180, 180), Image.Resampling.LANCZOS).save("apple-touch-icon.png", optimize=True)
print("wrote favicon.ico and apple-touch-icon.png from", src, "bg", bg.round(), "gold", gold.round(), "box", box)
