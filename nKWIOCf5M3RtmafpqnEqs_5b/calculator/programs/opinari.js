// Opinari: advertiser-side program. A venue has nothing to earn, so this module never produces a venue estimate.
(function (root) {
  function load(name) { return typeof module !== 'undefined' && module.exports ? require(name) : root.MBR.engine; }
  var engine = load('../engine.js');
  engine.register('opinari', function (c) {
    var r = c.base();
    r.status = 'not_applicable'; r.amount = null; r.missing = []; r.note = c.cfg.notApplicableReason;
    return r;
  });
})(typeof self !== 'undefined' ? self : this);
