"""App Store の QR を SVG で作る。白い点（釦の板はブロンズ）。
使い方: PYTHONPATH=<segno の場所> python3 tools/make_qr.py [住所]
"""
import sys, segno
url = sys.argv[1] if len(sys.argv) > 1 else "https://apps.apple.com/jp/app/id6792730242"
qr = segno.make(url, error="m")
qr.save("assets/app-store-qr.svg", scale=10, border=0, dark="#ffffff", light=None, xmldecl=False, svgclass=None, lineclass=None)
print("wrote assets/app-store-qr.svg for", url, "version", qr.version)
