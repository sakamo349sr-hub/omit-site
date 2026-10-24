// 機能の一覧（2026-10-25・SR 同意の六つ・止まった絵 第4稿の中身）の、中の絵の大きさ合わせと動き。
// 絵は決まった大きさ（狭い 313×392・広い 479×300・スマホ 306×…・style.css）で描き、板の中の幅に合わせて拡げ縮めする（場面の舞台と同じ考え）。
// 広い画面では 1.4 倍まで、スマホでは 1.25 倍まで。余った幅は左右に分けて真ん中に置く。
// 広い画面では、同じ段の二つの絵の場所を高い方にそろえ、絵を上下の真ん中に置く（二枚の高さと題の位置がそろう【SR・10/25「高さがあっていません。合わせてほしい」】）。
//
// 動き【SR・10/25「mymindは機能一覧で動きがないが、OMIT.は…動きをつけましょう。メイン機能紹介ほどではなくていい…ダイナミックな動きを入れて」】:
// 板ごとに 10 秒の一回りで、絵の上の物が順に入ってきて（上がる・横から来る・弾む・弧を描く・線が伸びる）、しばらく止まり、8.9 秒から消えて、また始まる。
// 写真は一回りと別に、ゆっくり寄ったり引いたりする。板が三割見えたら最初から流し、すっかり見えなくなったら止めて最初に戻す。
// 動きを減らす設定の人には動かさない（止まった絵 第4稿のまま）。
(function () {
  var fb = document.querySelector('.fb');
  if (!fb) return;
  var rows = [].slice.call(fb.querySelectorAll('.fb-row'));
  var phone = matchMedia('(max-width: 760px)');

  function layout() {
    var most = phone.matches ? 1.25 : 1.4;
    rows.forEach(function (row) {
      var dims = [].slice.call(row.querySelectorAll('.fb-fit')).map(function (f) {
        var v = f.firstElementChild, w = v.offsetWidth, h = v.offsetHeight, room = f.clientWidth;
        var k = w && room ? Math.min(most, room / w) : 1;
        v.style.transform = 'scale(' + k + ')';
        v.style.left = Math.max(0, (room - w * k) / 2) + 'px';
        return { f: f, v: v, hk: h * k };
      });
      var tall = Math.max.apply(null, dims.map(function (d) { return d.hk; }));
      dims.forEach(function (d) {
        var H = phone.matches ? d.hk : tall;
        d.f.style.height = H + 'px';
        d.v.style.top = (H - d.hk) / 2 + 'px';
      });
    });
  }
  layout();
  addEventListener('resize', layout);
  if (document.fonts) document.fonts.ready.then(layout);

  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !Element.prototype.animate) return;

  var T = 10, OUT = 8.9, OUT_D = 0.6;
  var EASE = 'cubic-bezier(0.22, 1, 0.36, 1)', SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
  // 入り方: [隠れている時, 出ている時, 入る時の速さ]
  var KIND = {
    rise: function (o) { return [{ opacity: 0, transform: 'translateY(' + (o.dy || 28) + 'px)' }, { opacity: 1, transform: 'none' }, EASE]; },
    slide: function (o) { return [{ opacity: 0, transform: 'translateX(' + (o.dx || 56) + 'px) rotate(' + (o.rot || 0) + 'deg)' }, { opacity: 1, transform: 'none' }, EASE]; },
    pop: function () { return [{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'none' }, SPRING]; },
    fade: function () { return [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }, EASE]; },
    grow: function () { return [{ opacity: 1, transform: 'scaleY(0)' }, { opacity: 1, transform: 'none' }, EASE]; },
    draw: function () { return [{ opacity: 1, strokeDashoffset: 1 }, { opacity: 1, strokeDashoffset: 0 }, 'cubic-bezier(0.45, 0, 0.2, 1)']; }
  };
  // 台本: [選ぶ物, 入り方, 入り始め（秒）, 入る長さ（秒）, 足すこと]。選ぶ物はどれも一枚の板の中にしか無い。幾つもあれば each 秒ずつずらす
  var PLAY = [
    ['.v1-says', 'rise', 0.5, 1.0, { dy: 30 }], ['.v1-says p span', 'fade', 1.1, 0.5, { each: 0.35 }],                                   // 話しながら調べる
    ['.v2-radio', 'slide', 0.3, 1.1, { dx: 80, rot: 6 }], ['.v2-chip', 'pop', 1.2, 0.7], ['.v2-dec + .v2-dec', 'rise', 1.9, 0.8, { dy: 14 }],  // 決めたことを覚える
    ['.v3-card', 'rise', 0.3, 1.0, { dy: 56, each: 0.5 }],                                                                            // 後でと言った物が戻ってくる
    ['.v4-thing', 'rise', 0.3, 1.0, { dy: 40 }], ['.v4-guess', 'slide', 1.1, 1.0, { dx: 60 }],                                         // 今日の一枚
    ['.v5-story', 'rise', 0.3, 1.0, { dy: 40 }], ['.v5-node', 'pop', 1.0, 0.6, { each: 1.0 }], ['.v5-line', 'grow', 1.3, 0.7],          // 物ごとの頁と九つの空間
    ['.v5-main', 'fade', 1.15, 0.6, { each: 1.0 }],
    ['.v6-pic path', 'draw', 0.3, 1.3], ['.v6-pic circle', 'pop', 1.4, 0.5], ['.v6-item', 'slide', 1.7, 1.0, { dx: 60 }],               // 入れた物に名前と要約
    ['.v6-tags span', 'pop', 2.5, 0.5, { each: 0.15 }]
  ];
  // 一回りと別に、ゆっくり寄ったり引いたりする写真
  var DRIFT = [
    ['.v1-photo', [{ backgroundSize: '228% auto' }, { backgroundSize: '244% auto' }], 14],
    ['.v5-space img', [{ transform: 'scale(1)' }, { transform: 'scale(1.07)' }], 12],
    ['.v6-pic img', [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }], 12]
  ];

  function frames(kind, o, start, dur) {
    var k = KIND[kind](o), from = k[0], to = k[1], gone = {};
    for (var p in to) gone[p] = to[p];
    gone.opacity = 0;
    var at = function (t) { return Math.min(1, t / T); };
    return [
      Object.assign({ offset: 0 }, from),
      Object.assign({ offset: at(start), easing: k[2] }, from),
      Object.assign({ offset: at(start + dur) }, to),
      Object.assign({ offset: at(OUT), easing: 'ease-in' }, to),
      Object.assign({ offset: at(OUT + OUT_D) }, gone),
      Object.assign({ offset: 1 }, from)
    ];
  }

  fb.classList.add('armed');
  var cards = [].slice.call(fb.querySelectorAll('.fb-card'));
  cards.forEach(function (card, i) {
    var anims = [], lag = i % 2 ? 0.35 : 0;   // 同じ段の二枚目は少し遅れて始める
    PLAY.forEach(function (s) {
      var o = s[4] || {};
      [].slice.call(card.querySelectorAll(s[0])).forEach(function (el, n) {
        if (s[1] === 'draw') el.style.strokeDasharray = '1';
        if (s[1] === 'grow') el.style.transformOrigin = '50% 0';
        if (el instanceof SVGElement) { el.style.transformBox = 'fill-box'; el.style.transformOrigin = '50% 50%'; }
        var a = el.animate(frames(s[1], o, s[2] + lag + n * (o.each || 0), s[3]), { duration: T * 1000, iterations: Infinity, fill: 'both' });
        a.pause(); a.currentTime = 0; anims.push(a);
      });
    });
    DRIFT.forEach(function (d) {
      [].slice.call(card.querySelectorAll(d[0])).forEach(function (el) {
        var a = el.animate(d[1], { duration: d[2] * 1000, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
        a.pause(); a.currentTime = 0; anims.push(a);
      });
    });
    card._fb = anims;
  });

  // 三割見えたら最初から流し、すっかり見えなくなったら止めて最初に戻す
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var card = e.target, on = card.classList.contains('play');
      if (!on && e.intersectionRatio >= 0.3) {
        card.classList.add('play');
        card._fb.forEach(function (a) { a.currentTime = 0; a.play(); });
      } else if (on && !e.isIntersecting) {
        card.classList.remove('play');
        card._fb.forEach(function (a) { a.pause(); a.currentTime = 0; });
      }
    });
  }, { threshold: [0, 0.3] });
  cards.forEach(function (c) { io.observe(c); });
})();
