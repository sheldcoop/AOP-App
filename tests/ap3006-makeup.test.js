const test = require("node:test");
const assert = require("node:assert/strict");
const CONFIG = require("../js/chemistry-config.js").AP3006_MAKEUP;
const { calculateMakeUp } = require("../js/ap3006-makeup.js");

const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} != ${b}`);

test("Test 1 — 500 L, 30 mg/L", () => {
  const r = calculateMakeUp(500, 30, CONFIG);
  assert.equal(r.ok, true);
  close(r.litres.m1, 250, "M1 L");
  close(r.litres.m2, 62.5, "M2 L");
  close(r.litres.di, 187.5, "DI L");
  close(r.percent.m1, 50, "M1 %");
  close(r.percent.m2, 12.5, "M2 %");
  close(r.percent.di, 37.5, "DI %");
  close(r.predictedCuMgPerL, 30, "Cu");
});

test("Test 2 — lower boundary 100 L, 10 mg/L", () => {
  const r = calculateMakeUp(100, 10, CONFIG);
  assert.equal(r.ok, true);
  close(r.litres.m1, 50, "M1");
  close(r.litres.m2, 100 * 10 / 240, "M2");
  close(r.litres.di, 50 - 100 * 10 / 240, "DI");
  close(r.predictedCuMgPerL, 10, "Cu");
});

test("Test 3 — upper boundary 100 L, 35 mg/L", () => {
  const r = calculateMakeUp(100, 35, CONFIG);
  assert.equal(r.ok, true);
  close(r.litres.m1, 50, "M1");
  close(r.litres.m2, 100 * 35 / 240, "M2");
  close(r.litres.di, 50 - 100 * 35 / 240, "DI");
  close(r.predictedCuMgPerL, 35, "Cu");
});

test("Test 4 — below range blocked", () => {
  const r = calculateMakeUp(100, 9, CONFIG);
  assert.equal(r.ok, false);
  assert.equal(r.errors[0].code, "below_range");
  assert.match(r.errors[0].message, /below the documented .*10–35 mg\/L/);
});

test("Test 5 — above range blocked", () => {
  const r = calculateMakeUp(100, 36, CONFIG);
  assert.equal(r.ok, false);
  assert.equal(r.errors[0].code, "above_range");
  assert.match(r.errors[0].message, /exceeds the documented .*10–35 mg\/L/);
});

test("Test 6 — zero / negative volume blocked", () => {
  assert.equal(calculateMakeUp(0, 30, CONFIG).errors[0].code, "not_positive");
  assert.equal(calculateMakeUp(-5, 30, CONFIG).errors[0].code, "not_positive");
});

test("Missing and non-numeric inputs", () => {
  const m = calculateMakeUp("", "  ", CONFIG);
  assert.deepEqual(m.errors.map(e => [e.field, e.code]), [["volume", "missing"], ["cu", "missing"]]);
  const n = calculateMakeUp("abc", "30mg", CONFIG);
  assert.deepEqual(n.errors.map(e => e.code), ["non_numeric", "non_numeric"]);
  assert.equal(calculateMakeUp("500", "30", CONFIG).ok, true);
});

test("Tests 7 & 8 — balance and Cu back-calculation for many accepted inputs", () => {
  for (const V of [0.5, 1, 37.3, 100, 250, 500, 1234.567, 10000]) {
    for (let Cu = 10; Cu <= 35; Cu += 0.25) {
      const r = calculateMakeUp(V, Cu, CONFIG);
      assert.equal(r.ok, true);
      close(r.litres.m1 + r.litres.m2 + r.litres.di, V, `balance V=${V} Cu=${Cu}`);
      close(r.percent.m1 + r.percent.m2 + r.percent.di, 100, "pct sum");
      close(240 * r.litres.m2 / V, Cu, `Cu back-calc V=${V} Cu=${Cu}`);
      for (const x of Object.values(r.litres)) assert.ok(x >= 0);
    }
  }
});

test("Reference table (spec §9)", () => {
  const table = [[10, 4.1667, 45.8333], [20, 8.3333, 41.6667], [25, 10.4167, 39.5833], [30, 12.5, 37.5], [35, 14.5833, 35.4167]];
  for (const [cu, m2, di] of table) {
    const r = calculateMakeUp(100, cu, CONFIG);
    assert.equal(r.percent.m2.toFixed(4), m2.toFixed(4));
    assert.equal(r.percent.di.toFixed(4), di.toFixed(4));
  }
});

test("Mix order and config", () => {
  assert.deepEqual(calculateMakeUp(500, 30, CONFIG).mixOrder, ["DI Water", "AP-3006M1", "AP-3006M2"]);
  assert.equal(CONFIG.cuDefaultMgPerL, 30);
});
