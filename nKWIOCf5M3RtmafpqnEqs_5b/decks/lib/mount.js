// Browser helper: put a rendered slide into a box and scale the 1280 x 720 stage to fit its width.
(function (root) {
  function ctxFor(deck, index, builder) {
    return { deck: deck, copy: MBR.copy, engine: MBR.engine, config: MBR.config, index: index, total: deck.slides.length, builder: !!builder };
  }
  function mount(box, slide, deck, index, builder) {
    var html;
    try { html = MBR.slides.render(slide, ctxFor(deck, index, builder)); }
    catch (err) { html = '<div class="slide"><div class="s-pad"><h2 class="s-h">Slide error</h2><p class="s-lede">' + MBR.slides.esc(err.message) + '</p></div></div>'; }
    box.innerHTML = '<div class="stage">' + html + '</div>';
    fit(box);
  }
  function fit(box, w, h) {
    var st = box.firstChild; if (!st) return;
    var s = Math.min((w || box.clientWidth) / 1280, (h || box.clientHeight) / 720);
    st.style.transform = 'scale(' + s + ')';
  }
  function isKnown(key) { return MBR.slides.isKnown(MBR.copy, key); }
  function store() {
    try { var t = '__t'; localStorage.setItem(t, '1'); localStorage.removeItem(t); return localStorage; }
    catch (err) { var m = {}; return { getItem: function (k) { return k in m ? m[k] : null; }, setItem: function (k, v) { m[k] = String(v); }, memory: true }; }
  }
  root.MBR = root.MBR || {};
  root.MBR.mount = { mount: mount, fit: fit, ctxFor: ctxFor, isKnown: isKnown, store: store };
})(self);
