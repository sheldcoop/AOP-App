const test = require("node:test");
const assert = require("node:assert/strict");
const CFG = require("../js/chemistry-config.js").AP3006_BATH_ADJUSTMENT;
const { calculateBathAdjustment } = require("../js/ap3006-bath-adjustment.js");
const close = (a, b, m) => assert.ok(Math.abs(a - b) < 1e-9, `${m}: ${a} != ${b}`);
const run = (cur, add) => calculateBathAdjustment({ ...cur, additions: add }, CFG);

test("Workbook formulas — example", () => {
  const r = run({ currentVolume: 500, ee: 90, acc: 95, cu: 28 }, { m1: 10, m2: 5, r: 5, di: 0 });
  assert.equal(r.ok, true);
  close(r.volume.after, 520, "V");
  close(r.params.ee.after, (90 * 500 + 200 * 10 + 200 * 5) / 520, "EE");
  close(r.params.acc.after, (95 * 500 + 200 * 10 + 165 * 5) / 520, "Acc");
  close(r.params.cu.after, (28 * 500 + 240 * 5) / 520, "Cu");
});

test("No additions leaves bath unchanged", () => {
  const r = run({ currentVolume: 400, ee: 104, acc: 88, cu: 31 }, { m1: 0, m2: 0, r: 0, di: 0 });
  close(r.params.ee.after, 104, "EE"); close(r.params.acc.after, 88, "Acc"); close(r.params.cu.after, 31, "Cu");
});

test("DI-only dilution: 500 L at 40 mg/L + 166.67 L DI → 30 mg/L", () => {
  const r = run({ currentVolume: 500, ee: 100, acc: 100, cu: 40 }, { m1: 0, m2: 0, r: 0, di: 500 / 3 });
  close(r.params.cu.after, 30, "Cu");
  close(r.params.ee.after, 75, "EE diluted");
});

test("Cross-check with Make-Up: empty tank + 500 L / 30 mg/L recipe → EE 100 %, Acc 100 %, Cu 30", () => {
  const r = run({ currentVolume: 0, ee: 0, acc: 0, cu: 0 }, { m1: 250, m2: 62.5, r: 0, di: 187.5 });
  close(r.params.ee.after, 100, "EE"); close(r.params.acc.after, 100, "Acc"); close(r.params.cu.after, 30, "Cu");
  assert.ok(r.params.ee.withinOptimum && r.params.acc.withinOptimum && r.params.cu.withinOptimum);
});

test("Optimum ranges from workbook", () => {
  const r = run({ currentVolume: 100, ee: 100, acc: 100, cu: 36 }, { m1: 0, m2: 0, r: 0, di: 0 });
  assert.deepEqual([r.params.cu.optimum.min, r.params.cu.optimum.max], [25, 35]);
  assert.deepEqual([r.params.ee.optimum.min, r.params.ee.optimum.max], [90, 110]);
  assert.deepEqual([r.params.acc.optimum.min, r.params.acc.optimum.max], [80, 120]);
  assert.equal(r.params.cu.withinOptimum, false);
  assert.equal(r.params.ee.withinOptimum, true);
});

test("Validation", () => {
  const base = { currentVolume: 100, ee: 100, acc: 100, cu: 30 };
  const z = { m1: 0, m2: 0, r: 0, di: 0 };
  assert.equal(run({ ...base, ee: "" }, z).errors[0].code, "missing");
  assert.equal(run({ ...base, cu: "abc" }, z).errors[0].code, "non_numeric");
  assert.equal(run(base, { ...z, r: -1 }).errors[0].code, "negative");
  assert.equal(run({ ...base, currentVolume: 0 }, z).errors[0].code, "not_positive");
});

const { calculateAdditions } = require("../js/ap3006-bath-adjustment.js");
const sample = { currentVolume: 274, ee: 90.8, acc: 78.2, cu: 27.64, targetCu: 30 };

test("Calculate additions — workbook sample bath, method a (auto)", () => {
  const r = calculateAdditions(sample, CFG);
  assert.equal(r.autoMethod, "a"); assert.equal(r.feasible, true);
  close(r.additions.m1, 274 * (100 - 90.8) / (200 - 100), "M1");
  const cuPct = 27.64 / 30 * 100, c48 = cuPct * 274 / (274 + r.additions.m1);
  close(r.additions.m2, (274 + r.additions.m1) * (100 - c48) / (800 - 100), "M2");
  close(r.additions.m1, 25.208, "M1 value");
  assert.ok(Math.abs(r.additions.m2 - 6.680381) < 1e-6);
  close(r.prediction.params.cu.after, 30, "Cu hits target");
  assert.ok(Math.abs(r.prediction.params.ee.after - 97.816072) < 1e-6);
  assert.ok(Math.abs(r.prediction.params.acc.after - 86.529602) < 1e-6);
});

test("Method b — EE high, Cu low: DI + M2, EE to 100 and Cu to target", () => {
  const r = calculateAdditions({ currentVolume: 200, ee: 110, acc: 105, cu: 27, targetCu: 30 }, CFG);
  assert.equal(r.method, "b");
  close(r.additions.di, 200 * (110 - 100) / 100, "DI");
  close(r.prediction.params.cu.after, 30, "Cu");
  assert.equal(r.additions.m1, 0);
});

test("Method c — Cu high, EE low: M1 + DI, EE to 100 before DI and Cu to target", () => {
  const r = calculateAdditions({ currentVolume: 300, ee: 90, acc: 95, cu: 40, targetCu: 30 }, CFG);
  assert.equal(r.method, "c"); assert.equal(r.feasible, true);
  close(r.additions.m1, 300 * 10 / (200 - 100), "M1");
  close(r.prediction.params.cu.after, 30, "Cu");
  assert.equal(r.additions.m2, 0);
});

test("Workbook priority formula uses EE (user-approved)", () => {
  // Acc lower than EE: M1 still calculated from EE
  const r = calculateAdditions(sample, CFG);
  assert.equal(r.priorityTargetPct, 100);
  close(r.additions.m1, 274 * 9.2 / 100, "M1 from EE");
});

test("Negative addition → cannot be adjusted with that method", () => {
  const r = calculateAdditions({ currentVolume: 100, ee: 110, acc: 100, cu: 40, targetCu: 30 }, CFG, "a");
  assert.equal(r.feasible, false);
  assert.match(r.message, /cannot be adjusted/);
});

test("No applicable method is reported", () => {
  const r = calculateAdditions({ currentVolume: 100, ee: 100, acc: 100, cu: 30, targetCu: 30 }, CFG);
  assert.equal(r.applicable, false);
});

test("Manual override and validation", () => {
  assert.equal(calculateAdditions(sample, CFG, "b").method, "b");
  assert.equal(calculateAdditions({ ...sample, targetCu: "" }, CFG).errors[0].code, "missing");
  assert.equal(calculateAdditions({ ...sample, targetCu: 240 }, CFG).errors[0].code, "out_of_math_range");
  assert.equal(calculateAdditions({ ...sample, currentVolume: 0 }, CFG).errors[0].code, "not_positive");
});

test("M2 Cu on workbook % scale is 800 %", () => {
  assert.equal(240 / CFG.optional.cu100PctMgPerL * 100, 800);
});

test("Status uses optimum and control limits", () => {
  const { classify } = require("../js/ap3006-bath-adjustment.js");
  assert.equal(classify("cu", 30, CFG).level, "optimum");
  assert.equal(classify("cu", 20, CFG).level, "control");
  assert.equal(classify("cu", 9, CFG).level, "out");
  assert.match(classify("cu", 9, CFG).guidance, /Add AP-3006M2/);
  assert.equal(classify("ee", 112, CFG).level, "control");
  assert.equal(classify("acc", 126, CFG).label, "Above control limit");
});
