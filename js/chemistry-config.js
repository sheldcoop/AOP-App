/*
 * Authoritative chemistry configuration for the AOP Chemistry Calculation App.
 *
 * All chemistry constants live here. UI and calculation code must read from
 * this object and never hard-code values.
 *
 * Source: AP-3006 Make-Up Module Specification (MEC CZ-8401 + AP-3006 + Alkaline
 * process documentation and the approved AP-3006/CZ-8401/Alkaline workbook).
 */
(function (root) {
  var CHEMISTRY_CONFIG = Object.freeze({
    AP3006_MAKEUP: Object.freeze({
      chemistry: "AP-3006",
      operation: "Fresh Make-Up",
      configVersion: "AP-3006-MU-1.0",
      sourceBasis:
        "MEC CZ-8401 + AP-3006 + Alkaline process documentation; approved AP-3006/CZ-8401/Alkaline calculation workbook",
      // Fixed AP-3006M1 make-up concentration [v/v %]
      m1VolumePercent: 50.0,
      // Cu contribution of 100 % AP-3006M2 [mg/L]
      m2CuEquivalentMgPerL: 240,
      // Documented make-up Cu range [mg/L] (hard interlock, user-approved)
      cuMinMgPerL: 10,
      cuMaxMgPerL: 35,
      // Operational default target Cu [mg/L] (user-approved)
      cuDefaultMgPerL: 30,
      // Display precision (user-approved). Full precision is used internally.
      display: Object.freeze({ volumeDecimals: 1, percentDecimals: 2, cuDecimals: 2 }),
      // Mixing order as specified by the supplier source
      mixOrder: Object.freeze(["DI Water", "AP-3006M1", "AP-3006M2"])
    })
  });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = CHEMISTRY_CONFIG;
  } else {
    root.CHEMISTRY_CONFIG = CHEMISTRY_CONFIG;
  }
})(this);
