(function () {
  var M = MBR.mount, lib = MBR.deck.Library(M.store());
  var $ = function (id) { return document.getElementById(id); };
  var cur = null, sel = 0, dragFrom = null;
  var ACTIVE = 'mbr.decks.active';

  function toast(msg, err) {
    var t = document.createElement('div'); t.className = 'toast' + (err ? ' err' : ''); t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600);
  }
  function fill(sel, items) { items.forEach(function (it) { var o = document.createElement('option'); o.value = it.key; o.textContent = it.label; sel.appendChild(o); }); }
  fill($('vertical'), MBR.config.facts.verticals);
  fill($('wifiGear'), MBR.config.facts.wifiGear);

  function save() { lib.save(cur); try { localStorage.setItem(ACTIVE, cur.id); } catch (e) {} }
  function refreshSelect() {
    var s = $('deckSel'); s.innerHTML = '';
    lib.list().forEach(function (d) { var o = document.createElement('option'); o.value = d.id; o.textContent = d.name + (d.venue ? ' (' + d.venue + ')' : ''); s.appendChild(o); });
    s.value = cur.id;
  }
  function load(id) {
    var d = lib.get(id); if (!d) return;
    cur = d; sel = 0;
    var f = $('f'); f.name.value = d.name; f.venue.value = d.venue;
    Object.keys(MBR.deck.DEFAULT_INPUTS).forEach(function (k) { if (f[k]) f[k].value = d.inputs[k] != null ? d.inputs[k] : MBR.deck.DEFAULT_INPUTS[k]; });
    try { localStorage.setItem(ACTIVE, id); } catch (e) {}
    refreshSelect(); renderAll();
  }

  function renderCatalog() {
    var groups = {}, order = [];
    MBR.slides.catalog(MBR.copy).forEach(function (c) { if (!groups[c.group]) { groups[c.group] = []; order.push(c.group); } groups[c.group].push(c); });
    $('catalog').innerHTML = order.map(function (g) {
      return '<div class="mono hd">' + MBR.slides.esc(g) + '</div>' + groups[g].map(function (c) {
        return '<div class="item"><span>' + MBR.slides.esc(c.title.replace(g + ': ', '')) + '</span><button class="btn sm" data-add="' + c.key + '" aria-label="Add ' + MBR.slides.esc(c.title) + '">Add</button></div>';
      }).join('');
    }).join('');
  }

  function renderDeck() {
    $('count').textContent = cur.slides.length + ' slides';
    var cat = MBR.slides.catalog(MBR.copy), title = function (k) { var c = cat.filter(function (x) { return x.key === k; })[0]; return c ? c.title : k; };
    var ready = MBR.slides.estimateReady(M.ctxFor(cur, 0));
    $('deckList').innerHTML = cur.slides.map(function (s, i) {
      return '<li class="deck-item' + (i === sel ? ' sel' : '') + (s.key === 'estimate' && !ready ? ' dim' : '') + '" draggable="true" data-i="' + i + '"><div class="meta"><span>' + (i + 1) + '. ' + MBR.slides.esc(title(s.key)) + (s.key === 'estimate' && !ready ? ' (hidden until rates are set)' : '') + '</span>' +
        '<span class="ctl"><button class="btn ghost sm" data-up="' + i + '" aria-label="Move up">&uarr;</button><button class="btn ghost sm" data-down="' + i + '" aria-label="Move down">&darr;</button><button class="btn ghost sm" data-rm="' + i + '" aria-label="Remove">&times;</button></span></div>' +
        '<div class="thumb"></div></li>';
    }).join('');
    Array.prototype.forEach.call($('deckList').children, function (li, i) { M.mount(li.querySelector('.thumb'), cur.slides[i], cur, i, true); });
  }
  function renderPreview() {
    var box = $('preview');
    if (!cur.slides.length) { box.innerHTML = '<p class="hint" style="padding:20px">Add a slide from the library.</p>'; return; }
    if (sel >= cur.slides.length) sel = cur.slides.length - 1;
    M.mount(box, cur.slides[sel], cur, sel, true);
  }
  function renderAll() { renderDeck(); renderPreview(); }

  $('catalog').addEventListener('click', function (e) {
    var k = e.target.getAttribute && e.target.getAttribute('data-add'); if (!k) return;
    cur.slides.push({ key: k }); sel = cur.slides.length - 1; save(); renderAll();
  });
  $('deckList').addEventListener('click', function (e) {
    var t = e.target, n;
    if ((n = t.getAttribute('data-up')) !== null) move(+n, +n - 1);
    else if ((n = t.getAttribute('data-down')) !== null) move(+n, +n + 1);
    else if ((n = t.getAttribute('data-rm')) !== null) { cur.slides.splice(+n, 1); if (sel >= cur.slides.length) sel = Math.max(0, cur.slides.length - 1); save(); renderAll(); }
    else { var li = t.closest && t.closest('.deck-item'); if (li) { sel = +li.getAttribute('data-i'); renderDeck(); renderPreview(); } }
  });
  function move(a, b) {
    if (b < 0 || b >= cur.slides.length) return;
    var s = cur.slides.splice(a, 1)[0]; cur.slides.splice(b, 0, s); sel = b; save(); renderAll();
  }
  $('deckList').addEventListener('dragstart', function (e) { var li = e.target.closest('.deck-item'); if (!li) return; dragFrom = +li.getAttribute('data-i'); li.classList.add('drag'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(dragFrom)); } catch (x) {} });
  $('deckList').addEventListener('dragover', function (e) { var li = e.target.closest('.deck-item'); if (!li || dragFrom === null) return; e.preventDefault(); Array.prototype.forEach.call($('deckList').children, function (x) { x.classList.remove('over'); }); li.classList.add('over'); });
  $('deckList').addEventListener('drop', function (e) { var li = e.target.closest('.deck-item'); if (!li || dragFrom === null) return; e.preventDefault(); var to = +li.getAttribute('data-i'); var from = dragFrom; dragFrom = null; move(from, to); });
  $('deckList').addEventListener('dragend', function () { dragFrom = null; Array.prototype.forEach.call($('deckList').children, function (x) { x.classList.remove('drag', 'over'); }); });

  $('f').addEventListener('input', function (e) {
    var f = $('f'), n = e.target.name;
    if (n === 'name') cur.name = f.name.value;
    else if (n === 'venue') cur.venue = f.venue.value;
    else cur.inputs[n] = (n === 'vertical' || n === 'wifiGear') ? e.target.value : (e.target.value === '' ? 0 : parseFloat(e.target.value));
    save(); if (n === 'name') refreshSelect(); renderAll();
  });
  $('deckSel').addEventListener('change', function () { load($('deckSel').value); });
  $('newBtn').addEventListener('click', function () { var d = MBR.deck.newDeck('New deck', ''); lib.save(d); load(d.id); });
  $('dupBtn').addEventListener('click', function () { var d = JSON.parse(JSON.stringify(cur)); d.id = MBR.deck.newDeck().id; d.name = cur.name + ' copy'; lib.save(d); load(d.id); });
  $('delBtn').addEventListener('click', function () {
    if (!confirm('Delete "' + cur.name + '"?')) return;
    lib.remove(cur.id); var rest = lib.list();
    if (!rest.length) { var d = MBR.deck.newDeck('Untitled deck', ''); lib.save(d); rest = [d]; }
    load(rest[0].id);
  });

  function download(name, text) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  }
  var slug = function (s) { return (s || 'deck').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'deck'; };
  $('expBtn').addEventListener('click', function () { download('mbr-deck-' + slug(cur.name) + '.json', MBR.deck.serialize(cur)); });
  $('expAllBtn').addEventListener('click', function () { download('mbr-deck-library.json', lib.exportAll()); });
  $('impBtn').addEventListener('click', function () { $('impFile').click(); });
  $('impFile').addEventListener('change', function () {
    var file = $('impFile').files[0]; if (!file) return;
    var r = new FileReader();
    r.onload = function () {
      try { var ids = lib.importText(String(r.result), M.isKnown); load(ids[0]); toast('Imported ' + ids.length + ' deck' + (ids.length > 1 ? 's' : '')); }
      catch (err) { toast('Import failed: ' + err.message, true); }
      $('impFile').value = '';
    };
    r.readAsText(file);
  });

  // The player gets the deck in the URL hash, so it works even where file:// pages do not share storage.
  function playUrl(extra) { return 'player.html#' + (extra || '') + 'd=' + encodeURIComponent(MBR.deck.serialize(cur)); }
  $('playBtn').addEventListener('click', function () { window.open(playUrl(), '_blank'); });
  $('pdfBtn').addEventListener('click', function () { window.open(playUrl('print=1&'), '_blank'); });

  window.addEventListener('resize', function () { renderPreview(); });

  // Template library: every slide template, grouped. Add one, add all for a program, or start a deck from a starter.
  function renderLibrary() {
    var cat = MBR.slides.catalog(MBR.copy), e = MBR.slides.esc, html = '';
    html += '<div class="lib-group"><h3>Start a new deck from a starter</h3><div class="lib-row">' + MBR.deck.STARTERS.map(function (st) {
      return '<button class="btn sm" data-starter="' + st.id + '">' + e(st.name) + ' (' + st.slides.length + ' slides)</button>';
    }).join('') + '</div></div>';
    var groups = [], seen = {};
    cat.forEach(function (c) { if (!seen[c.group]) { seen[c.group] = []; groups.push(c.group); } seen[c.group].push(c); });
    var progIds = MBR.slides.PROGRAM_ORDER.map(function (id) { return MBR.copy.partners[id].name; });
    var sections = [['Cover', ['Cover']], ['How it works', ['How it works']], ['Programs', progIds], ['About us', ['About us']], ['Estimate', ['Estimate']], ['Next steps', ['Next steps']]];
    sections.forEach(function (sec) {
      html += '<div class="lib-group"><h3>' + e(sec[0]) + '</h3>';
      sec[1].forEach(function (g) {
        var items = seen[g] || [], prog = items[0] && items[0].program;
        if (sec[0] === 'Programs') html += '<div class="lib-prog"><strong>' + e(g) + '</strong><button class="btn ghost sm" data-addall="' + prog + '">Add all ' + items.length + ' slides for ' + e(g) + '</button></div>';
        html += '<div class="lib-grid">' + items.map(function (c) {
          return '<div class="lib-card"><div class="lib-thumb" data-thumb="' + c.key + '"></div><div class="lib-cap"><span>' + e(c.title.replace(g + ': ', '')) + '</span><button class="btn sm" data-add="' + c.key + '">Add</button></div></div>';
        }).join('') + '</div>';
      });
      html += '</div>';
    });
    $('libBody').innerHTML = html;
    Array.prototype.forEach.call($('libBody').querySelectorAll('[data-thumb]'), function (box) { M.mount(box, { key: box.getAttribute('data-thumb') }, cur, 0, true); });
  }
  $('libBtn').addEventListener('click', function () { $('lib').hidden = false; renderLibrary(); });
  $('libClose').addEventListener('click', function () { $('lib').hidden = true; });
  $('libBody').addEventListener('click', function (e) {
    var t = e.target, k;
    if ((k = t.getAttribute('data-add'))) { cur.slides.push({ key: k }); sel = cur.slides.length - 1; save(); renderAll(); toast('Added'); }
    else if ((k = t.getAttribute('data-addall'))) {
      MBR.slides.catalog(MBR.copy).filter(function (c) { return c.program === k; }).forEach(function (c) { cur.slides.push({ key: c.key }); });
      sel = cur.slides.length - 1; save(); renderAll(); toast('Added all slides for ' + MBR.copy.partners[k].name);
    } else if ((k = t.getAttribute('data-starter'))) {
      var st = MBR.deck.STARTERS.filter(function (x) { return x.id === k; })[0];
      var d = MBR.deck.newDeck(st.name, '', st.slides); lib.save(d); load(d.id); $('lib').hidden = true; toast('New deck: ' + st.name);
    }
  });

  renderCatalog();
  var list = lib.list();
  if (!list.length) { var d = MBR.deck.newDeck('Sample deck', 'Sample Venue'); lib.save(d); list = [d]; }
  var active = null; try { active = localStorage.getItem(ACTIVE); } catch (e) {}
  load(lib.get(active) ? active : list[0].id);
  if (location.hash === '#library') { $('lib').hidden = false; renderLibrary(); }
})();
