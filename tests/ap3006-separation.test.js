// AP-3006 Make-Up, Routine Replenishment and Bath Adjustment must stay independent.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const CFG = require("../js/chemistry-config.js");
const { calculateMakeUp } = require("../js/ap3006-makeup.js");
const { calculateReplenishment } = require("../js/ap3006-replenishment.js");

const src = f => fs.readFileSync(path.join(__dirname, "..", "js", f), "utf8");

test("Make-Up uses M1 + M2 + DI only (no AP-3006R)", () => {
  const r = calculateMakeUp(500, 30, CFG.AP3006_MAKEUP);
  assert.deepEqual(Object.keys(r.litres).sort(), ["di", "m1", "m2"]);
});

test("Routine Replenishment uses R + M2 + DI only (no AP-3006M1)", () => {
  const r = calculateReplenishment(1000, CFG.AP3006_REPLENISHMENT);
  assert.deepEqual(Object.keys(r.litres).sort(), ["di", "m2", "r"]);
  assert.equal(JSON.stringify(CFG.AP3006_REPLENISHMENT).includes("M1"), false);
});

test("Calculation modules do not depend on each other", () => {
  for (const [file, others] of [
    ["ap3006-makeup.js", ["ap3006-replenishment", "ap3006-bath-adjustment"]],
    ["ap3006-replenishment.js", ["ap3006-makeup", "ap3006-bath-adjustment"]],
    ["ap3006-bath-adjustment.js", ["ap3006-makeup", "ap3006-replenishment"]]
  ]) {
    const s = src(file);
    for (const o of others) assert.equal(s.includes(o), false, `${file} references ${o}`);
  }
});

test("Bath Adjustment takes measured analysis, not processed area", () => {
  const { FIELDS } = require("../js/ap3006-bath-adjustment.js");
  assert.deepEqual(FIELDS.map(f => f.key), ["currentVolume", "ee", "acc", "cu"]);
  assert.equal(src("ap3006-bath-adjustment.js").includes("area"), false);
});
