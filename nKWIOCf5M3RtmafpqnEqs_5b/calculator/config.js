// MBR calculator config: the ONE file Josh fills in.
// Every rate is null until Josh supplies it. null = "rate needed" in the UI and the engine never guesses.
// A value goes here only if it is already in our own files, and then it carries a `source` path.
// Search done 2026-10-23 (reports/, outreach/, brand/, campaigns/): no partner rate or formula input exists in our files.
// Do not publish this file with real rates until Josh OKs showing estimates publicly (handbook rule 8).
(function (root) {
  var TODO = 'TODO Josh';
  function rate(label, unit, meaning) {
    return { value: null, unit: unit, label: label, meaning: meaning, todo: TODO, source: null };
  }

  var config = {
    version: 1,

    // Facts that ARE in our files. Eligibility only, no money.
    facts: {
      verticals: [
        { key: 'hotel', label: 'Hotel or extended stay' },
        { key: 'bar', label: 'Bar, lounge or nightclub' },
        { key: 'restaurant', label: 'Restaurant or cafe' },
        { key: 'entertainment', label: 'Entertainment venue or event space' },
        { key: 'retail', label: 'Retail or local services' },
        { key: 'coworking', label: 'Coworking or flex office' },
        { key: 'other', label: 'Other business' }
      ],
      // source: projects/mailboxrev-site/site/src/data/programs.js (goodFit lists) and CLAUDE.md section 5
      eligibleVerticals: {
        'hudson-house': ['hotel', 'bar', 'restaurant', 'entertainment', 'retail', 'coworking'],
        'smarttab': ['hotel', 'bar', 'restaurant'],
        'taiv': ['hotel', 'bar', 'restaurant', 'entertainment', 'retail', 'coworking', 'other']
      },
      // source: CLAUDE.md section 5, "Wi-Fi compatibility (sales reference only)"
      wifiGear: [
        { key: 'unknown', label: 'Not sure', compatible: null },
        { key: 'aruba', label: 'Aruba', compatible: true },
        { key: 'cambium', label: 'Cambium cnMaestro', compatible: true },
        { key: 'fortinet', label: 'Fortinet', compatible: true },
        { key: 'mist', label: 'Juniper Mist', compatible: true },
        { key: 'meraki', label: 'Meraki', compatible: true },
        { key: 'cisco', label: 'Cisco Catalyst 9800 or 5520', compatible: true },
        { key: 'mikrotik', label: 'MikroTik', compatible: true },
        { key: 'ruckus', label: 'Ruckus', compatible: true },
        { key: 'ubiquiti', label: 'Ubiquiti', compatible: true },
        { key: 'sonicwall', label: 'SonicWall APs', compatible: false },
        { key: 'consumer', label: 'Consumer router (TP-Link, carrier gateway)', compatible: false }
      ]
    },

    programs: {
      'hudson-house': {
        name: 'Hudson House', program: 'Carrier Wi-Fi offload', audience: 'venues', period: 'monthly',
        // DRAFT structure, Josh to confirm: guests x share on carrier x GB per guest x rate per GB, summed over locations.
        formula: 'locations x guestsPerMonth x carrierSubscriberShare x gbPerSubscriber x ratePerGb',
        rates: {
          carrierSubscriberShare: rate('Share of guests on a supported carrier', 'fraction 0 to 1', 'Of the guests in the venue, the part who are supported-carrier subscribers.'),
          gbPerSubscriber: rate('GB offloaded per subscriber per month', 'GB', 'Average data one subscriber moves over the venue Wi-Fi in a month.'),
          ratePerGb: rate('Venue payout per GB', 'USD per GB', 'What the venue earns for each GB offloaded.')
        }
      },
      'troveo': {
        name: 'Troveo', program: 'AI data licensing', audience: 'businesses', period: 'one-time',
        // DRAFT structure: years of history above a floor, times a value per year. Revenue share on each sale is folded into that value.
        formula: 'max(0, yearsOfHistory - minYearsOfHistory) x estimatedValuePerYearOfHistory',
        rates: {
          minYearsOfHistory: rate('Minimum years of records to qualify', 'years', 'Below this the business is not a fit for data licensing.'),
          estimatedValuePerYearOfHistory: rate('Estimated licensing value per year of history', 'USD per year of history', 'Business share of licensing value for each qualifying year of records.')
        }
      },
      'smarttab': {
        name: 'SmartTab', program: 'POS and payments', audience: 'venues', period: 'monthly',
        formula: 'locations x monthlyCardVolumePerLocation x residualBps / 10000',
        rates: {
          residualBps: rate('Residual on card volume', 'basis points (1 bp = 0.01%)', 'What the partner program pays on processed card volume.')
        }
      },
      'taiv': {
        name: 'TAIV', program: 'TV ad revenue', audience: 'venues', period: 'monthly',
        formula: 'locations x tvsPerLocation x ratePerTvPerMonth',
        rates: {
          ratePerTvPerMonth: rate('Venue payout per TV per month', 'USD per TV per month', 'Average monthly earnings for one qualifying screen.')
        }
      },
      'opinari': {
        name: 'Opinari', program: 'In-stream ads for brands', audience: 'brands', period: 'monthly',
        notApplicableReason: 'Opinari is sold to brands and advertisers, not venues. A venue has nothing to earn from it, so no venue estimate is produced.',
        formula: 'n/a for venues',
        rates: {}
      },
      'trillage': {
        name: 'Trillage', program: 'Local marketing that funds schools', audience: 'venues', period: 'one-time',
        notApplicableReason: 'Trillage is free local marketing for the business. The venue earns nothing from it, so no venue estimate is produced.',
        formula: 'n/a for venues',
        rates: {}
      }
    },
    order: ['hudson-house', 'troveo', 'smarttab', 'taiv', 'opinari', 'trillage']
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = config;
  else { root.MBR = root.MBR || {}; root.MBR.config = config; }
})(typeof self !== 'undefined' ? self : this);
