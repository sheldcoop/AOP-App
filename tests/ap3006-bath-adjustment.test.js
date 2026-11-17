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
