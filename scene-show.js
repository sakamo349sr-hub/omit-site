// 機能の説明 一つ目の場面「家を見せる」の動き（2026-10-24・SR 同意の止まった絵 五コマと、動き 第1版のまま）。
// 部屋を映す → 話す → 名前の札とカードにする → 撮って、四隅が寄り、背景が左から消える → カードになる、を 10 秒で繰り返す。
// 撮る・四隅・幕・カードの起き上がりの長さと曲線は、アプリの cardMaker（~/projects/OMIT.-2/src/front/tokens.ts）のまま。
// 時刻 t から全部の見た目を計算する render(t) 一つで描く。広い画面は横長の舞台、狭い画面は同じ動きの縦長の舞台。
(function () {
  var root = document.querySelector('.ss');
  if (!root) return;

  function bezier(x1, y1, x2, y2) {
    return function (x) {
      if (x <= 0) return 0; if (x >= 1) return 1;
      var t = x;
      for (var i = 0; i < 8; i++) {
        var cx = 3 * x1 * t * (1 - t) * (1 - t) + 3 * x2 * t * t * (1 - t) + t * t * t - x;
        var d = 3 * x1 * (1 - t) * (1 - 3 * t) + 3 * x2 * t * (2 - 3 * t) + 3 * t * t;
        if (Math.abs(cx) < 1e-5 || d === 0) break; t -= cx / d;
      }
      return 3 * y1 * t * (1 - t) * (1 - t) + 3 * y2 * t * t * (1 - t) + t * t * t;
    };
  }
  var DECEL = bezier(0.215, 0.61, 0.355, 1), ACCEL = bezier(0.55, 0.085, 0.68, 0.53), OUT = bezier(0.22, 1, 0.36, 1);
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var prog = function (t, a, d) { return clamp((t - a) / d); };
  var mix = function (a, b, k) { return a + (b - a) * k; };
  var q = function (s) { return root.querySelector(s); };

  // 写真（Unsplash・Taitopia Render・2400×1800）の中の、ランプの切り抜きの外枠
  var IMG_W = 2400, CUT = { x: 1383, y: 657, w: 465, h: 759 };
  // 二つの舞台。win＝景色の窓・src＝窓に映す写真の範囲（左・上・幅）・card＝カードの幅と上と台の高さ
  var LAYOUTS = {
    wide: { w: 760, h: 650, win: { x: 40, y: 24, w: 680, h: 560 }, src: { x: 648, y: 384, w: 1584 }, wordsGap: 14, offerBottom: 28, offerH: 73, nameH: 21, gap: 8, btnH: 44,
            inset: 14, pad: 10, card: { w: 300, y: 70, plate: 300, pad: 10 } },
    narrow: { w: 360, h: 490, win: { x: 0, y: 0, w: 360, h: 440 }, src: { x: 1065, y: 364, w: 1100 }, wordsGap: 12, offerBottom: 20, offerH: 67, nameH: 19, gap: 8, btnH: 40,
              inset: 12, pad: 8, card: { w: 236, y: 36, plate: 236, pad: 10 } }
  };

  var el = { fit: q('.ss-fit'), stage: q('.ss-stage'), win: q('.ss-win'), photo: q('.ss-photo'), flash: q('.ss-flash'), wipe: q('.ss-wipe'), listen: q('.ss-listen'),
             dot: q('.ss-listen i'), words: q('.ss-words'), parts: q('.ss-words').children, offer: q('.ss-offer'), name: q('.ss-name'), btn: q('.ss-btn'),
             touch: q('.ss-touch'), br: q('.ss-br'), card: q('.ss-card'), plate: q('.ss-plate'), nm: q('.ss-nm'), own: q('.ss-own'), dt: q('.ss-dt'), lamp: q('.ss-lamp') };

  var D = 10000, P = 4300, C = P + 1550;
  var L, G = {};
  var px = function (v) { return v + 'px'; };
  function box(node, b) { node.style.left = px(b.x); node.style.top = px(b.y); node.style.width = px(b.w); if (b.h !== undefined) node.style.height = px(b.h); }

  function layout() {
    var name = el.fit.clientWidth < 600 ? 'narrow' : 'wide';
    if (!L || L.name !== name) {
      L = LAYOUTS[name]; L.name = name;
      el.stage.classList.toggle('is-narrow', name === 'narrow');
      var s = L.win.w / L.src.w, W = L.win;
      el.stage.style.width = px(L.w); el.stage.style.height = px(L.h);
      box(el.win, W);
      el.photo.style.backgroundSize = px(IMG_W * s) + ' auto';
      el.photo.style.backgroundPosition = px(-L.src.x * s) + ' ' + px(-L.src.y * s);
      G.lamp = { x: W.x + (CUT.x - L.src.x) * s, y: W.y + (CUT.y - L.src.y) * s, w: CUT.w * s, h: CUT.h * s };
      el.photo.style.transformOrigin = px(G.lamp.x - W.x + G.lamp.w / 2) + ' ' + px(G.lamp.y - W.y + G.lamp.h / 2);
      box(el.lamp, G.lamp);
      G.wipeW = W.w + 46; el.wipe.style.width = px(G.wipeW);
      el.words.style.top = px(W.y + W.h + L.wordsGap);
      var offerTop = W.y + W.h - L.offerBottom - L.offerH;
      box(el.offer, { x: W.x, y: offerTop, w: W.w });
      el.touch.style.left = px(W.x + W.w / 2 + 18); el.touch.style.top = px(offerTop + L.nameH + L.gap + L.btnH / 2);
      G.brFrom = { x: W.x + L.inset, y: W.y + L.inset, w: W.w - 2 * L.inset, h: W.h - 2 * L.inset };
      G.brTo = { x: G.lamp.x - L.pad, y: G.lamp.y - L.pad, w: G.lamp.w + 2 * L.pad, h: G.lamp.h + 2 * L.pad };
      var c = L.card, cx = (L.w - c.w) / 2, imgH = c.plate * 5 / 6, imgW = imgH * CUT.w / CUT.h;
      box(el.card, { x: cx, y: c.y, w: c.w }); el.plate.style.height = px(c.plate);
      G.plateImg = { x: cx + c.pad + (c.w - 2 * c.pad - imgW) / 2, y: c.y + c.pad + (c.plate - imgH) / 2, h: imgH };
    }
    var k = Math.min(1, el.fit.clientWidth / L.w);
    el.stage.style.transform = 'scale(' + k + ')';
    el.fit.style.height = px(L.h * k);
  }

  function rise(node, t, a, dur, dy, curve, extra) {
    var k = (curve || DECEL)(prog(t, a, dur));
    node.style.opacity = k * (extra === undefined ? 1 : extra);
    node.style.transform = 'translateY(' + (dy * (1 - k)) + 'px)';
    return k;
  }

  function render(t) {
    var gone = 1 - OUT(prog(t, 9050, 500));

    // 1 映す: 窓がぼけから焦点の合う形で出る。カメラは話す間にランプへ寄って落ち着く
    var kIn = OUT(prog(t, 0, 700)), kCalm = OUT(prog(t, 0, P));
    var shut = prog(t, P, 200), flashK = prog(t, P + 200, 250);
    var shutterA = t < P ? 0 : (shut < 0.35 ? shut / 0.35 : 1 - (shut - 0.35) / 0.65) * 0.6;
    var bright = t < P + 200 ? 0 : (flashK < 0.4 ? flashK / 0.4 : 1 - (flashK - 0.4) / 0.6) * 0.2;
    var kBlur = DECEL(prog(t, C, 300));
    el.win.style.opacity = kIn * mix(1, 0.25, kBlur) * gone;
    el.win.style.transform = 'scale(' + mix(0.97, 1, kIn) + ')';
    el.win.style.filter = kIn < 1 ? 'blur(' + (10 * (1 - kIn)) + 'px)' : 'none';
    el.photo.style.transform = 'translate(' + mix(-10, 0, kCalm) + 'px,' + mix(-6, 0, kCalm) + 'px) scale(' + mix(1.06, 1, kCalm) + ')';
    el.photo.style.filter = ((bright ? 'brightness(' + (1 + bright) + ') ' : '') + (kBlur ? 'blur(' + (24 * kBlur) + 'px) saturate(' + mix(1, 0.6, kBlur) + ')' : '')) || 'none';
    el.flash.style.opacity = shutterA;
    var kWipe = DECEL(prog(t, P + 650, 400));
    el.wipe.style.transform = 'translateX(' + mix(-G.wipeW, 0, kWipe) + 'px)';
    el.wipe.style.opacity = 1 - kBlur;

    // Listening と脈打つ点（灯り 160・消え 1040・休み 400）
    rise(el.listen, t, 300, 400, 12, DECEL, 1 - prog(t, P, 200));
    var ph = t % 1600;
    el.dot.style.setProperty('--pulse', ph < 160 ? ph / 160 : ph < 1200 ? 1 - (ph - 160) / 1040 : 0);

    // 2 話す: 言葉が、声の切れ目ごとに明朝で出る。札が出ると薄くなり、押すと消える
    var at = [1100, 1650, 2250];
    for (var i = 0; i < el.parts.length; i++) rise(el.parts[i], t, at[i], 320, 6, DECEL, mix(1, 0.4, OUT(prog(t, 3000, 400))) * (1 - prog(t, P, 300)));

    // 3 ひと押し: 名前の札と釦が 0.08 秒ずらして上がる。指の丸が来て、釦が沈んで戻る
    var off = 1 - prog(t, P + 60, 160);
    rise(el.name, t, 3000, 400, 14, DECEL, off);
    var kBtn = rise(el.btn, t, 3080, 400, 14, DECEL, off);
    var press = DECEL(prog(t, P - 150, 120)) - DECEL(prog(t, P + 50, 150));
    el.btn.style.transform = 'translateY(' + (14 * (1 - kBtn)) + 'px) scale(' + (1 - 0.05 * press) + ')';
    el.touch.style.opacity = DECEL(prog(t, 3900, 200)) * (1 - prog(t, P + 50, 200));
    el.touch.style.transform = 'scale(' + (mix(1.3, 1, DECEL(prog(t, 3900, 200))) - 0.15 * press) + ')';

    // 4 切り抜く: 撮った光 → 四隅のかぎ形がランプへ寄る → 背景が左から消え、ランプだけが残る
    var kBr = DECEL(prog(t, P + 200, 250));
    el.br.style.opacity = prog(t, P + 200, 100) * (1 - prog(t, P + 1150, 200));
    box(el.br, { x: mix(G.brFrom.x, G.brTo.x, kBr), y: mix(G.brFrom.y, G.brTo.y, kBr), w: mix(G.brFrom.w, G.brTo.w, kBr), h: mix(G.brFrom.h, G.brTo.h, kBr) });

    // 5 カードになる: 写真がぼけて退き、カードが倒れた面から起き上がって収まる。ランプは台へ飛んで乗る
    var kEm = ACCEL(prog(t, C + 150, 600)), kSet = DECEL(prog(t, C + 750, 300)), early = t < C + 750;
    el.card.style.opacity = prog(t, C + 150, 200) * gone;
    el.card.style.transform = 'perspective(695px) translateY(' + (early ? mix(-24, -4, kEm) : mix(-4, 0, kSet)) + 'px) rotateX(' + (early ? mix(24, 6, kEm) : mix(6, 0, kSet)) + 'deg)';
    rise(el.nm, t, C + 800, 300, 10, DECEL); rise(el.own, t, C + 880, 300, 10, DECEL); rise(el.dt, t, C + 960, 300, 10, DECEL);
    var kFly = DECEL(prog(t, C + 150, 900));
    el.lamp.style.opacity = (t < P + 650 ? 0 : 1) * gone;
    el.lamp.style.transform = 'translate(' + mix(0, G.plateImg.x - G.lamp.x, kFly) + 'px,' + mix(0, G.plateImg.y - G.lamp.y, kFly) + 'px) scale(' + mix(1, G.plateImg.h / G.lamp.h, kFly) + ')';
    el.lamp.style.filter = kFly ? 'drop-shadow(0 ' + (14 * kFly) + 'px ' + (12 * kFly) + 'px rgba(80,40,20,' + (0.22 * kFly) + '))' : 'none';
  }

  layout();
  addEventListener('resize', function () { layout(); render(now); });

  // 見えている間だけ流す。初めて見えた時に頭から始める。動きを減らす設定の人には、収まったカードを止めて見せる
  var now = 0;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { now = C + 2500; render(now); return; }
  render(0);
  var running = false, last = null;
  function loop(ts) {
    if (!running) return;
    if (last !== null) now = (now + Math.min(ts - last, 100)) % D;
    last = ts; render(now); requestAnimationFrame(loop);
  }
  function start() { if (running) return; running = true; last = null; requestAnimationFrame(loop); }
  function stop() { running = false; }
  if (!('IntersectionObserver' in window)) { start(); return; }
  new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? start() : stop(); }); }, { threshold: 0.35 }).observe(el.fit);
})();
