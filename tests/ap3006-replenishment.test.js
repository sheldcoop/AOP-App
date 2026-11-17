const test = require("node:test");
const assert = require("node:assert/strict");
const ALL = require("../js/chemistry-config.js");
const CONFIG = ALL.AP3006_REPLENISHMENT;
const { calculateReplenishment } = require("../js/ap3006-replenishment.js");
const close = (a, b, m) => assert.ok(Math.abs(a - b) < 1e-9, `${m}: ${a} != ${b}`);

test("1000 m² example", () => {
  const r = calculateReplenishment(1000, CONFIG);
  assert.equal(r.ok, true);
  close(r.totalL, 280, "total");
  close(r.litres.r, 196, "R");
  close(r.litres.m2, 63, "M2");
  close(r.litres.di, 21, "DI");
});

test("config values", () => {
  assert.equal(CONFIG.dosingLPerM2, 0.28);
  assert.deepEqual({ ...CONFIG.composition }, { rPercent: 70, m2Percent: 22.5, diPercent: 7.5 });
});

test("dosing amount is configurable", () => {
  const r = calculateReplenishment(100, { ...CONFIG, dosingLPerM2: 0.3 });
  close(r.totalL, 30, "total");
});

test("invalid inputs blocked", () => {
  assert.equal(calculateReplenishment("", CONFIG).errors[0].code, "missing");
  assert.equal(calculateReplenishment("abc", CONFIG).errors[0].code, "non_numeric");
  assert.equal(calculateReplenishment(0, CONFIG).errors[0].code, "not_positive");
  assert.equal(calculateReplenishment(-1, CONFIG).errors[0].code, "not_positive");
});

test("no maximum area limit", () => {
  assert.equal(calculateReplenishment(1e7, CONFIG).ok, true);
});

test("balance for many areas", () => {
  for (const A of [0.01, 1, 12.5, 999.9, 1000, 123456.78]) {
    const r = calculateReplenishment(A, CONFIG);
    close(r.totalL, A * 0.28, "total");
    close(r.litres.r + r.litres.m2 + r.litres.di, r.totalL, "balance");
  }
});

test("independent from Make-Up config", () => {
  assert.notStrictEqual(CONFIG, ALL.AP3006_MAKEUP);
  assert.equal(CONFIG.mixOrder, undefined);
});
