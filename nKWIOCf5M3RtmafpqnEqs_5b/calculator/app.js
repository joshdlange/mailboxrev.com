// Pure view functions (no DOM) are exported for tests. The page wiring runs only in a browser.
(function (root) {
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function usd(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
  var LABEL = { estimate: 'estimate', not_eligible: 'not a fit', not_applicable: 'does not apply' };

  // internal === false is the venue-facing view: no rate names, no setup notes, no "rate needed".
  function listHtml(out, internal) {
    return out.results.map(function (r) {
      var pending = r.status === 'rate_needed';
      var big = r.status === 'estimate'
        ? '<span class="amt">' + usd(r.amount) + '</span><span class="per mono">' + (r.period === 'monthly' ? 'per month' : 'one time') + '</span>'
        : pending
          ? '<span class="chip mute">' + (internal ? 'rate needed' : 'on a call') + '</span>'
          : '<span class="chip mute">' + LABEL[r.status] + '</span>';
      var miss = internal && r.missing.length ? '<span class="miss mono">' + r.missing.length + ' rate' + (r.missing.length > 1 ? 's' : '') + ' needed</span>' : '';
      var note = r.note && !pending ? '<span class="note">' + esc(r.note) + '</span>' : (internal && r.note ? '<span class="note">' + esc(r.note) + '</span>' : '');
      return '<li class="row ' + r.status + '"><div><strong>' + esc(r.name) + '</strong><span class="prog">' + esc(r.program) + '</span>' + note + miss + '</div><div class="val">' + big + '</div></li>';
    }).join('');
  }

  function totalHtml(out, internal) {
    var t = out.total;
    if (!t.hasAny) {
      return internal
        ? '<div class="mono">Combined total</div><div class="chip need big">rate needed</div><p>No program can be priced until its rates are set.</p>'
        : '<div class="mono">Combined total</div><p>Estimates come from a call with us.</p>';
    }
    return '<div class="mono">Combined total' + (t.complete ? '' : ' (partial)') + '</div>' +
      '<div class="amt">' + usd(t.monthly) + '<span class="per mono"> per month</span></div>' +
      (t.oneTime ? '<div class="amt two">' + usd(t.oneTime) + '<span class="per mono"> one time</span></div>' : '') +
      (t.complete ? '' : (internal ? '<p class="warn">Partial: ' + t.rateNeeded + ' program' + (t.rateNeeded > 1 ? 's' : '') + ' still need rates and are not counted.</p>'
        : '<p class="note">Other programs are estimated on a call.</p>'));
  }

  // Internal-only panel: which rates are still empty.
  function needsHtml(cfg) {
    var n = 0, items = [];
    cfg.order.forEach(function (id) {
      var p = cfg.programs[id], keys = Object.keys(p.rates);
      if (!keys.length) { items.push('<li><strong>' + esc(p.name) + '</strong> <span class="chip mute">no venue estimate</span></li>'); return; }
      keys.forEach(function (k) {
        var r = p.rates[k];
        if (r.value === null) {
          n++;
          items.push('<li><strong>' + esc(p.name) + '</strong> ' + esc(r.label) + ' <span class="mono">(' + esc(r.unit) + ')</span> <span class="chip need">' + esc(r.todo) + '</span></li>');
        }
      });
    });
    return '<h2>Rates still to supply (internal)</h2><p class="lede small">' + n + ' rate' + (n === 1 ? '' : 's') + ' are empty. Open <code>calculator/config.js</code>, set <code>value</code> on each, and add the <code>source</code> path.</p><ul class="needlist">' + items.join('') + '</ul>';
  }

  var api = { listHtml: listHtml, totalHtml: totalHtml, needsHtml: needsHtml };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; return; }
  if (typeof document === 'undefined') return;

  var cfg = MBR.config, engine = MBR.engine;
  var $ = function (id) { return document.getElementById(id); };
  var form = $('f');
  function fill(sel, items) {
    items.forEach(function (it) { var o = document.createElement('option'); o.value = it.key; o.textContent = it.label; sel.appendChild(o); });
  }
  fill($('vertical'), cfg.facts.verticals);
  fill($('wifiGear'), cfg.facts.wifiGear);

  function isInternal() { return location.hash === '#internal'; }
  function read() {
    var o = {};
    Array.prototype.forEach.call(form.elements, function (el) { if (el.name) o[el.name] = el.value; });
    return o;
  }
  function render() {
    var internal = isInternal(), out = engine.estimate(read(), cfg);
    $('list').innerHTML = listHtml(out, internal);
    $('total').innerHTML = totalHtml(out, internal);
    $('badge').textContent = internal ? 'Internal view · no real rates loaded' : '';
    var panel = $('internalPanel');
    panel.hidden = !internal;
    panel.innerHTML = internal ? needsHtml(cfg) : '';
  }
  form.addEventListener('input', render);
  window.addEventListener('hashchange', render);
  render();
})(typeof self !== 'undefined' ? self : this);
