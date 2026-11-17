/*
 * AP-3006 Bath Adjustment (workbook sheet M15) — prediction only.
 * The operator enters the current bath and proposed additions; the app predicts
 * the final Effective Element, Accelerator and Cu. It does not recommend amounts.
 *
 *   Final_Volume = Current_Volume + Σ additions
 *   Final_X      = (Current_X × Current_Volume + Σ contribution_X × addition) / Final_Volume
 *
 * Independent of Make-Up and Replenishment logic.
 */
(function (root) {
  var C = (typeof module !== "undefined" && module.exports) ? require("./common.js") : root.AOPCommon;

  var FIELDS = [
    { key: "currentVolume", label: "Current Working Solution Volume [L]" },
    { key: "ee", label: "Effective Element [%]" },
    { key: "acc", label: "Accelerator [%]" },
    { key: "cu", label: "Cu [mg/L]" }
  ];

  function calculateBathAdjustment(inputs, cfg) {
    var errors = [], v = {}, add = {};
    var all = FIELDS.concat(cfg.materials.map(function (m) {
      return { key: m.key, label: m.name + " addition [L]", isAdd: true };
    }));
    all.forEach(function (f) {
      var raw = f.isAdd ? (inputs.additions || {})[f.key] : inputs[f.key];
      var p = C.parseNumber(raw);
      if (p.empty) errors.push({ field: f.key, code: "missing", message: f.label + " is required." });
      else if (p.invalid) errors.push({ field: f.key, code: "non_numeric", message: f.label + " must be a number." });
      else if (p.value < 0) errors.push({ field: f.key, code: "negative", message: f.label + " cannot be negative." });
      else (f.isAdd ? add : v)[f.key] = p.value;
    });
    if (errors.length) return { ok: false, errors: errors };

    var V0 = v.currentVolume;
    var added = cfg.materials.reduce(function (a, m) { return a + add[m.key]; }, 0);
    var V1 = V0 + added;
    if (!(V1 > 0)) {
      return { ok: false, errors: [{ field: "currentVolume", code: "not_positive",
        message: "Final volume (current volume + additions) must be greater than 0 L." }] };
    }

    function final(param) {
      var s = v[param] * V0;
      cfg.materials.forEach(function (m) { s += m[param] * add[m.key]; });
      return s / V1;
    }

    var result = { ok: true, configVersion: cfg.configVersion,
      volume: { before: V0, added: added, after: V1 }, additions: add, params: {} };
    ["ee", "acc", "cu"].forEach(function (k) {
      var after = final(k), o = cfg.optimum[k];
      var min = o.target - o.tol, max = o.target + o.tol;
      result.params[k] = {
        before: v[k], after: after, change: after - v[k],
        optimum: { min: min, max: max, target: o.target, tol: o.tol, unit: o.unit },
        withinOptimum: after >= min - C.FP_TOLERANCE && after <= max + C.FP_TOLERANCE
      };
    });
    return result;
  }

  var api = { calculateBathAdjustment: calculateBathAdjustment, FIELDS: FIELDS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.AP3006BathAdjustment = api;
})(this);
