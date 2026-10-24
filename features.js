// 機能の一覧（2026-10-25・SR 同意の六つ・止まった絵 第4稿のまま）の、中の絵の大きさ合わせ。
// 絵は決まった大きさ（狭い 313×392・広い 479×300・スマホ 306×…・style.css）で描き、板の中の幅に合わせて縮める（場面の舞台と同じ考え）。
// 広い画面では大きくしない（1 倍まで）。スマホでは少しだけ大きくしてよい（1.25 倍まで）。余った幅は左右に分けて真ん中に置く。
(function () {
  var fits = [].slice.call(document.querySelectorAll('.fb-fit'));
  if (!fits.length) return;
  var phone = matchMedia('(max-width: 760px)');
  function layout() {
    var most = phone.matches ? 1.25 : 1;
    fits.forEach(function (f) {
      var v = f.firstElementChild, w = v.offsetWidth, h = v.offsetHeight, room = f.clientWidth;
      if (!w || !room) return;
      var k = Math.min(most, room / w);
      v.style.transform = 'scale(' + k + ')';
      v.style.left = Math.max(0, (room - w * k) / 2) + 'px';
      f.style.height = (h * k) + 'px';
    });
  }
  layout();
  addEventListener('resize', layout);
  if (document.fonts) document.fonts.ready.then(layout);
})();
