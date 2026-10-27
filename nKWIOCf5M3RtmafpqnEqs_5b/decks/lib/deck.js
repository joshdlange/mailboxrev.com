// Deck JSON: create, validate, parse, serialize, and a small library over any localStorage-like store.
// A deck is { version, id, name, venue, inputs, slides: [{ key }], updated }. Slide keys come from slides.js catalog().
(function (root) {
  var VERSION = 1;
  var LIB_KEY = 'mbr.decks.v1';
  var DEFAULT_INPUTS = { vertical: 'bar', locations: 1, sqftPerLocation: 0, wifiGear: 'unknown', tvsPerLocation: 0, guestsPerMonth: 0, monthlyCardVolumePerLocation: 0, yearsOfHistory: 0 };
  var DEFAULT_SLIDES = ['cover', 'how', 'hudson-house:overview', 'hudson-house:how', 'about', 'estimate', 'next'];

  // Starter decks offered in the template library. Keys must exist in the slide catalog.
  var STARTERS = [
    { id: 'venue-all', name: 'Venue, all programs', slides: ['cover', 'how', 'hudson-house:overview', 'hudson-house:how', 'troveo:overview', 'smarttab:overview', 'taiv:overview', 'trillage:overview', 'about', 'estimate', 'next'] },
    { id: 'partner-intro', name: 'Partner intro', slides: ['cover', 'how', 'hudson-house:overview', 'hudson-house:everyone', 'about', 'next'] }
  ];

  function uid() { return 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function now() { return new Date().toISOString(); }

  function newDeck(name, venue, slideKeys) {
    return {
      version: VERSION, id: uid(), name: name || 'Untitled deck', venue: venue || '',
      inputs: JSON.parse(JSON.stringify(DEFAULT_INPUTS)),
      slides: (slideKeys || DEFAULT_SLIDES).map(function (k) { return { key: k }; }), updated: now()
    };
  }

  // validate(obj, isKnownKey) returns { ok, errors }. isKnownKey is optional: (key) => boolean.
  function validate(d, isKnownKey) {
    var e = [];
    if (!d || typeof d !== 'object' || Array.isArray(d)) return { ok: false, errors: ['Deck is not an object'] };
    if (d.version !== VERSION) e.push('Unsupported version: ' + d.version);
    if (typeof d.id !== 'string' || !d.id) e.push('Missing id');
    if (typeof d.name !== 'string') e.push('Missing name');
    if (typeof d.venue !== 'string') e.push('Missing venue');
    if (!d.inputs || typeof d.inputs !== 'object') e.push('Missing inputs');
    if (!Array.isArray(d.slides)) e.push('Missing slides');
    else d.slides.forEach(function (s, i) {
      if (!s || typeof s.key !== 'string') e.push('Slide ' + (i + 1) + ' has no key');
      else if (isKnownKey && !isKnownKey(s.key)) e.push('Slide ' + (i + 1) + ' is unknown: ' + s.key);
    });
    return { ok: e.length === 0, errors: e };
  }

  function serialize(d) { return JSON.stringify(d, null, 2); }
  function parse(text, isKnownKey) {
    var d;
    try { d = JSON.parse(text); } catch (err) { throw new Error('Not valid JSON'); }
    var v = validate(d, isKnownKey);
    if (!v.ok) throw new Error(v.errors.join('; '));
    return d;
  }

  // Library over a store with getItem / setItem. Never throws on a broken store: reads return an empty list.
  function Library(store, key) {
    key = key || LIB_KEY;
    function readAll() {
      try { var a = JSON.parse(store.getItem(key) || '[]'); return Array.isArray(a) ? a : []; } catch (err) { return []; }
    }
    function writeAll(a) { store.setItem(key, JSON.stringify(a)); }
    return {
      list: function () { return readAll(); },
      get: function (id) { return readAll().filter(function (d) { return d.id === id; })[0] || null; },
      save: function (d) {
        d.updated = now();
        var a = readAll(), i = -1;
        a.forEach(function (x, n) { if (x.id === d.id) i = n; });
        if (i === -1) a.push(d); else a[i] = d;
        writeAll(a); return d;
      },
      remove: function (id) { writeAll(readAll().filter(function (d) { return d.id !== id; })); },
      exportAll: function () { return JSON.stringify({ version: VERSION, decks: readAll() }, null, 2); },
      // Accepts one deck or a library file. Imported decks with an id already present replace it. Returns the ids imported.
      importText: function (text, isKnownKey) {
        var o;
        try { o = JSON.parse(text); } catch (err) { throw new Error('Not valid JSON'); }
        var decks = o && Array.isArray(o.decks) ? o.decks : [o];
        decks.forEach(function (d) { var v = validate(d, isKnownKey); if (!v.ok) throw new Error(v.errors.join('; ')); });
        var self = this;
        return decks.map(function (d) { self.save(d); return d.id; });
      }
    };
  }

  var api = { STARTERS: STARTERS, VERSION: VERSION, DEFAULT_INPUTS: DEFAULT_INPUTS, newDeck: newDeck, validate: validate, serialize: serialize, parse: parse, Library: Library };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.MBR = root.MBR || {}; root.MBR.deck = api; }
})(typeof self !== 'undefined' ? self : this);
