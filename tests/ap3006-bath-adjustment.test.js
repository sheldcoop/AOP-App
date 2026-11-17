const test = require("node:test");
const assert = require("node:assert/strict");
const CFG = require("../js/chemistry-config.js").AP3006_BATH_ADJUSTMENT;
const BA = require("../js/ap3006-bath-adjustment.js");
const close = (a, b, m) => assert.ok(Math.abs(a - b) < 1e-9, `${m}: ${a} != ${b}`);
const opt = (r, k) => r.options.find(o => o.key === k);

test("Solution contributions derived from workbook constants", () => {
  const s = BA.solutionContributions(CFG, 20);
  const mu = s.find(x => x.key === "mu"), rp = s.find(x => x.key === "rp"), di = s.find(x => x.key === "di");
  close(mu.ee, 100, "premix EE"); close(mu.acc, 100, "premix Acc"); close(mu.cu, 20, "premix Cu");
  close(rp.ee, 140, "repl EE"); close(rp.acc, 115.5, "repl Acc"); close(rp.cu, 54, "repl Cu");
  assert.deepEqual([di.ee, di.acc, di.cu], [0, 0, 0]);
});

test("AP-3006M1 is not offered on its own", () => {
  assert.deepEqual(CFG.solutions.map(s => s.key), ["di", "mu", "rp"]);
});

test("Cu too high: DI and premix options to reach target", () => {
  const r = BA.calculateForTargetCu({ currentVolume: 500, ee: 100, acc: 100, cu: 40, targetCu: 30, premixCu: 10 }, CFG);
  assert.equal(r.direction, "lower");
  close(opt(r, "di").litres, 500 * 10 / 30, "DI");
  close(opt(r, "di").prediction.params.cu.after, 30, "DI Cu");
  close(opt(r, "di").prediction.params.ee.after, 75, "DI dilutes EE");
  close(opt(r, "mu").litres, 500 * (30 - 40) / (10 - 30), "premix = 250 L");
  close(opt(r, "mu").prediction.params.cu.after, 30, "premix Cu");
  close(opt(r, "mu").prediction.params.ee.after, 100, "premix keeps EE");
  assert.equal(opt(r, "rp").feasible, false); // 54 mg/L cannot lower Cu
});

test("Premix Cu not below target cannot lower Cu", () => {
  const r = BA.calculateForTargetCu({ currentVolume: 500, ee: 100, acc: 100, cu: 40, targetCu: 30, premixCu: 30 }, CFG);
  assert.equal(opt(r, "mu").feasible, false);
});

test("Cu too low: replenisher mix raises Cu", () => {
  const r = BA.calculateForTargetCu({ currentVolume: 300, ee: 95, acc: 90, cu: 25, targetCu: 30, premixCu: 35 }, CFG);
  assert.equal(r.direction, "raise");
  assert.equal(opt(r, "di").feasible, false);
  close(opt(r, "rp").litres, 300 * 5 / 24, "repl");
  close(opt(r, "rp").prediction.params.cu.after, 30, "Cu");
  close(opt(r, "mu").litres, 300 * 5 / 5, "premix 35");
});

test("Premix option asks for Cu when not entered", () => {
  const r = BA.calculateForTargetCu({ currentVolume: 500, ee: 100, acc: 100, cu: 40, targetCu: 30, premixCu: "" }, CFG);
  assert.equal(r.ok, true);
  assert.match(opt(r, "mu").reason, /Enter the make-up premix Cu/);
  assert.equal(opt(r, "di").feasible, true);
});

test("Validation", () => {
  const base = { currentVolume: 500, ee: 100, acc: 100, cu: 40, targetCu: 30, premixCu: 10 };
  assert.equal(BA.calculateForTargetCu({ ...base, ee: "" }, CFG).errors[0].code, "missing");
  assert.equal(BA.calculateForTargetCu({ ...base, currentVolume: 0 }, CFG).errors[0].code, "not_positive");
  assert.equal(BA.calculateForTargetCu({ ...base, premixCu: 9 }, CFG).errors[0].code, "out_of_range");
  assert.equal(BA.calculateForTargetCu({ ...base, targetCu: 0 }, CFG).errors[0].code, "not_positive");
  assert.equal(BA.calculateForTargetCu({ ...base, cu: 30 }, CFG).direction, "none");
});

test("Check additions (M15 balance) with available solutions", () => {
  const r = BA.calculateBathAdjustment({ currentVolume: 400, ee: 90, acc: 85, cu: 32, premixCu: 20,
    additions: { di: 20, mu: 50, rp: 10 } }, CFG);
  close(r.volume.after, 480, "V");
  close(r.params.ee.after, (90 * 400 + 100 * 50 + 140 * 10) / 480, "EE");
  close(r.params.acc.after, (85 * 400 + 100 * 50 + 115.5 * 10) / 480, "Acc");
  close(r.params.cu.after, (32 * 400 + 20 * 50 + 54 * 10) / 480, "Cu");
});

test("Check additions: premix Cu only required when premix added", () => {
  const z = { di: 0, mu: 0, rp: 0 };
  const cur = { currentVolume: 100, ee: 100, acc: 100, cu: 30 };
  assert.equal(BA.calculateBathAdjustment({ ...cur, premixCu: "", additions: z }, CFG).ok, true);
  assert.equal(BA.calculateBathAdjustment({ ...cur, premixCu: "", additions: { ...z, mu: 5 } }, CFG).errors[0].field, "premixCu");
  assert.equal(BA.calculateBathAdjustment({ ...cur, additions: { ...z, di: -1 } }, CFG).errors[0].code, "negative");
});

test("Status uses optimum and control limits", () => {
  assert.equal(BA.classify("cu", 30, CFG).level, "optimum");
  assert.equal(BA.classify("cu", 20, CFG).level, "control");
  assert.match(BA.classify("cu", 9, CFG).guidance, /Add AP-3006M2/);
  assert.equal(BA.classify("acc", 126, CFG).label, "Above control limit");
});
