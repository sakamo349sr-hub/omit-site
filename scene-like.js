// 機能の説明 二つ目の場面「いいなと思った物を入れる」の動き（2026-10-25・SR 同意の一行 B・止まった絵 六コマ・動き 第1版のまま）。
// いいなと思った部屋を共有して入れる → 入れた瞬間の霧 → 気になる物を指で囲む → 囲んだ物だけがカードに → 入れた部屋が寄り集まってテイストの頁に、を 13.6 秒で繰り返す。
// 霧と一言の出方はアプリの入れた瞬間（mymind を測った数・色だけブロンズ）、カードの起き上がりはアプリの cardMaker のまま。作りは scene-show.js と同じ（時刻 t から全部を描く render(t)）。
(function () {
  var root = document.querySelector('.sl');
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
  var DECEL = bezier(0.215, 0.61, 0.355, 1), ACCEL = bezier(0.55, 0.085, 0.68, 0.53), OUT = bezier(0.22, 1, 0.36, 1), INOUT = bezier(0.65, 0, 0.35, 1);
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var prog = function (t, a, d) { return clamp((t - a) / d); };
  var mix = function (a, b, k) { return a + (b - a) * k; };
  var q = function (s) { return root.querySelector(s); };
  var qa = function (s) { return [].slice.call(root.querySelectorAll(s)); };
  var px = function (v) { return v + 'px'; };
  function box(n, r) { n.style.left = px(r[0]); n.style.top = px(r[1]); if (r[2] !== undefined) n.style.width = px(r[2]); if (r[3] !== undefined) n.style.height = px(r[3]); }

  // 二つの舞台（横長 760×650・縦長 360×540）。r＝[左, 上, 幅, 高さ]。受け口の中は受け口の左上から
  var CHAIR_ASPECT = 406 / 540;
  var LAYOUTS = {
    wide: { w: 760, h: 650,
      floats: [[52, 58, 150, 200], [34, 372, 228, 128], [570, 46, 146, 196], [552, 352, 168, 226]], hero: [250, 62, 260, 325], share: [448, 327, 44, 44],
      inlet: [160, 40, 440, 566], top: [20, 16, 404, 32], pic: [70, 64, 300, 375], hint: 452, keep: [140, 490, 160, 44], chairInPic: [78.5, 169.0, 121.7, 161.7],
      mark: [357, 168, 46], said: 232, memo: [296, 362, 168, 44], card: { x: 230, y: 36, w: 300, plate: 300 },
      to: [[40, 28, 400, 310], [448, 28, 272, 151], [448, 187, 272, 151], [150, 110, 180, 150], [120, 150, 220, 130], [180, 90, 160, 200]],
      from: [[300, 700, 160, 200], [820, 110, 120, 180], [800, 430, 120, 160], [-150, 70, 110, 150], [-170, 390, 150, 90], [190, -210, 110, 150]],
      radius: ['20px 0 0 20px', '0 20px 0 0', '0 0 20px 0', '14px', '14px', '14px'],
      dots: [40, 318, 400], name: [40, 352], sp: [40, 398], nums: [40, 428, 680, 60], line: [40, 504], band: [40, 556, 680, 64] },
    narrow: { w: 360, h: 540,
      floats: [[8, 24, 74, 98], [0, 312, 118, 66], [280, 18, 74, 98], [266, 286, 92, 124]], hero: [92, 46, 176, 220], share: [226, 226, 36, 36],
      inlet: [10, 14, 340, 470], top: [16, 14, 310, 30], pic: [50, 56, 240, 300], hint: 368, keep: [90, 400, 160, 42], chairInPic: [62.8, 135.2, 97.4, 129.4],
      mark: [162, 150, 36], said: 198, memo: [102, 290, 156, 40], card: { x: 62, y: 28, w: 236, plate: 236 },
      to: [[20, 16, 320, 196], [20, 218, 157, 86], [183, 218, 157, 86], [110, 50, 140, 110], [90, 70, 180, 100], [120, 40, 120, 150]],
      from: [[100, 620, 140, 175], [400, 80, 100, 150], [390, 320, 100, 130], [-130, 60, 100, 130], [-150, 300, 130, 80], [130, -180, 100, 130]],
      radius: ['18px 18px 0 0', '0 0 0 18px', '0 0 18px 0', '12px', '12px', '12px'],
      dots: [20, 192, 320], name: [20, 320], sp: [20, 352], nums: [20, 376, 320, 54], line: [20, 442], band: [20, 474, 320, 56] }
  };

  var el = { fit: q('.sl-fit'), stage: q('.sl-stage'), floats: qa('.sl-float'), hero: q('.sl-hero'), share: q('.sl-share'), touch: q('.sl-touch'),
             inlet: q('.sl-inlet'), top: q('.sl-top'), pic: q('.sl-pic'), pic2: q('.sl-pic2'), hint: q('.sl-hint'), keep: q('.sl-keep'), svg: q('.sl-inlet svg'),
             arc: q('.sl-arc'), tips: qa('.sl-tip'), dark: q('.sl-dark'), fog: q('.sl-fog'), mark: q('.sl-mark'), said: q('.sl-said'), memo: q('.sl-memo'),
             card: q('.sl-card'), plate: q('.sl-plate'), nm: q('.sl-nm'), mk: q('.sl-mk'), own: q('.sl-own'), chair: q('.sl-chair'), flies: qa('.sl-fly'),
             dots: q('.sl-dots'), name: q('.sl-name'), sp: q('.sl-sp'), nums: q('.sl-nums'), line: q('.sl-line'), band: q('.sl-band') };

  var D = 13600, B2 = 2100, KEEP = 3500, FOG = 3700, B4 = 5000, C = 7300, B6 = 9300, END = 12800;
  var ARC = { cx: 139, cy: 252, r: 105, sweep: 290 };
  ARC.len = ARC.r * ARC.sweep * Math.PI / 180;
  el.arc.style.strokeDasharray = ARC.len;
  var L, G = {};

  function layout() {
    var kind = el.fit.clientWidth < 600 ? 'narrow' : 'wide';
    if (!L || L.kind !== kind) {
      L = LAYOUTS[kind]; L.kind = kind;   // L.name はテイストの名前の位置なので、組み方の名前は kind に置く
      el.stage.classList.toggle('is-narrow', kind === 'narrow');
      el.stage.style.width = px(L.w); el.stage.style.height = px(L.h);
      el.floats.forEach(function (f, i) { box(f, L.floats[i]); });
      box(el.hero, L.hero); box(el.share, L.share);
      box(el.inlet, L.inlet); box(el.top, L.top); box(el.pic, L.pic); box(el.svg, L.pic); el.hint.style.top = px(L.hint); box(el.keep, L.keep);
      box(el.mark, L.mark); el.said.style.top = px(L.said); box(el.memo, L.memo);
      var c = L.card; box(el.card, [c.x, c.y, c.w]); el.plate.style.height = px(c.plate);
      var cp = L.chairInPic, imgH = c.plate * 5 / 6, imgW = imgH * CHAIR_ASPECT;
      G.chair = [L.inlet[0] + L.pic[0] + cp[0], L.inlet[1] + L.pic[1] + cp[1], cp[2], cp[3]];
      G.plate = { x: c.x + 10 + (c.w - 20 - imgW) / 2, y: c.y + 10 + (c.plate - imgH) / 2, h: imgH };
      box(el.chair, G.chair);
      G.shareAt = [L.share[0] + L.share[2] / 2, L.share[1] + L.share[3] / 2];
      G.keepAt = [L.inlet[0] + L.keep[0] + L.keep[2] / 2, L.inlet[1] + L.keep[1] + L.keep[3] / 2];
      el.flies.forEach(function (f, i) { f.style.borderRadius = L.radius[i]; });
      box(el.dots, L.dots); box(el.name, L.name); box(el.sp, L.sp); box(el.nums, L.nums); box(el.line, L.line); box(el.band, L.band);
    }
    var k = Math.min(1, el.fit.clientWidth / L.w);
    el.stage.style.transform = 'scale(' + k + ')';
    el.fit.style.height = px(L.h * k);
  }

  function rise(n, t, a, dur, dy, extra) {
    var k = DECEL(prog(t, a, dur));
    n.style.opacity = k * (extra === undefined ? 1 : extra);
    n.style.transform = 'translateY(' + (dy * (1 - k)) + 'px)';
    return k;
  }
  // 指の丸: a で来て、press で沈み、b で消える。沈み具合を返す
  function touchAt(t, at, a, press, b) {
    var come = DECEL(prog(t, a, 200)), p = DECEL(prog(t, press, 120)) - DECEL(prog(t, press + 180, 150));
    el.touch.style.left = px(at[0]); el.touch.style.top = px(at[1]);
    el.touch.style.opacity = come * (1 - prog(t, b, 200));
    el.touch.style.transform = 'scale(' + (mix(1.3, 1, come) - 0.15 * p) + ')';
    return p;
  }

  function render(t) {
    // 1 いいな: 色を抜いた部屋がぼけから焦点の合う形で浮かび、真ん中の一枚だけに色。共有を押す
    var dim = DECEL(prog(t, B2, 500)), gone1 = 1 - prog(t, B4 - 100, 200);
    el.floats.forEach(function (f, i) {
      var k = OUT(prog(t, 80 * i, 600)), drift = Math.sin((t / 2100) * Math.PI + i) * 4;
      f.style.opacity = k * mix(0.5, 0.18, dim) * gone1;
      f.style.transform = 'translate(' + drift + 'px,' + (-drift) + 'px) scale(' + mix(0.96, 1, k) + ')';
      f.style.filter = 'grayscale(1) contrast(.92) brightness(1.04) blur(' + (10 * (1 - k) + 6 * dim) + 'px)';
    });
    var kh = OUT(prog(t, 150, 700));
    el.hero.style.opacity = kh * mix(1, 0.18, dim) * gone1;
    el.hero.style.transform = 'translateY(' + (10 * (1 - kh)) + 'px) scale(' + mix(0.96, 1, kh) + ')';
    el.hero.style.filter = 'blur(' + (10 * (1 - kh) + 6 * dim) + 'px)' + (dim ? ' grayscale(' + dim + ')' : '');
    var ks = DECEL(prog(t, 1200, 300)), pS = 0, pK = 0;
    if (t < B2 + 200) pS = touchAt(t, G.shareAt, 1700, 1900, 2150);
    else if (t < FOG + 300) pK = touchAt(t, G.keepAt, 3300, KEEP, 3700);
    else el.touch.style.opacity = 0;
    el.share.style.opacity = ks * mix(1, 0.18, dim) * gone1;
    el.share.style.transform = 'scale(' + (mix(0.8, 1, ks) - 0.08 * pS) + ')';

    // 2 共有するだけ: 受け口が下から上がって収まる。このまま入れるを押す
    var kIn = DECEL(prog(t, B2 + 50, 600)), blurIn = DECEL(prog(t, C, 300));
    el.inlet.style.opacity = kIn * mix(1, 0.35, blurIn) * (1 - prog(t, B6, 400));
    el.inlet.style.transform = 'translateY(' + (80 * (1 - kIn)) + 'px) scale(' + mix(1.04, 1, kIn) + ')';
    el.inlet.style.filter = blurIn ? 'blur(' + (14 * blurIn) + 'px)' : 'none';
    rise(el.top, t, B2 + 350, 300, 6); rise(el.hint, t, B2 + 600, 300, 6);
    var kK = rise(el.keep, t, B2 + 680, 300, 10);
    el.keep.style.transform = 'translateY(' + (10 * (1 - kK)) + 'px) scale(' + (1 - 0.05 * pK) + ')';
    el.pic2.style.opacity = t < B4 ? 0 : 1;

    // 3 入った: 暗くなる 0.2 秒 → 霧（+0.17 秒から 0.37 秒）→ 一言が 36px 下から 0.5 秒 → 釦が 31px 下から（+0.17 秒）
    var fogOut = 1 - DECEL(prog(t, B4, 400));
    el.dark.style.opacity = 0.35 * DECEL(prog(t, FOG, 200)) * fogOut;
    el.fog.style.opacity = 0.94 * DECEL(prog(t, FOG + 170, 370)) * fogOut;
    var km = DECEL(prog(t, FOG + 300, 400));
    el.mark.style.opacity = km * fogOut; el.mark.style.transform = 'scale(' + mix(0.9, 1, km) + ')';
    rise(el.said, t, FOG + 300, 500, 36, fogOut); rise(el.memo, t, FOG + 470, 370, 31, fogOut);

    // 4 囲むだけ: 霧が晴れると椅子の写真の受け口。白い弧が椅子をくるりと囲み、指先に金の光
    var kArc = INOUT(prog(t, B4 + 700, 1300)), shown = (t > B4 + 650 ? 1 : 0) * (1 - prog(t, C, 250));
    el.arc.setAttribute('opacity', 0.96 * shown);
    el.arc.style.strokeDashoffset = ARC.len * (1 - kArc);
    var ang = (-90 + ARC.sweep * kArc) * Math.PI / 180;
    el.tips.forEach(function (c) { c.setAttribute('cx', ARC.cx + ARC.r * Math.cos(ang)); c.setAttribute('cy', ARC.cy + ARC.r * Math.sin(ang)); c.setAttribute('opacity', shown); });

    // 5 物が残る: 受け口がぼけて退き、椅子だけが台へ飛ぶ。カードが倒れた面から起き上がって収まる
    var gone5 = 1 - OUT(prog(t, B6, 400));
    var kEm = ACCEL(prog(t, C + 50, 600)), kSet = DECEL(prog(t, C + 650, 300)), early = t < C + 650;
    el.card.style.opacity = prog(t, C + 50, 200) * gone5;
    el.card.style.transform = 'perspective(695px) translateY(' + (early ? mix(-24, -4, kEm) : mix(-4, 0, kSet)) + 'px) rotateX(' + (early ? mix(24, 6, kEm) : mix(6, 0, kSet)) + 'deg)';
    rise(el.nm, t, C + 750, 300, 10); rise(el.mk, t, C + 830, 300, 10); rise(el.own, t, C + 910, 300, 10);
    var kFly = DECEL(prog(t, C + 50, 900)), s = mix(1, G.plate.h / G.chair[3], kFly);
    el.chair.style.opacity = (t < C ? 0 : 1) * gone5;
    el.chair.style.transform = 'translate(' + mix(0, G.plate.x - G.chair[0], kFly) + 'px,' + mix(0, G.plate.y - G.chair[1], kFly) + 'px) scale(' + s + ')';
    el.chair.style.filter = kFly ? 'drop-shadow(0 ' + (14 * kFly / s) + 'px ' + (12 * kFly / s) + 'px rgba(80,40,20,' + (0.22 * kFly) + '))' : 'none';

    // 6 好みが見える: 入れた部屋が四方から寄り集まり、色を取り戻してテイストの頁になる（三枚は奥へ消える）
    var gone6 = 1 - OUT(prog(t, END, 500));
    el.flies.forEach(function (f, i) {
      var a = L.from[i], b = L.to[i], start = B6 + 200 + 60 * i, k = DECEL(prog(t, start, 900));
      box(f, [mix(a[0], b[0], k), mix(a[1], b[1], k), mix(a[2], b[2], k), mix(a[3], b[3], k)]);
      f.style.opacity = prog(t, start, 200) * (i > 2 ? 1 - prog(t, start + 600, 300) : 1) * gone6;
      f.style.filter = 'grayscale(' + (1 - k) + ')';
    });
    el.dots.style.opacity = prog(t, B6 + 1200, 300) * gone6;
    rise(el.name, t, B6 + 1200, 400, 10, gone6); rise(el.sp, t, B6 + 1280, 400, 10, gone6); rise(el.nums, t, B6 + 1360, 400, 10, gone6);
    rise(el.line, t, B6 + 1460, 400, 10, gone6); rise(el.band, t, B6 + 1560, 400, 10, gone6);
  }

  var now = 0;
  layout();
  addEventListener('resize', function () { layout(); render(now); });

  // 見えている間だけ流す。初めて見えた時に頭から始める。動きを減らす設定の人には、テイストの頁を止めて見せる
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { now = B6 + 2500; render(now); return; }
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
