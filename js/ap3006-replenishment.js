/*
 * AP-3006 Replenishment calculation (pure logic, no UI).
 *
 * Independent of the Make-Up module: different recipe and calculation basis.
 * Total replenisher = processed area [m²] × dosing amount [L/m²], split by the
 * documented replenisher composition. No maximum-area limit, no Cu/bath-analysis
 * link, no mixing-order or premix assumption (not defined in the source).
 */
(function (root) {
  var FP_TOLERANCE = 1e-9;

  function parseNumber(raw) {
    if (raw === null || raw === undefined) return { empty: true };
    if (typeof raw === "number") return Number.isFinite(raw) ? { value: raw } : { invalid: true };
    var s = String(raw).trim();
    if (s === "") return { empty: true };
    if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s)) return { invalid: true };
    var v = Number(s);
    return Number.isFinite(v) ? { value: v } : { invalid: true };
  }

  function approxEqual(a, b) {
    return Math.abs(a - b) <= FP_TOLERANCE * Math.max(1, Math.abs(a), Math.abs(b));
  }

  function calculateReplenishment(areaInput, config) {
    var a = parseNumber(areaInput);
    if (a.empty) return fail("missing", "Processed Area [m²] is required.");
    if (a.invalid) return fail("non_numeric", "Processed Area must be a number.");
    if (!(a.value > 0)) return fail("not_positive", "Processed Area must be greater than 0 m².");

    var c = config.composition;
    if (!approxEqual(c.rPercent + c.m2Percent + c.diPercent, 100) ||
        [c.rPercent, c.m2Percent, c.diPercent, config.dosingLPerM2].some(function (x) { return !(x >= 0); })) {
      return fail("consistency", "Replenisher configuration is invalid. No result produced.", "calculation");
    }

    var area = a.value;
    var total = area * config.dosingLPerM2;
    var rL = total * c.rPercent / 100;
    var m2L = total * c.m2Percent / 100;
    var diL = total * c.diPercent / 100;

    if (!approxEqual(rL + m2L + diL, total)) {
      return fail("consistency", "Component volumes do not sum to total replenisher. No result produced.", "calculation");
    }

    return {
      ok: true,
      inputs: { processedAreaM2: area },
      dosingLPerM2: config.dosingLPerM2,
      totalL: total,
      percent: { r: c.rPercent, m2: c.m2Percent, di: c.diPercent },
      litres: { r: rL, m2: m2L, di: diL },
      configVersion: config.configVersion
    };
  }

  function fail(code, message, field) {
    return { ok: false, errors: [{ field: field || "area", code: code, message: message }] };
  }

  var api = { calculateReplenishment: calculateReplenishment };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.AP3006Replenishment = api;
})(this);
