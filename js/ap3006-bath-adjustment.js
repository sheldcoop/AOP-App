/*
 * AP-3006 Bath Adjustment — starts from MEASURED bath analysis.
 * Independent of AP-3006 Make-Up. Inputs are measured bath values only.
 *
 * Only solutions available at the machine can be added (user-confirmed):
 *   DI Water, the lab's fresh make-up premix (Cu entered by operator), replenisher mix.
 * Each solution's contribution is derived from the workbook M15 single-chemical constants:
 *   contribution_X = Σ (v/v % of chemical / 100) × chemical_X
 *     make-up premix: EE 100 %, Acc 100 %, Cu = premix Cu
 *     replenisher mix: EE 140 %, Acc 115.5 %, Cu 54 mg/L
 *
 * Concentration balance (workbook M15):
 *   Final_V = V + Σ additions
 *   Final_X = (X × V + Σ contribution_X × addition) / Final_V
 * Amount of one solution s needed for a target Cu:
 *   x_s = V × (Target_Cu − Cu) / (Cu_s − Target_Cu)      (valid only if x_s ≥ 0)
 */
(function (root) {
  var C = (typeof module !== "undefined" && module.exports) ? require("./common.js") : root.AOPCommon;

  var FIELDS = [
    { key: "currentVolume", label: "Working Solution Volume [L]" },
    { key: "ee", label: "Effective Element [%]" },
    { key: "acc", label: "Accelerator [%]" },
    { key: "cu", label: "Cu [mg/L]" }
  ];
  var PARAMS = ["ee", "acc", "cu"];

  function parseFields(fields, src, errors, out) {
    fields.forEach(function (f) {
      var p = C.parseNumber(src[f.key]);
      if (p.empty) errors.push({ field: f.key, code: "missing", message: f.label + " is required." });
      else if (p.invalid) errors.push({ field: f.key, code: "non_numeric", message: f.label + " must be a number." });
      else if (p.value < 0) errors.push({ field: f.key, code: "negative", message: f.label + " cannot be negative." });
      else out[f.key] = p.value;
    });
  }

  /* Contribution (EE %, Acc %, Cu mg/L) and composition of each available solution. */
  function solutionContributions(cfg, premixCu) {
    return cfg.solutions.map(function (s) {
      var comp = s.composition;
      if (s.premix) {
        if (premixCu === null || premixCu === undefined) return { key: s.key, name: s.name, unavailable: true };
        var m2 = premixCu / cfg.chemicals.m2.cu * 100;
        comp = { m1: s.m1Percent, m2: m2, di: 100 - s.m1Percent - m2 };
      }
      var out = { key: s.key, name: s.name, composition: comp, ee: 0, acc: 0, cu: 0 };
      Object.keys(comp).forEach(function (k) {
        PARAMS.forEach(function (p) { out[p] += comp[k] / 100 * cfg.chemicals[k][p]; });
      });
      return out;
    });
  }

  function classify(k, x, cfg) {
    var o = cfg.optimum[k], c = cfg.control[k], t = C.FP_TOLERANCE;
    if (x >= o.target - o.tol - t && x <= o.target + o.tol + t) return { level: "optimum", label: "Within optimum" };
    if (x >= c.min - t && x <= c.max + t) return { level: "control", label: "Within control limit (outside optimum)" };
    var low = x < c.min;
    return { level: "out", label: low ? "Below control limit" : "Above control limit",
             guidance: cfg.guidance[k][low ? "low" : "high"] };
  }

  function predict(cur, additions, sols, cfg) {
    var added = 0, sums = { ee: cur.ee * cur.currentVolume, acc: cur.acc * cur.currentVolume, cu: cur.cu * cur.currentVolume };
    sols.forEach(function (s) {
      var x = additions[s.key] || 0;
      if (!x) return;
      added += x;
      PARAMS.forEach(function (p) { sums[p] += s[p] * x; });
    });
    var V1 = cur.currentVolume + added;
    var res = { volume: { before: cur.currentVolume, added: added, after: V1 }, params: {} };
    PARAMS.forEach(function (p) {
      var after = sums[p] / V1, o = cfg.optimum[p];
      res.params[p] = { before: cur[p], after: after, change: after - cur[p],
        optimum: { min: o.target - o.tol, max: o.target + o.tol, target: o.target, tol: o.tol, unit: o.unit },
        status: classify(p, after, cfg) };
    });
    return res;
  }

  function parsePremix(raw, cfg, errors, required) {
    var p = C.parseNumber(raw), lbl = "Make-up premix Cu [mg/L]";
    if (p.empty) { if (required) errors.push({ field: "premixCu", code: "missing", message: lbl + " is required when make-up premix is added." }); return null; }
    if (p.invalid) { errors.push({ field: "premixCu", code: "non_numeric", message: lbl + " must be a number." }); return null; }
    if (p.value < cfg.premixCuMinMgPerL || p.value > cfg.premixCuMaxMgPerL) {
      errors.push({ field: "premixCu", code: "out_of_range", message: lbl + " must be within the documented make-up range " + cfg.premixCuMinMgPerL + "–" + cfg.premixCuMaxMgPerL + " mg/L." });
      return null;
    }
    return p.value;
  }

  /* Mode 1 — target Cu: amount of each available solution (used alone) to reach it. */
  function calculateForTargetCu(inputs, cfg) {
    var errors = [], v = {};
    parseFields(FIELDS.concat([{ key: "targetCu", label: "Target Cu [mg/L]" }]), inputs, errors, v);
    var premixCu = parsePremix(inputs.premixCu, cfg, errors, false);
    if (!errors.length && !(v.currentVolume > 0)) errors.push({ field: "currentVolume", code: "not_positive", message: "Working Solution Volume must be greater than 0 L." });
    if (!errors.length && !(v.targetCu > 0)) errors.push({ field: "targetCu", code: "not_positive", message: "Target Cu must be greater than 0 mg/L." });
    if (errors.length) return { ok: false, errors: errors };

    var sols = solutionContributions(cfg, premixCu);
    var usable = sols.filter(function (s) { return !s.unavailable; });
    var current = predict(v, {}, usable, cfg);
    var atTarget = C.approxEqual(v.cu, v.targetCu);
    var direction = atTarget ? "none" : v.cu > v.targetCu ? "lower" : "raise";

    var options = sols.map(function (s) {
      var o = { key: s.key, name: s.name, contribution: s.unavailable ? null : { ee: s.ee, acc: s.acc, cu: s.cu }, composition: s.composition };
      if (s.unavailable) { o.feasible = false; o.reason = "Enter the make-up premix Cu to calculate this option."; return o; }
      if (atTarget) { o.feasible = false; o.reason = "Cu is already at the target."; return o; }
      if (C.approxEqual(s.cu, v.targetCu)) { o.feasible = false; o.reason = "This solution's Cu equals the target, so it cannot change Cu towards it."; return o; }
      var x = v.currentVolume * (v.targetCu - v.cu) / (s.cu - v.targetCu);
      if (x < 0) {
        o.feasible = false;
        o.reason = "Cannot reach the target with this solution: its Cu (" + s.cu.toFixed(2) + " mg/L) is " +
          (direction === "lower" ? "not lower" : "not higher") + " than the target.";
        return o;
      }
      var add = {}; add[s.key] = x;
      o.feasible = true; o.litres = x; o.prediction = predict(v, add, usable, cfg);
      return o;
    });
    return { ok: true, configVersion: cfg.configVersion, inputs: v, premixCu: premixCu,
             direction: direction, current: current, options: options };
  }

  /* Mode 2 — check additions entered by the operator (M15 concentration balance). */
  function calculateBathAdjustment(inputs, cfg) {
    var errors = [], v = {}, add = {};
    parseFields(FIELDS, inputs, errors, v);
    parseFields(cfg.solutions.map(function (s) { return { key: s.key, label: s.name + " addition [L]" }; }),
                inputs.additions || {}, errors, add);
    var premixCu = parsePremix(inputs.premixCu, cfg, errors, add.mu > 0);
    if (errors.length) return { ok: false, errors: errors };
    var V1 = v.currentVolume + Object.keys(add).reduce(function (a, k) { return a + add[k]; }, 0);
    if (!(V1 > 0)) return { ok: false, errors: [{ field: "currentVolume", code: "not_positive",
      message: "Final volume (current volume + additions) must be greater than 0 L." }] };
    var sols = solutionContributions(cfg, premixCu).filter(function (s) { return !s.unavailable; });
    var r = predict(v, add, sols, cfg);
    r.ok = true; r.additions = add; r.solutions = sols; r.premixCu = premixCu; r.configVersion = cfg.configVersion;
    return r;
  }

  /*
   * Three-tank mix: Tank 1 and Tank 2 hold solutions; Tank 3 is the mixing tank
   * (empty, or holding the existing bath). The operator enters the final volume
   * wanted in Tank 3 and the target Cu; the app returns how much to take from
   * Tank 1 and Tank 2.
   *   x1 + x2 = Vf − V0
   *   c1·x1 + c2·x2 = Cu_target·Vf − Cu0·V0
   */
  function calculateTankMix(inputs, cfg) {
    var errors = [], v = {};
    parseFields([{ key: "currentVolume", label: "Tank 3 current volume [L]" },
                 { key: "finalVolume", label: "Final volume in Tank 3 [L]" },
                 { key: "targetCu", label: "Target Cu [mg/L]" }], inputs, errors, v);
    var hasBath = v.currentVolume > 0;
    if (hasBath) {
      parseFields([{ key: "ee", label: "Tank 3 Effective Element [%]" },
                   { key: "acc", label: "Tank 3 Accelerator [%]" },
                   { key: "cu", label: "Tank 3 Cu [mg/L]" }], inputs, errors, v);
    } else { v.ee = 0; v.acc = 0; v.cu = 0; }
    var needPremix = inputs.tank1 === "mu" || inputs.tank2 === "mu";
    var premixCu = parsePremix(inputs.premixCu, cfg, errors, needPremix);
    if (inputs.tank1 === inputs.tank2) errors.push({ field: "tank2", code: "same", message: "Tank 1 and Tank 2 must hold different solutions." });
    if (!errors.length && !(v.finalVolume > v.currentVolume)) errors.push({ field: "finalVolume", code: "too_small",
      message: "Final volume must be greater than the current volume in Tank 3 (" + v.currentVolume + " L)." });
    if (!errors.length && !(v.targetCu > 0)) errors.push({ field: "targetCu", code: "not_positive", message: "Target Cu must be greater than 0 mg/L." });
    if (errors.length) return { ok: false, errors: errors };

    var sols = solutionContributions(cfg, premixCu);
    var s1 = sols.filter(function (s) { return s.key === inputs.tank1; })[0];
    var s2 = sols.filter(function (s) { return s.key === inputs.tank2; })[0];
    var A = v.finalVolume - v.currentVolume;
    var B = v.targetCu * v.finalVolume - v.cu * v.currentVolume;
    var base = { ok: true, configVersion: cfg.configVersion, inputs: v, tank1: s1, tank2: s2, premixCu: premixCu };
    if (C.approxEqual(s1.cu, s2.cu)) return Object.assign(base, { feasible: false,
      message: "Tank 1 and Tank 2 have the same Cu (" + s1.cu.toFixed(2) + " mg/L), so they cannot be mixed to a different Cu." });
    var x1 = (B - s2.cu * A) / (s1.cu - s2.cu), x2 = A - x1;
    if (Math.abs(x1) < 1e-9 * Math.max(1, A)) x1 = 0;
    if (Math.abs(x2) < 1e-9 * Math.max(1, A)) x2 = 0;
    if (x1 < 0 || x2 < 0) {
      var lo = (s1.cu * A + v.cu * v.currentVolume) / v.finalVolume, hi = (s2.cu * A + v.cu * v.currentVolume) / v.finalVolume;
      return Object.assign(base, { feasible: false, x1: x1, x2: x2,
        message: "Not possible with these tanks: at " + v.finalVolume + " L the Cu can only be between " +
          Math.min(lo, hi).toFixed(2) + " and " + Math.max(lo, hi).toFixed(2) + " mg/L. Change the target Cu, the final volume or the tank solutions." });
    }
    var add = {}; add[s1.key] = x1; add[s2.key] = x2;
    var pred = predict(v, add, [s1, s2], cfg);
    return Object.assign(base, { feasible: true, x1: x1, x2: x2, prediction: pred, hasBath: hasBath });
  }

  var api = { calculateForTargetCu: calculateForTargetCu, calculateBathAdjustment: calculateBathAdjustment, calculateTankMix: calculateTankMix,
              solutionContributions: solutionContributions, classify: classify, FIELDS: FIELDS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.AP3006BathAdjustment = api;
})(this);
