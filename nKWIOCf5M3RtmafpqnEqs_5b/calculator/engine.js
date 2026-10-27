// Shared engine. Pure functions, no DOM, no network. Works in the browser (file://) and in node.
// estimate(inputs, config) runs every program module and returns per-program results plus a combined total.
(function (root) {
  var modules = {};

  function num(v, fallback) {
    var n = typeof v === 'number' ? v : parseFloat(v);
    return isFinite(n) && n >= 0 ? n : fallback;
  }

  function normalizeInputs(raw) {
    raw = raw || {};
    return {
      vertical: raw.vertical || 'other',
      locations: Math.max(1, Math.round(num(raw.locations, 1))),
      sqftPerLocation: num(raw.sqftPerLocation, 0),
      wifiGear: raw.wifiGear || 'unknown',
      tvsPerLocation: Math.round(num(raw.tvsPerLocation, 0)),
      guestsPerMonth: num(raw.guestsPerMonth, 0),
      monthlyCardVolumePerLocation: num(raw.monthlyCardVolumePerLocation, 0),
      yearsOfHistory: num(raw.yearsOfHistory, 0)
    };
  }

  // Which rates are still null for this program. Pure lookup on the config.
  function missingRates(progCfg) {
    return Object.keys(progCfg.rates || {}).filter(function (k) { return progCfg.rates[k].value === null || progCfg.rates[k].value === undefined; });
  }

  function register(id, fn) { modules[id] = fn; }

  // Helpers handed to each module so they stay small.
  function ctx(inputs, config, id) {
    var cfg = config.programs[id];
    return {
      id: id, cfg: cfg, inputs: inputs, facts: config.facts,
      rateValue: function (k) { return cfg.rates[k].value; },
      missing: missingRates(cfg),
      eligibleVertical: function () {
        var list = config.facts.eligibleVerticals[id];
        return !list || list.indexOf(inputs.vertical) !== -1;
      },
      base: function () { return { id: id, name: cfg.name, program: cfg.program, period: cfg.period, formula: cfg.formula }; },
      notEligible: function (why) { var r = this.base(); r.status = 'not_eligible'; r.amount = null; r.missing = []; r.note = why; return r; },
      rateNeeded: function (note) { var r = this.base(); r.status = 'rate_needed'; r.amount = null; r.missing = this.missing; r.note = note || ''; return r; },
      result: function (amount, note) { var r = this.base(); r.status = 'estimate'; r.amount = amount; r.missing = []; r.note = note || ''; return r; }
    };
  }

  function estimate(rawInputs, config) {
    var inputs = normalizeInputs(rawInputs);
    var results = config.order.map(function (id) {
      var fn = modules[id];
      if (!fn) throw new Error('No module registered for program: ' + id);
      return fn(ctx(inputs, config, id), inputs);
    });
    var total = { monthly: 0, oneTime: 0, counted: 0, rateNeeded: 0, notApplicable: 0 };
    results.forEach(function (r) {
      if (r.status === 'estimate') {
        total.counted++;
        if (r.period === 'monthly') total.monthly += r.amount; else total.oneTime += r.amount;
      } else if (r.status === 'rate_needed') total.rateNeeded++;
      else total.notApplicable++;
    });
    // Partial totals are flagged so nobody reads them as complete.
    total.complete = total.rateNeeded === 0;
    total.hasAny = total.counted > 0;
    return { inputs: inputs, results: results, total: total };
  }

  var api = { estimate: estimate, register: register, normalizeInputs: normalizeInputs, missingRates: missingRates };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.MBR = root.MBR || {}; root.MBR.engine = api; }
})(typeof self !== 'undefined' ? self : this);
