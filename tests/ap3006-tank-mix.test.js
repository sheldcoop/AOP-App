const test = require("node:test");
const assert = require("node:assert/strict");
const CFG = require("../js/chemistry-config.js").AP3006_BATH_ADJUSTMENT;
const { calculateTankMix } = require("../js/ap3006-bath-adjustment.js");
const close = (a, b, m) => assert.ok(Math.abs(a - b) < 1e-9, `${m}: ${a} != ${b}`);

test("Existing bath + replenisher mix + DI → target Cu at final volume", () => {
  const r = calculateTankMix({ tank1: "rp", tank2: "di", currentVolume: 100, ee: 90.8, acc: 78.2, cu: 22, finalVolume: 150, targetCu: 30 }, CFG);
  assert.equal(r.feasible, true);
  close(r.x1, 2300 / 54, "tank 1");
  close(r.x1 + r.x2, 50, "sum");
  close(r.prediction.volume.after, 150, "V");
  close(r.prediction.params.cu.after, 30, "Cu");
  close(r.prediction.params.ee.after, (90.8 * 100 + 140 * r.x1) / 150, "EE");
});

test("Empty tank 3 from premix + DI", () => {
  const r = calculateTankMix({ tank1: "mu", tank2: "di", premixCu: 35, currentVolume: 0, finalVolume: 100, targetCu: 30 }, CFG);
  close(r.x1, 3000 / 35, "premix"); close(r.x2, 100 - 3000 / 35, "DI");
  close(r.prediction.params.cu.after, 30, "Cu");
});

test("Lowering Cu: bath at 40 with premix 10 + DI", () => {
  const r = calculateTankMix({ tank1: "mu", tank2: "di", premixCu: 10, currentVolume: 500, ee: 100, acc: 100, cu: 40, finalVolume: 750, targetCu: 30 }, CFG);
  assert.equal(r.feasible, true);
  close(r.prediction.params.cu.after, 30, "Cu");
  close(r.x1, 250, "all premix"); close(r.x2, 0, "no DI");
});

test("Out of reach reports the achievable range", () => {
  const r = calculateTankMix({ tank1: "rp", tank2: "di", currentVolume: 100, ee: 100, acc: 100, cu: 22, finalVolume: 110, targetCu: 30 }, CFG);
  assert.equal(r.feasible, false);
  assert.match(r.message, /between 20.00 and 24.91/);
});

test("Validation", () => {
  const base = { tank1: "rp", tank2: "di", currentVolume: 100, ee: 90, acc: 80, cu: 22, finalVolume: 150, targetCu: 30 };
  assert.equal(calculateTankMix({ ...base, tank2: "rp" }, CFG).errors[0].code, "same");
  assert.equal(calculateTankMix({ ...base, finalVolume: 100 }, CFG).errors[0].code, "too_small");
  assert.equal(calculateTankMix({ ...base, cu: "" }, CFG).errors[0].code, "missing");
  assert.equal(calculateTankMix({ ...base, tank1: "mu", premixCu: "" }, CFG).errors[0].field, "premixCu");
  assert.equal(calculateTankMix({ ...base, currentVolume: 0, cu: "" }, CFG).ok, true); // empty tank: no analysis needed
});
