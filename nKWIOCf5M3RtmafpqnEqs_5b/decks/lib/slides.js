// Slide catalog and renderers. Pure: slide + context in, HTML string out. No DOM, no network.
// Works in the browser (file://) and in node. Copy comes from data/copy-data.js (generated from the live site copy).
// The estimate slide calls the calculator engine (../../calculator/engine.js) with the deck's inputs. It never invents a rate.
(function (root) {
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function accent(h) {
    var m = String(h).match(/^(.*?)(\S+\s+\S+?)([.!?]?)$/);
    if (!m || !m[1].trim()) return { pre: '', em: h, post: '' };
    return { pre: m[1], em: m[2], post: m[3] };
  }
  function headline(h, tag) {
    var a = accent(h);
    return '<' + tag + ' class="s-h">' + esc(a.pre) + '<em>' + esc(a.em) + '</em>' + esc(a.post) + '</' + tag + '>';
  }
  function usd(n) { return '$' + Math.round(n).toLocaleString('en-US'); }

  var PROGRAM_ORDER = ['hudson-house', 'troveo', 'smarttab', 'taiv', 'opinari', 'trillage'];

  // Catalog: every slide a deck can hold, in the order the library shows them.
  function catalog(copy) {
    var list = [
      { key: 'cover', group: 'Cover', title: 'Cover' },
      { key: 'how', group: 'How it works', title: 'How it works' }
    ];
    PROGRAM_ORDER.forEach(function (id) {
      var p = copy.partners[id];
      list.push({ key: id + ':overview', group: p.name, program: id, title: p.name + ': Overview' });
      list.push({ key: id + ':how', group: p.name, program: id, title: p.name + ': How it works' });
      list.push({ key: id + ':everyone', group: p.name, program: id, title: p.name + ': Who gets what' });
    });
    list.push({ key: 'about', group: 'About us', title: 'About us' });
    list.push({ key: 'estimate', group: 'Estimate', title: 'Estimate' });
    list.push({ key: 'next', group: 'Next steps', title: 'Next steps' });
    return list;
  }
  function isKnown(copy, key) { return catalog(copy).some(function (c) { return c.key === key; }); }

  function chrome(inner, ctx, cls) {
    var venue = ctx.deck && ctx.deck.venue ? ctx.deck.venue : '';
    return '<div class="slide ' + (cls || '') + '">' + inner +
      '<div class="s-foot"><span class="s-brand"><img src="assets/logo.svg" alt="">Mailbox Rev</span>' +
      '<span class="mono">' + esc(venue) + '</span><span class="mono">' + (ctx.index != null ? (ctx.index + 1) + (ctx.total ? ' / ' + ctx.total : '') : '') + '</span></div></div>';
  }

  // Long venue names step the headline size down so a 40 character name stays inside the slide.
  function coverSize(v) { return v.length > 44 ? ' len-xl' : v.length > 28 ? ' len-l' : v.length > 16 ? ' len-m' : ''; }

  function cover(ctx) {
    var v = (ctx.deck && ctx.deck.venue) || 'your venue';
    var c = ctx.copy;
    return chrome('<div class="s-pad cover"><div class="eyebrow mono">Prepared for ' + esc(v) + '</div>' +
      '<h1 class="s-h xl' + coverSize(v) + '">Found money for <em>' + esc(v) + '</em></h1>' +
      '<p class="s-lede">' + esc(c.tagline) + '</p>' +
      '<p class="mono by">Josh Lange and Mike Neri · ' + esc(c.email) + ' · ' + esc(c.phone) + '</p></div>', ctx, 'is-cover');
  }

  function how(ctx) {
    var h = ctx.copy.how;
    var steps = h.steps.map(function (s, i) {
      return '<div class="step"><div class="num">' + (i + 1) + '</div><h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p></div>';
    }).join('');
    return chrome('<div class="s-pad"><div class="eyebrow mono">How it works</div>' + headline(h.headline, 'h2') +
      '<p class="s-lede">' + esc(h.intro) + '</p><div class="steps n3">' + steps + '</div></div>', ctx);
  }

  function overview(ctx, id) {
    var p = ctx.copy.partners[id];
    var label = p.label ? p.label : p.program;
    var side = '<div class="logo-card"><img' + (p.logoKnockout ? ' class="ko"' : '') + ' src="' + esc(p.logo) + '" alt="' + esc(p.name) + '"></div>' +
      '<div class="fit"><div class="mono">Who it fits</div><p>' + esc(p.fits) + '</p></div>';
    var disc = p.disclosure ? '<p class="disc">' + esc(p.disclosure) + '</p>' : '';
    return chrome('<div class="s-pad split"><div class="l"><div class="eyebrow mono">' + esc(p.name) + ' · ' + esc(label) + '</div>' +
      headline(p.headline, 'h2') + '<p class="s-lede">' + esc(p.line) + '</p>' + disc + '</div><div class="r">' + side + '</div></div>', ctx);
  }

  function programHow(ctx, id) {
    var p = ctx.copy.partners[id];
    var steps = p.how.map(function (s, i) {
      return '<div class="step"><div class="num">' + (i + 1) + '</div><h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p></div>';
    }).join('');
    return chrome('<div class="s-pad"><div class="eyebrow mono">' + esc(p.name) + '</div><h2 class="s-h">How <em>' + esc(p.name) + '</em> works</h2>' +
      '<div class="steps n' + p.how.length + '">' + steps + '</div></div>', ctx);
  }

  function everyone(ctx, id) {
    var p = ctx.copy.partners[id];
    var cols = p.everyone.map(function (e) {
      return '<div class="who"><h3>' + esc(e.who) + '</h3><p>' + esc(e.text) + '</p></div>';
    }).join('');
    return chrome('<div class="s-pad"><div class="eyebrow mono">' + esc(p.name) + '</div><h2 class="s-h">Who gets <em>what</em></h2>' +
      '<div class="whos">' + cols + '</div></div>', ctx);
  }

  function about(ctx) {
    var a = ctx.copy.about;
    var people = a.people.map(function (p) {
      return '<div class="person"><img src="' + esc(p.photo) + '" alt="' + esc(p.name) + '"><div><h3>' + esc(p.name) + '</h3><p>' + esc(p.bio) + '</p></div></div>';
    }).join('');
    return chrome('<div class="s-pad"><div class="eyebrow mono">About us</div>' + headline(a.headline, 'h2') +
      '<p class="s-lede">' + esc(a.sentence) + '</p><div class="people">' + people + '</div>' +
      '<p class="mono contact">' + esc(a.contact) + '</p></div>', ctx);
  }

  // One quiet line in place of grey "does not apply" rows. Number-free.
  var QUIET = { opinari: 'Opinari is for brands.', trillage: 'Trillage earns the venue nothing, it brings customers.' };
  var LABEL = { estimate: 'Estimate', not_eligible: 'Not a fit' };

  function labelOf(list, key) { var f = list.filter(function (x) { return x.key === key; })[0]; return f ? f.label : key; }

  // Runs the shared calculator engine. ctx.engine and ctx.config are MBR.engine and MBR.config in the browser.
  function estimateData(ctx) {
    return ctx.engine.estimate(ctx.deck.inputs || {}, ctx.config);
  }

  // A venue only sees the estimate slide when every program that applies to a venue has a rate.
  function estimateReady(ctx) { return estimateData(ctx).total.rateNeeded === 0; }

  // The deck the player and the PDF use: the same deck minus any slide that is not ready for a venue.
  function playableDeck(deck, ctx) {
    var c = { deck: deck, copy: ctx.copy, engine: ctx.engine, config: ctx.config };
    var ready = estimateReady(c);
    var d = JSON.parse(JSON.stringify(deck));
    d.slides = d.slides.filter(function (s) { return s.key !== 'estimate' || ready; });
    return d;
  }

  // Builder only. Shown instead of the estimate while rates are missing. Never reaches the player or the PDF.
  function estimateHidden(ctx) {
    return chrome('<div class="s-pad est hidden-est"><div class="eyebrow mono">Estimate</div><h2 class="s-h">Hidden until <em>rates are set</em></h2>' +
      '<p class="s-lede">This slide is left out of Play and Save as PDF until every program that applies has a rate.</p></div>', ctx, 'is-hidden');
  }

  function estimate(ctx) {
    if (!estimateReady(ctx)) {
      if (ctx.builder) return estimateHidden(ctx);
      throw new Error('Estimate slide is not ready');
    }
    var out = estimateData(ctx), cfg = ctx.config, i = out.inputs;
    var applies = out.results.filter(function (r) { return r.status !== 'not_applicable'; });
    var skipped = out.results.filter(function (r) { return r.status === 'not_applicable'; });
    var rows = applies.map(function (r) {
      var val;
      if (r.status === 'estimate') val = '<span class="amt">' + usd(r.amount) + '</span><span class="mono per">' + (r.period === 'monthly' ? 'per month' : 'one time') + '</span>';
      else val = '<span class="chip mute">' + LABEL[r.status] + '</span>';
      var extra = r.note ? '<span class="note">' + esc(r.note) + '</span>' : '';
      return '<li class="' + r.status + '"><div><strong>' + esc(r.name) + '</strong> <span class="mono">' + esc(r.program) + '</span>' + extra + '</div><div class="val">' + val + '</div></li>';
    }).join('');
    var t = out.total;
    var tot = '<div class="mono">Combined total</div><div class="amt">' + usd(t.monthly) + '<span class="mono per"> per month</span></div>' +
      (t.oneTime ? '<div class="amt two">' + usd(t.oneTime) + '<span class="mono per"> one time</span></div>' : '');
    var quiet = skipped.length ? '<p class="note quiet">' + esc(skipped.map(function (r) { return QUIET[r.id] || ''; }).filter(Boolean).join(' ')) + '</p>' : '';
    var based = [
      ['Business type', labelOf(cfg.facts.verticals, i.vertical)],
      ['Locations', i.locations],
      ['Wi-Fi equipment', labelOf(cfg.facts.wifiGear, i.wifiGear)],
      ['TVs per location', i.tvsPerLocation],
      ['Guests per month, per location', i.guestsPerMonth.toLocaleString('en-US')],
      ['Card sales per month, per location', usd(i.monthlyCardVolumePerLocation)],
      ['Years of records', i.yearsOfHistory]
    ].map(function (b) { return '<li><span>' + esc(b[0]) + '</span><strong>' + esc(b[1]) + '</strong></li>'; }).join('');
    return chrome('<div class="s-pad est"><div class="eyebrow mono">Estimate</div><h2 class="s-h">What this could <em>look like</em></h2>' +
      '<div class="est-grid"><div><ul class="est-list">' + rows + '</ul>' + quiet + '</div><div class="est-side"><div class="est-total">' + tot + '</div>' +
      '<div class="mono">Based on</div><ul class="based">' + based + '</ul></div></div>' +
      '<p class="disc">An estimate from the answers above, not a promise. Josh or Mike walks you through the real figures on a call.</p></div>', ctx);
  }

  function next(ctx) {
    var c = ctx.copy;
    var steps = [
      { title: 'Pick the fit', text: 'Tell us which programs look right. We say plainly when one does not fit.' },
      { title: 'We check it', text: 'A short fit check on your setup, then the partner introduction.' },
      { title: 'We stay close', text: 'We help through setup and stay in touch once it is live.' }
    ].map(function (s, i) { return '<div class="step"><div class="num">' + (i + 1) + '</div><h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p></div>'; }).join('');
    return chrome('<div class="s-pad"><div class="eyebrow mono">Next steps</div><h2 class="s-h">See if it <em>fits</em></h2>' +
      '<div class="steps n3">' + steps + '</div>' +
      '<p class="s-lede contact-big">' + esc(c.email) + ' · ' + esc(c.phone) + '</p><p class="disc">' + esc(c.footerDisclosure) + '</p></div>', ctx);
  }

  function render(slide, ctx) {
    var key = slide.key;
    if (key === 'cover') return cover(ctx);
    if (key === 'how') return how(ctx);
    if (key === 'about') return about(ctx);
    if (key === 'estimate') return estimate(ctx);
    if (key === 'next') return next(ctx);
    var m = key.match(/^([a-z-]+):(overview|how|everyone)$/);
    if (m && ctx.copy.partners[m[1]]) {
      if (m[2] === 'overview') return overview(ctx, m[1]);
      if (m[2] === 'how') return programHow(ctx, m[1]);
      return everyone(ctx, m[1]);
    }
    throw new Error('Unknown slide: ' + key);
  }

  var api = { catalog: catalog, isKnown: isKnown, render: render, estimateData: estimateData, estimateReady: estimateReady, playableDeck: playableDeck, esc: esc, PROGRAM_ORDER: PROGRAM_ORDER };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.MBR = root.MBR || {}; root.MBR.slides = api; }
})(typeof self !== 'undefined' ? self : this);
