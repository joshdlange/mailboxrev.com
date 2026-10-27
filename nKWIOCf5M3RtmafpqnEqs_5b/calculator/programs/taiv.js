// TAIV program module: TV ad revenue. Needs TVs on site.
(function (root) {
  function load(name) { return typeof module !== 'undefined' && module.exports ? require(name) : root.MBR.engine; }
  var engine = load('../engine.js');
  engine.register('taiv', function (c, i) {
    if (!c.eligibleVertical()) return c.notEligible('This business type is not a fit.');
    if (i.tvsPerLocation <= 0) return c.notEligible('No TVs on site.');
    if (c.missing.length) return c.rateNeeded();
    return c.result(i.locations * i.tvsPerLocation * c.rateValue('ratePerTvPerMonth'));
  });
})(typeof self !== 'undefined' ? self : this);
