// AP-3006 Make-Up and Bath Adjustment must stay independent.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const CFG = require("../js/chemistry-config.js");
const { calculateMakeUp } = require("../js/ap3006-makeup.js");
const src = f => fs.readFileSync(path.join(__dirname, "..", "js", f), "utf8");

test("Make-Up uses M1 + M2 + DI only (no AP-3006R)", () => {
  assert.deepEqual(Object.keys(calculateMakeUp(500, 30, CFG.AP3006_MAKEUP).litres).sort(), ["di", "m1", "m2"]);
});

test("Modules do not depend on each other", () => {
  assert.equal(src("ap3006-makeup.js").includes("bath-adjustment"), false);
  assert.equal(src("ap3006-bath-adjustment.js").includes("ap3006-makeup"), false);
});

test("Bath Adjustment uses measured analysis, not processed area", () => {
  const { FIELDS } = require("../js/ap3006-bath-adjustment.js");
  assert.deepEqual(FIELDS.map(f => f.key), ["currentVolume", "ee", "acc", "cu"]);
  assert.equal(src("ap3006-bath-adjustment.js").includes("area"), false);
});

test("Routine Replenishment removed", () => {
  assert.equal(CFG.AP3006_REPLENISHMENT, undefined);
});
