// SmartTab: POS and payments. Hospitality only; residual on card volume.
(function (root) {
  function load(name) { return typeof module !== 'undefined' && module.exports ? require(name) : root.MBR.engine; }
  var engine = load('../engine.js');
  engine.register('smarttab', function (c, i) {
    if (!c.eligibleVertical()) return c.notEligible('SmartTab fits bars, restaurants and hotel food and beverage.');
    if (c.missing.length) return c.rateNeeded();
    if (i.monthlyCardVolumePerLocation <= 0) return c.notEligible('Needs monthly card volume per location.');
    return c.result(i.locations * i.monthlyCardVolumePerLocation * c.rateValue('residualBps') / 10000);
  });
})(typeof self !== 'undefined' ? self : this);
