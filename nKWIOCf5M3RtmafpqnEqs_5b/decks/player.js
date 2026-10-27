(function () {
  var M = MBR.mount, $ = function (id) { return document.getElementById(id); };
  var deck = null, i = 0, hideT = null;

  function fromLocation() {
    var h = location.hash.replace(/^#/, ''), q = {};
    h.split('&').forEach(function (p) { var k = p.indexOf('='); if (k > 0) q[p.slice(0, k)] = decodeURIComponent(p.slice(k + 1)); });
    var s = location.search.replace(/^\?/, '').split('&');
    s.forEach(function (p) { var k = p.indexOf('='); if (k > 0 && !q[p.slice(0, k)]) q[p.slice(0, k)] = decodeURIComponent(p.slice(k + 1)); });
    return q;
  }
  function size() {
    var w = innerWidth, h = innerHeight, s = Math.min(w / 1280, h / 720), f = $('frame');
    f.style.width = Math.floor(1280 * s) + 'px'; f.style.height = Math.floor(720 * s) + 'px';
    M.fit(f, 1280 * s, 720 * s);
  }
  function show() {
    if (!deck || !deck.slides.length) return;
    i = Math.max(0, Math.min(deck.slides.length - 1, i));
    M.mount($('frame'), deck.slides[i], deck, i); size();
    $('count').textContent = (i + 1) + ' / ' + deck.slides.length;
    $('bar').style.width = ((i + 1) / deck.slides.length * 100) + '%';
    document.title = deck.name + ' · Mailbox Rev';
  }
  function go(n) { i += n; show(); }
  function fullscreen() {
    if (document.fullscreenElement) document.exitFullscreen(); else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
  }
  // PDF: render every slide into the print sheet, one 1280 x 720 page each, then open the browser print dialog.
  function fillSheet() {
    $('sheet').innerHTML = deck.slides.map(function (s, n) {
      return '<div class="print-page">' + MBR.slides.render(s, M.ctxFor(deck, n)) + '</div>';
    }).join('');
  }
  function pdf() { fillSheet(); window.print(); }
  function setDeck(d) { deck = MBR.slides.playableDeck(d, M.ctxFor(d, 0)); i = 0; fillSheet(); $('frame').style.display = ''; show(); }
  function empty() {
    $('frame').style.display = 'none';
    $('count').textContent = 'No deck loaded. Use "Open deck file" or Play from the builder.';
  }
  function wake() { $('hud').classList.remove('hide'); clearTimeout(hideT); hideT = setTimeout(function () { $('hud').classList.add('hide'); }, 2500); }

  document.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ' || k === 'Enter') { e.preventDefault(); go(1); }
    else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace') { e.preventDefault(); go(-1); }
    else if (k === 'Home') { i = 0; show(); }
    else if (k === 'End') { i = deck ? deck.slides.length - 1 : 0; show(); }
    else if (k === 'f' || k === 'F') fullscreen();
    else if ((k === 'p' || k === 'P') && deck) pdf();
    wake();
  });
  $('frame').addEventListener('click', function (e) { var r = $('frame').getBoundingClientRect(); go(e.clientX - r.left > r.width / 2 ? 1 : -1); });
  $('prev').addEventListener('click', function () { go(-1); });
  $('nextb').addEventListener('click', function () { go(1); });
  $('fs').addEventListener('click', fullscreen);
  $('pdf').addEventListener('click', function () { if (deck) pdf(); });
  $('open').addEventListener('click', function () { $('file').click(); });
  $('file').addEventListener('change', function () {
    var f = $('file').files[0]; if (!f) return; var r = new FileReader();
    r.onload = function () { try { setDeck(MBR.deck.parse(String(r.result), M.isKnown)); } catch (err) { alert('Could not open deck: ' + err.message); } };
    r.readAsText(f);
  });
  document.addEventListener('mousemove', wake);
  addEventListener('resize', size);

  var q = fromLocation();
  try {
    if (q.d) deck = MBR.deck.parse(q.d, M.isKnown);
    else if (q.id) deck = MBR.deck.Library(M.store()).get(q.id);
  } catch (err) { deck = null; }
  if (deck) { setDeck(deck); if (!deck.slides.length) { empty(); } else if (q.n) { i = parseInt(q.n, 10) || 0; show(); } if (q.print === '1') setTimeout(pdf, 400); } else empty();
  if (q.hud === '0') { $('hud').style.display = 'none'; $('bar').style.display = 'none'; } else wake();
})();
