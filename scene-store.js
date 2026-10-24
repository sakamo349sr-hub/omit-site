// 機能の説明 三つ目の場面「店で迷ったら見せる」の動き（2026-10-25・SR 同意の一行 A・止まった絵 四コマ・動き 第1版のまま）。
// 店で迷った品物にカメラの窓を向けて撮る → 窓が退いて板が上がり、品物が板の頭の台へ飛ぶ・家にある物とあなたの言葉が並ぶ →
// OMIT. の一言が句ごとに書かれ、前に入れた写真が並ぶ → 買う・保留・やめるの保留を押す、を 10.5 秒で繰り返す。
// 撮る光はアプリの cardMaker.shutter、板の部品はアプリの今の店の相談のまま。作りは scene-show.js・scene-like.js と同じ（時刻 t から全部を描く render(t)）。
(function () {
  var root = document.querySelector('.st');
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
  var DECEL = bezier(0.215, 0.61, 0.355, 1), OUT = bezier(0.22, 1, 0.36, 1);
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var prog = function (t, a, d) { return clamp((t - a) / d); };
  var mix = function (a, b, k) { return a + (b - a) * k; };
  var q = function (s) { return root.querySelector(s); };
  var qa = function (s) { return [].slice.call(root.querySelectorAll(s)); };
  var px = function (v) { return v + 'px'; };
  function box(n, r) { n.style.left = px(r[0]); n.style.top = px(r[1]); if (r[2] !== undefined) n.style.width = px(r[2]); if (r[3] !== undefined) n.style.height = px(r[3]); }

  // 写真（Miles Chang・縦横 2:3）の中の、真鍮のランプの切り抜きの外枠。窓の幅と高さに対する割合
  var LAMP = [0.17967, 0.196, 0.73267, 0.71667];
  // 二つの舞台（横長 760×650・縦長 360×650）。r＝[左, 上, 幅, 高さ]。cam1＝撮る時の窓・cam2＝退いた窓・shutter＝[大きさ, 下から]。
  // 縦長はアプリと同じく、撮った写真が上に小さく残り、板が下から上がる。板の中は板の左上から（thumb＝[左, 上, 大きさ]）
  var LAYOUTS = {
    wide: { w: 760, h: 650, cam1: [230, 36, 300, 450], cam2: [40, 60, 240, 360], shutter: [62, 22], sheet: [310, 28, 410, 594],
      thumb: [24, 24, 64], name: [102, 30], date: [102, 58], lhome: [24, 112], home: [24, 134, 362], omit: [24, 236], says: [24, 260, 362],
      tastes: [24, 368], tcap: [24, 492], chips: [24, 526] },
    narrow: { w: 360, h: 650, cam1: [40, 100, 280, 420], cam2: [152, 10, 56, 84], shutter: [54, 18], sheet: [10, 106, 340, 524],
      thumb: [16, 16, 52], name: [80, 21], date: [80, 44], lhome: [16, 86], home: [16, 107, 308], omit: [16, 215], says: [16, 237, 308],
      tastes: [16, 330], tcap: [16, 437], chips: [16, 468] }
  };

  var el = { fit: q('.st-fit'), stage: q('.st-stage'), cam: q('.st-cam'), ph: q('.st-ph'), flash: q('.st-flash'), shutter: q('.st-shutter'), touch: q('.st-touch'),
             brass: q('.st-brass'), sheet: q('.st-sheet'), thumb: q('.st-hthumb'), name: q('.st-name'), date: q('.st-date'), lhome: q('.st-lhome'), home: q('.st-home'),
             omit: q('.st-omit'), dot: q('.st-omit i'), says: q('.st-says'), parts: qa('.st-says span'), tastes: q('.st-tastes'), pics: qa('.st-tastes div'),
             tcap: q('.st-tcap'), chips: q('.st-chips'), chip: qa('.st-chips span') };

  // 時間の表（ミリ秒）。10.5 秒で一周。撮る光はアプリの cardMaker.shutter（0.2 秒・濃さ 0.6・35% で灯る）
  var D = 10500, SHOT = 1500, B2 = 1800, B3 = 4300, B4 = 7000, END = 9600;
  var L, G = {};

  // 保留の釦の位置は字の幅で変わるので、置いた後に測る。指は釦の右寄りに来る
  function measureHold() {
    var c = el.chip[1];
    G.holdAt = [L.sheet[0] + L.chips[0] + c.offsetLeft + c.offsetWidth * 0.85, L.sheet[1] + L.chips[1] + c.offsetTop + c.offsetHeight / 2];
  }

  function layout() {
    var kind = el.fit.clientWidth < 600 ? 'narrow' : 'wide';
    if (!L || L.kind !== kind) {
      L = LAYOUTS[kind]; L.kind = kind;
      el.stage.classList.toggle('is-narrow', kind === 'narrow');
      el.stage.style.width = px(L.w); el.stage.style.height = px(L.h);
      var c = L.cam1, s = L.sheet, th = L.thumb, sh = L.shutter;
      box(el.sheet, s); box(el.thumb, [th[0], th[1], th[2], th[2]]);
      box(el.name, L.name); box(el.date, L.date); box(el.lhome, L.lhome); box(el.home, L.home); box(el.omit, L.omit);
      box(el.says, L.says); box(el.tastes, L.tastes); box(el.tcap, L.tcap); box(el.chips, L.chips);
      el.shutter.style.width = el.shutter.style.height = px(sh[0]); el.shutter.style.marginLeft = px(-sh[0] / 2); el.shutter.style.bottom = px(sh[1]);
      G.shutterAt = [c[0] + c[2] / 2, c[1] + c[3] - sh[1] - sh[0] / 2];
      G.lamp = [c[0] + LAMP[0] * c[2], c[1] + LAMP[1] * c[3], LAMP[2] * c[2], LAMP[3] * c[3]];
      var h = th[2] * 54 / 64, w = h * G.lamp[2] / G.lamp[3];   // 台の中のランプは台の 54/64 の高さ
      G.thumb = [s[0] + th[0] + (th[2] - w) / 2, s[1] + th[1] + (th[2] - h) / 2, w, h];
      box(el.brass, G.lamp);
      measureHold();
    }
    var k = Math.min(1, el.fit.clientWidth / L.w);
    el.stage.style.transform = 'scale(' + k + ')';
    el.fit.style.height = px(L.h * k);
  }

  function rise(n, t, a, dur, dy, extra, dx) {
    var k = DECEL(prog(t, a, dur));
    n.style.opacity = k * (extra === undefined ? 1 : extra);
    n.style.transform = 'translate(' + ((dx || 0) * (1 - k)) + 'px,' + (dy * (1 - k)) + 'px)';
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
    var gone = 1 - OUT(prog(t, END, 500));

    // 1 見せる: 窓がぼけから焦点の合う形で出て、カメラが品物に寄って落ち着く。シャッターを押すと光る
    var kIn = OUT(prog(t, 0, 700)), kMove = DECEL(prog(t, B2, 700)), a = L.cam1, b = L.cam2;
    box(el.cam, [mix(a[0], b[0], kMove), mix(a[1], b[1], kMove), mix(a[2], b[2], kMove), mix(a[3], b[3], kMove)]);
    el.cam.style.opacity = kIn * mix(1, 0.55, kMove) * gone;
    el.cam.style.transform = 'scale(' + mix(0.97, 1, kIn) + ')';
    el.cam.style.filter = kIn < 1 ? 'blur(' + (10 * (1 - kIn)) + 'px)' : 'none';
    el.ph.style.transform = 'scale(' + mix(1.06, 1, OUT(prog(t, 0, SHOT))) + ')';
    var sh = prog(t, SHOT, 200);
    el.flash.style.opacity = t < SHOT ? 0 : (sh < 0.35 ? sh / 0.35 : 1 - (sh - 0.35) / 0.65) * 0.6;
    var pS = 0, pH = 0;
    if (t < B2 + 300) pS = touchAt(t, G.shutterAt, 1150, 1400, 1650);
    else if (t >= B4) pH = touchAt(t, G.holdAt, B4 + 900, B4 + 1150, B4 + 1500);
    else el.touch.style.opacity = 0;
    el.shutter.style.opacity = DECEL(prog(t, 300, 300)) * (1 - prog(t, SHOT + 100, 200));
    el.shutter.style.transform = 'scale(' + (mix(0.9, 1, DECEL(prog(t, 300, 300))) - 0.08 * pS) + ')';

    // 2 並ぶ: 窓が退き、板が下から上がる。ランプが写真から板の頭の台へ飛び、家の物と言葉が並ぶ
    var kSh = DECEL(prog(t, B2 + 200, 600));
    el.sheet.style.opacity = kSh * gone;
    el.sheet.style.transform = 'translateY(' + (40 * (1 - kSh)) + 'px)';
    el.thumb.style.opacity = prog(t, B2 + 250, 200);
    var kFly = DECEL(prog(t, B2, 1000)), s = mix(1, G.thumb[3] / G.lamp[3], kFly);
    el.brass.style.opacity = (t < SHOT + 100 ? 0 : 1) * gone;
    el.brass.style.transform = 'translate(' + mix(0, G.thumb[0] - G.lamp[0], kFly) + 'px,' + mix(0, G.thumb[1] - G.lamp[1] + 40 * (1 - kSh), kFly) + 'px) scale(' + s + ')';
    el.brass.style.filter = 'drop-shadow(0 ' + (10 * (1 - kFly) / s * 0.6) + 'px ' + (14 / s * 0.4) + 'px rgba(60,40,10,' + (0.25 * (1 - kFly)) + '))';
    rise(el.name, t, B2 + 700, 350, 8); rise(el.date, t, B2 + 780, 350, 8);
    rise(el.lhome, t, B2 + 1100, 350, 6); rise(el.home, t, B2 + 1200, 500, 0, 1, -18);

    // 3 合う・ずれる: OMIT. の点が灯り（脈打つ）、一言が句ごとに書かれていく。前に入れた写真が順に上がる
    rise(el.omit, t, B3, 300, 6);
    var ph = (t - B3) % 1600;
    el.dot.style.setProperty('--pulse', t < B3 ? 0 : ph < 160 ? ph / 160 : ph < 1200 ? 1 - (ph - 160) / 1040 : 0);
    for (var i = 0; i < el.parts.length; i++) el.parts[i].style.opacity = DECEL(prog(t, B3 + 200 + 300 * i, 260));
    for (var j = 0; j < el.pics.length; j++) rise(el.pics[j], t, B3 + 1800 + 80 * j, 400, 12);
    rise(el.tcap, t, B3 + 2100, 350, 6);

    // 4 決める: 三つの釦が上がり、指が保留を押す。保留がブロンズの縁になる
    for (var c = 0; c < el.chip.length; c++) {
      var kc = rise(el.chip[c], t, B4 + 80 * c, 350, 10);
      if (c === 1) {
        el.chip[c].style.setProperty('--on', DECEL(prog(t, B4 + 1200, 220)));
        el.chip[c].style.transform = 'translateY(' + (10 * (1 - kc)) + 'px) scale(' + (1 - 0.05 * pH) + ')';
      }
    }
  }

  var now = 0;
  layout();
  addEventListener('resize', function () { layout(); render(now); });
  if (document.fonts) document.fonts.ready.then(function () { measureHold(); render(now); });

  // 見えている間だけ流す。初めて見えた時に頭から始める。動きを減らす設定の人には、保留を選んだ板を止めて見せる
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { now = B4 + 2000; render(now); return; }
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
