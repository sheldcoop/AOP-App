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
        withinOptimum: after >= min - C.FP_TOLERANCE && after <= max + C.FP_TOLERANCE,
        status: classify(k, after, cfg)
      };
    });
    return result;
  }

  /* Status against workbook optimum range and control limit. */
  function classify(k, x, cfg) {
    var o = cfg.optimum[k], c = cfg.control[k], t = C.FP_TOLERANCE;
    if (x >= o.target - o.tol - t && x <= o.target + o.tol + t) return { level: "optimum", label: "Within optimum" };
    if (x >= c.min - t && x <= c.max + t) return { level: "control", label: "Within control limit (outside optimum)" };
    var low = x < c.min;
    return { level: "out", label: low ? "Below control limit" : "Above control limit",
             guidance: cfg.guidance[k][low ? "low" : "high"] };
  }

  /*
   * "Calculate additions" — reproduces workbook sheet "AP-3006 Optional adjustment".
   * Works on the workbook's % scale (Cu 100 % = 30 mg/L; AP-3006M2 = 240 mg/L = 800 %).
   *   T  = IF((T_EE − EE) < (T_Acc − Acc), T_EE, T_Acc)        (workbook formula, uses EE)
   *   a) M1 + M2:  M1 = V(T − EE)/(200 − T);  M2 = (V + M1)(T_Cu − Cu·V/(V+M1)) / (800 − T_Cu)
   *   b) DI + M2:  DI = V(EE − T)/T;           M2 = (V + DI)(T_Cu − Cu·V/(V+DI)) / (800 − T_Cu)
   *   c) M1 + DI:  M1 = V(T − EE)/(200 − T);  DI = (V + M1)(Cu·V/(V+M1) − T_Cu) / T_Cu
   * Automatic choice (user-approved), conditions compared relative to the targets:
   *   a: EE, Acc and Cu all below target;  b: EE > Cu;  c: Cu > EE and EE below target.
   */
  var METHODS = {
    a: { label: "a) Add AP-3006M1 and AP-3006M2", condition: "All ingredients below target" },
    b: { label: "b) Add DI Water and AP-3006M2", condition: "Effective Element > Cu" },
    c: { label: "c) Add DI Water and AP-3006M1", condition: "Cu > Effective Element and Effective Element below target" }
  };

  function chooseMethod(er, ar, cr) {
    if (er < 1 && ar < 1 && cr < 1) return "a";
    if (er > cr) return "b";
    if (cr > er && er < 1) return "c";
    return null;
  }

  function calculateAdditions(inputs, cfg, forcedMethod) {
    var op = cfg.optional, errors = [], v = {};
    FIELDS.concat([{ key: "targetCu", label: "Target Cu [mg/L]" }]).forEach(function (f) {
      var p = C.parseNumber(inputs[f.key]);
      if (p.empty) errors.push({ field: f.key, code: "missing", message: f.label + " is required." });
      else if (p.invalid) errors.push({ field: f.key, code: "non_numeric", message: f.label + " must be a number." });
      else if (p.value < 0) errors.push({ field: f.key, code: "negative", message: f.label + " cannot be negative." });
      else v[f.key] = p.value;
    });
    var m1 = cfg.materials.filter(function (m) { return m.key === "m1"; })[0];
    var m2 = cfg.materials.filter(function (m) { return m.key === "m2"; })[0];
    if (!errors.length && !(v.currentVolume > 0)) errors.push({ field: "currentVolume", code: "not_positive", message: "Current Working Solution Volume must be greater than 0 L." });
    if (!errors.length && !(v.targetCu > 0 && v.targetCu < m2.cu)) errors.push({ field: "targetCu", code: "out_of_math_range",
      message: "Target Cu must be greater than 0 and less than " + m2.cu + " mg/L (Cu content of AP-3006M2)." });
    if (errors.length) return { ok: false, errors: errors };

    var V = v.currentVolume, EE = v.ee, ACC = v.acc;
    var CU = v.cu / op.cu100PctMgPerL * 100, TC = v.targetCu / op.cu100PctMgPerL * 100;
    var K = m2.cu / op.cu100PctMgPerL * 100;        // 800 %
    var M1E = m1.ee;                                 // 200 %
    var TE = op.targetEEPct, TA = op.targetAccPct;
    var T = (TE - EE) < (TA - ACC) ? TE : TA;

    var auto = chooseMethod(EE / TE, ACC / TA, CU / TC);
    var method = forcedMethod || auto;
    var base = { ok: true, autoMethod: auto, method: method, methods: METHODS, priorityTargetPct: T,
                 cuPct: CU, targetCuPct: TC, configVersion: cfg.configVersion };
    if (!method) return Object.assign(base, { applicable: false,
      message: "None of the workbook methods (a, b, c) applies to this bath condition. Select a method manually or review the bath analysis." });

    var add = { m1: 0, m2: 0, r: 0, di: 0 }, step1 = {};
    if (method === "a" || method === "c") {
      add.m1 = V * (T - EE) / (M1E - T);
      var cuAfterM1 = CU * V / (V + add.m1);
      step1 = { material: "m1", cuPct: cuAfterM1 };
      if (method === "a") add.m2 = (V + add.m1) * (TC - cuAfterM1) / (K - TC);
      else add.di = (V + add.m1) * (cuAfterM1 - TC) / TC;
    } else {
      add.di = V * (EE - T) / T;
      var cuAfterDI = CU * V / (V + add.di);
      step1 = { material: "di", cuPct: cuAfterDI };
      add.m2 = (V + add.di) * (TC - cuAfterDI) / (K - TC);
    }
    // treat floating-point noise as zero
    Object.keys(add).forEach(function (k) { if (Math.abs(add[k]) < 1e-9 * Math.max(1, V)) add[k] = 0; });
    var feasible = Object.keys(add).every(function (k) { return add[k] >= 0; });
    var res = Object.assign(base, { applicable: true, feasible: feasible, additions: add, step1: step1 });
    if (!feasible) {
      res.message = "Addition amount is negative: the bath cannot be adjusted with method " + method + ".";
      return res;
    }
    var check = calculateBathAdjustment({ currentVolume: V, ee: EE, acc: ACC, cu: v.cu, additions: add }, cfg);
    res.prediction = check;
    return res;
  }

  var api = { calculateBathAdjustment: calculateBathAdjustment, calculateAdditions: calculateAdditions,
              classify: classify, METHODS: METHODS, FIELDS: FIELDS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.AP3006BathAdjustment = api;
})(this);
