/*
 * AP-3006 Fresh Make-Up calculation (pure logic, no UI).
 *
 * Scope: fresh bath make-up only. No AP-3006R replenishment and no M15
 * existing-bath adjustment logic belongs in this file.
 */
(function (root) {
  // Floating-point tolerance only (not an operational dosing tolerance).
  var FP_TOLERANCE = 1e-9;

  function parseNumber(raw) {
    if (raw === null || raw === undefined) return { empty: true };
    if (typeof raw === "number") {
      return Number.isFinite(raw) ? { value: raw } : { invalid: true };
    }
    var s = String(raw).trim();
    if (s === "") return { empty: true };
    if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s)) return { invalid: true };
    var v = Number(s);
    return Number.isFinite(v) ? { value: v } : { invalid: true };
  }

  function approxEqual(a, b) {
    return Math.abs(a - b) <= FP_TOLERANCE * Math.max(1, Math.abs(a), Math.abs(b));
  }

  /**
   * Calculate an AP-3006 fresh make-up recipe.
   * @param {number|string} volumeInput  Final AP-3006 bath volume [L]
   * @param {number|string} cuInput      Target Cu concentration [mg/L]
   * @param {object} config              CHEMISTRY_CONFIG.AP3006_MAKEUP
   * @returns {{ok: true, ...} | {ok: false, errors: Array<{field, code, message}>}}
   */
  function calculateMakeUp(volumeInput, cuInput, config) {
    var errors = [];
    var v = parseNumber(volumeInput);
    var c = parseNumber(cuInput);

    if (v.empty) {
      errors.push({ field: "volume", code: "missing", message: "Final AP-3006 Bath Volume [L] is required." });
    } else if (v.invalid) {
      errors.push({ field: "volume", code: "non_numeric", message: "Final AP-3006 Bath Volume must be a number." });
    } else if (!(v.value > 0)) {
      errors.push({ field: "volume", code: "not_positive", message: "Final AP-3006 Bath Volume must be greater than 0 L." });
    }

    var range = config.cuMinMgPerL + "–" + config.cuMaxMgPerL + " mg/L";
    if (c.empty) {
      errors.push({ field: "cu", code: "missing", message: "Target Cu Concentration [mg/L] is required." });
    } else if (c.invalid) {
      errors.push({ field: "cu", code: "non_numeric", message: "Target Cu Concentration must be a number." });
    } else if (c.value < config.cuMinMgPerL) {
      errors.push({ field: "cu", code: "below_range",
        message: "Target Cu " + c.value + " mg/L is below the documented AP-3006 make-up range of " + range + ". No recipe is produced." });
    } else if (c.value > config.cuMaxMgPerL) {
      errors.push({ field: "cu", code: "above_range",
        message: "Target Cu " + c.value + " mg/L exceeds the documented AP-3006 make-up range of " + range + ". No recipe is produced." });
    }

    if (errors.length) return { ok: false, errors: errors };

    var V = v.value;
    var Cu = c.value;

    var m1Pct = config.m1VolumePercent;
    var m2Pct = (Cu / config.m2CuEquivalentMgPerL) * 100;
    var diPct = 100 - m1Pct - m2Pct;

    var m1L = (V * m1Pct) / 100;
    var m2L = (V * m2Pct) / 100;
    var diL = V - m1L - m2L;

    var predictedCu = config.m2CuEquivalentMgPerL * (m2L / V);

    // Consistency checks (spec 7 / 10.6 / 10.7)
    var checkErrors = [];
    if ([m1Pct, m2Pct, diPct, m1L, m2L, diL].some(function (x) { return x < 0; })) {
      checkErrors.push("Negative component calculated — configuration error.");
    }
    if (!approxEqual(m1Pct + m2Pct + diPct, 100)) checkErrors.push("Percentages do not sum to 100 %.");
    if (!approxEqual(m1L + m2L + diL, V)) checkErrors.push("Component volumes do not sum to final volume.");
    if (!approxEqual(predictedCu, Cu)) checkErrors.push("Predicted Cu does not match target Cu.");
    if (checkErrors.length) {
      return { ok: false, errors: checkErrors.map(function (m) {
        return { field: "calculation", code: "consistency", message: m + " No operating instructions produced." };
      }) };
    }

    return {
      ok: true,
      inputs: { finalVolumeL: V, targetCuMgPerL: Cu },
      percent: { m1: m1Pct, m2: m2Pct, di: diPct },
      litres: { m1: m1L, m2: m2L, di: diL },
      totalL: m1L + m2L + diL,
      predictedCuMgPerL: predictedCu,
      mixOrder: config.mixOrder.slice(),
      configVersion: config.configVersion
    };
  }

  var api = { calculateMakeUp: calculateMakeUp, parseNumber: parseNumber };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.AP3006MakeUp = api;
  }
})(this);
