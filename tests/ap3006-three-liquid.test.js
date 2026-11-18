const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateThreeLiquidMix } = require("../js/ap3006-bath-adjustment.js");
const close = (a, b, m) => assert.ok(Math.abs(a - b) < 1e-9, `${m}: ${a} != ${b}`);

test("User example: 30 & 54 mg/L tanks, 10 L from Tank 2 → 42 L Tank 1 + 48 L DI = 100 L at 18", () => {
  const r = calculateThreeLiquidMix({ cu1: 30, cu2: 54, finalVolume: 100, targetCu: 18, t2: 10 });
  assert.equal(r.feasible, true);
  close(r.t1, 42, "Tank 1"); close(r.di, 48, "DI"); close(r.checkCu, 18, "Cu");
});

test("Tank 2 = 0 → only Tank 1 + DI", () => {
  const r = calculateThreeLiquidMix({ cu1: 30, cu2: 54, finalVolume: 100, targetCu: 18, t2: 0 });
  close(r.t1, 60, "Tank 1"); close(r.di, 40, "DI");
});

test("Too much Tank 2 is rejected with allowed range", () => {
  const r = calculateThreeLiquidMix({ cu1: 30, cu2: 54, finalVolume: 100, targetCu: 18, t2: 40 });
  assert.equal(r.feasible, false);
  close(r.range.min, 0, "min"); close(r.range.max, 1800 / 54, "max");
  assert.match(r.message, /between 0.0 and 33.3/);
});

test("Raising above Tank 1 needs a minimum from Tank 2", () => {
  const r = calculateThreeLiquidMix({ cu1: 30, cu2: 54, finalVolume: 100, targetCu: 40, t2: 50 });
  close(r.range.min, 1000 / 24, "min");
  assert.equal(r.feasible, true); close(r.checkCu, 40, "Cu");
  assert.equal(calculateThreeLiquidMix({ cu1: 30, cu2: 54, finalVolume: 100, targetCu: 40, t2: 10 }).feasible, false);
});

test("Validation", () => {
  assert.equal(calculateThreeLiquidMix({ cu1: "", cu2: 54, finalVolume: 100, targetCu: 18, t2: 10 }).errors[0].code, "missing");
  assert.equal(calculateThreeLiquidMix({ cu1: 0, cu2: 54, finalVolume: 100, targetCu: 18, t2: 10 }).errors[0].code, "not_positive");
});
