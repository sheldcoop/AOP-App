/*
 * Generic recipe split used by the simple Make-Up / Replenishment modules
 * (HCl Pretreatment, CZ-8401, Acid Rinse). Each module supplies its OWN config:
 *   basis "volume": total = Final Bath Volume [L]
 *   basis "area":   total = Processed Area [m²] × dosingLPerM2
 * Each component volume = total × percent / 100.
 * Contains no chemistry constants itself.
 */
(function (root) {
  var C = (typeof module !== "undefined" && module.exports) ? require("./common.js") : root.AOPCommon;

  function inputLabel(cfg) {
    return cfg.basis === "area" ? "Processed Area [m²]" : "Final Bath Volume [L]";
  }

  function calculateRecipe(raw, cfg) {
    var label = inputLabel(cfg);
    var unit = cfg.basis === "area" ? "m²" : "L";
    var x = C.parseNumber(raw);
    if (x.empty) return fail(label + " is required.", "missing");
    if (x.invalid) return fail(label + " must be a number.", "non_numeric");
    if (!(x.value > 0)) return fail(label + " must be greater than 0 " + unit + ".", "not_positive");

    var comps = cfg.components || [];
    var sum = comps.reduce(function (a, c) { return a + c.percent; }, 0);
    var badCfg = comps.some(function (c) { return !(c.percent >= 0); }) ||
      (comps.length > 0 && !C.approxEqual(sum, 100)) ||
      (cfg.basis === "area" && !(cfg.dosingLPerM2 > 0)) ||
      (cfg.basis !== "area" && cfg.basis !== "volume");
    if (badCfg) return fail("Module configuration is invalid. No result produced.", "consistency", "calculation");

    var total = cfg.basis === "area" ? x.value * cfg.dosingLPerM2 : x.value;
    var out = comps.map(function (c) {
      return { name: c.name, percent: c.percent, litres: total * c.percent / 100 };
    });
    var bal = out.reduce(function (a, c) { return a + c.litres; }, 0);
    if (out.length && !C.approxEqual(bal, total)) {
      return fail("Component volumes do not sum to the total. No result produced.", "consistency", "calculation");
    }

    return {
      ok: true, basis: cfg.basis, input: x.value, inputLabel: label,
      dosingLPerM2: cfg.basis === "area" ? cfg.dosingLPerM2 : null,
      totalL: total, components: out, configVersion: cfg.configVersion
    };
  }

  function fail(message, code, field) {
    return { ok: false, errors: [{ field: field || "input", code: code, message: message }] };
  }

  var api = { calculateRecipe: calculateRecipe, inputLabel: inputLabel };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.AOPRecipe = api;
})(this);
