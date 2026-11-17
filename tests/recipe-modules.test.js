const test = require("node:test");
const assert = require("node:assert/strict");
const CFG = require("../js/chemistry-config.js");
const { calculateRecipe } = require("../js/recipe-calc.js");
const close = (a, b, m) => assert.ok(Math.abs(a - b) < 1e-9, `${m}: ${a} != ${b}`);
const L = (r, name) => r.components.find(c => c.name === name).litres;

test("HCl Pretreatment Make-Up: 500 L → 50 L HCl + 450 L DI", () => {
  const r = calculateRecipe(500, CFG.HCL_PRETREAT_MAKEUP);
  close(L(r, "35% HCl"), 50, "HCl"); close(L(r, "DI Water"), 450, "DI"); close(r.totalL, 500, "tot");
});

test("Acid Rinse Make-Up: 500 L → 50 L HCl + 450 L DI", () => {
  const r = calculateRecipe(500, CFG.ACID_RINSE_MAKEUP);
  close(L(r, "35% HCl"), 50, "HCl"); close(L(r, "DI Water"), 450, "DI");
});

test("CZ-8401 Make-Up: 500 L → 500 L CZ-8401M", () => {
  close(L(calculateRecipe(500, CFG.CZ8401_MAKEUP), "CZ-8401M"), 500, "CZ");
});

test("Replenishment totals for 1000 m²", () => {
  close(calculateRecipe(1000, CFG.HCL_PRETREAT_REPLENISHMENT).totalL, 1600, "HCl PT");
  close(L(calculateRecipe(1000, CFG.CZ8401_REPLENISHMENT), "CZ-8401R"), 160, "CZ-R");
  close(calculateRecipe(1000, CFG.ACID_RINSE_REPLENISHMENT).totalL, 5200, "AR");
});

test("Replenishment without a documented composition returns total only", () => {
  assert.deepEqual(calculateRecipe(10, CFG.HCL_PRETREAT_REPLENISHMENT).components, []);
  assert.deepEqual(calculateRecipe(10, CFG.ACID_RINSE_REPLENISHMENT).components, []);
});

test("Validation for every recipe module", () => {
  for (const k of ["HCL_PRETREAT_MAKEUP","HCL_PRETREAT_REPLENISHMENT","CZ8401_MAKEUP","CZ8401_REPLENISHMENT","ACID_RINSE_MAKEUP","ACID_RINSE_REPLENISHMENT"]) {
    assert.equal(calculateRecipe("", CFG[k]).errors[0].code, "missing", k);
    assert.equal(calculateRecipe("x", CFG[k]).errors[0].code, "non_numeric", k);
    assert.equal(calculateRecipe(0, CFG[k]).errors[0].code, "not_positive", k);
    assert.equal(calculateRecipe(-1, CFG[k]).errors[0].code, "not_positive", k);
    for (const x of [0.1, 7.3, 500, 12345.6]) {
      const r = calculateRecipe(x, CFG[k]);
      if (r.components.length) close(r.components.reduce((a, c) => a + c.litres, 0), r.totalL, `${k} balance`);
    }
  }
});

test("Bad configuration is rejected", () => {
  const bad = { basis: "volume", components: [{ name: "A", percent: 60 }, { name: "B", percent: 30 }] };
  assert.equal(calculateRecipe(100, bad).errors[0].code, "consistency");
  assert.equal(calculateRecipe(100, { basis: "area", dosingLPerM2: 0, components: [] }).errors[0].code, "consistency");
});
