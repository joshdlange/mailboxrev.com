// Hudson House: carrier Wi-Fi offload. Needs compatible gear and a venue-type fit.
(function (root) {
  function load(name) { return typeof module !== 'undefined' && module.exports ? require(name) : root.MBR.engine; }
  var engine = load('../engine.js');
  engine.register('hudson-house', function (c, i) {
    if (!c.eligibleVertical()) return c.notEligible('This business type is not a fit for carrier offload.');
    var gear = c.facts.wifiGear.filter(function (g) { return g.key === i.wifiGear; })[0];
    if (gear && gear.compatible === false) return c.notEligible(gear.label + ' is not compatible with carrier offload.');
    var note = gear && gear.compatible === null ? 'Wi-Fi gear not confirmed: check compatibility before pitching.' : '';
    if (c.missing.length) return c.rateNeeded(note);
    var amt = i.locations * i.guestsPerMonth * c.rateValue('carrierSubscriberShare') * c.rateValue('gbPerSubscriber') * c.rateValue('ratePerGb');
    return c.result(amt, note);
  });
})(typeof self !== 'undefined' ? self : this);
