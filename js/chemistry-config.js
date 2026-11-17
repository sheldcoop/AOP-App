/*
 * Authoritative chemistry configuration for the AOP Chemistry Calculation App.
 *
 * All chemistry constants live here. UI and calculation code must read from
 * this object and never hard-code values.
 *
 * Source: AP-3006 Make-Up Module Specification (MEC CZ-8401 + AP-3006 + Alkaline
 * process documentation and the approved AP-3006/CZ-8401/Alkaline workbook).
 */
(function (root) {
  var CHEMISTRY_CONFIG = Object.freeze({
    AP3006_MAKEUP: Object.freeze({
      chemistry: "AP-3006",
      operation: "Fresh Make-Up",
      configVersion: "AP-3006-MU-1.0",
      sourceBasis:
        "MEC CZ-8401 + AP-3006 + Alkaline process documentation; approved AP-3006/CZ-8401/Alkaline calculation workbook",
      // Fixed AP-3006M1 make-up concentration [v/v %]
      m1VolumePercent: 50.0,
      // Cu contribution of 100 % AP-3006M2 [mg/L]
      m2CuEquivalentMgPerL: 240,
      // Documented make-up Cu range [mg/L] (hard interlock, user-approved)
      cuMinMgPerL: 10,
      cuMaxMgPerL: 35,
      // Operational default target Cu [mg/L] (user-approved)
      cuDefaultMgPerL: 30,
      // Display precision (user-approved). Full precision is used internally.
      display: Object.freeze({ volumeDecimals: 1, percentDecimals: 2, cuDecimals: 2 }),
      // Mixing order as specified by the supplier source
      mixOrder: Object.freeze(["DI Water", "AP-3006M1", "AP-3006M2"])
    }),
    AP3006_REPLENISHMENT: Object.freeze({
      chemistry: "AP-3006",
      operation: "Replenishment",
      configVersion: "AP-3006-RP-1.0",
      sourceBasis: "MEC CZ-8401 + AP-3006 + Alkaline process documentation (replenisher mixture)",
      // MEC reference dosing amount [L/m² processed area]. Configurable; NOT yet confirmed
      // as a universal operational constant (may be tool-specific).
      dosingLPerM2: 0.28,
      // Documented replenisher composition [vol %]
      composition: Object.freeze({ rPercent: 70.0, m2Percent: 22.5, diPercent: 7.5 }),
      // Display precision (same as Make-Up)
      display: Object.freeze({ volumeDecimals: 1, percentDecimals: 2 })
      // Intentionally NOT defined: mixing order, premix vs separate dosing,
      // one-side vs two-side area basis, maximum area, Cu/bath-analysis link.
    }),

    /* ---------- 01 HCl Pretreatment ---------- */
    HCL_PRETREAT_MAKEUP: Object.freeze({
      chemistry: "HCl Pretreatment", operation: "Make-Up", configVersion: "HCL-PT-MU-1.0",
      sourceBasis: "MEC CZ-8401 + AP-3006 + Alkaline process guide",
      basis: "volume",
      components: Object.freeze([
        Object.freeze({ name: "DI Water", percent: 90 }),
        Object.freeze({ name: "35% HCl", percent: 10 })
      ]),
      info: Object.freeze(["Documented nominal final acid concentration: approximately 1.2 mol/L."]),
      notDefined: Object.freeze(["Mixing order (not given in the source)."])
    }),
    HCL_PRETREAT_REPLENISHMENT: Object.freeze({
      chemistry: "HCl Pretreatment", operation: "Replenishment", configVersion: "HCL-PT-RP-1.0",
      sourceBasis: "MEC process guide reference dosing (stated reference conditions)",
      basis: "area", dosingLPerM2: 1.6,
      components: Object.freeze([]),
      info: Object.freeze([]),
      notDefined: Object.freeze([
        "Whether 1.6 L/m² (MEC reference) is fixed, configurable or tool-specific — not confirmed for production.",
        "Processed-area definition; one-side vs two-side area.",
        "Replenisher composition and how replenishment is physically dosed."
      ])
    }),

    /* ---------- 02 CZ-8401 ---------- */
    CZ8401_MAKEUP: Object.freeze({
      chemistry: "CZ-8401", operation: "Make-Up", configVersion: "CZ-MU-1.0",
      sourceBasis: "MEC CZ-8401 + AP-3006 + Alkaline process guide",
      basis: "volume",
      components: Object.freeze([Object.freeze({ name: "CZ-8401M", percent: 100 })]),
      info: Object.freeze([]),
      notDefined: Object.freeze([])
    }),
    CZ8401_REPLENISHMENT: Object.freeze({
      chemistry: "CZ-8401", operation: "Replenishment", configVersion: "CZ-RP-1.0",
      sourceBasis: "MEC process guide reference dosing",
      basis: "area", dosingLPerM2: 0.16,
      components: Object.freeze([Object.freeze({ name: "CZ-8401R", percent: 100 })]),
      info: Object.freeze([]),
      notDefined: Object.freeze([
        "Whether 0.16 L/m² (MEC reference) is fixed, configurable or tool/process-specific — not confirmed for production.",
        "Processed-area definition; one-side vs two-side area."
      ])
    }),

    /* ---------- 03 Acid Rinse / HCl ---------- */
    ACID_RINSE_MAKEUP: Object.freeze({
      chemistry: "Acid Rinse / HCl", operation: "Make-Up", configVersion: "AR-MU-1.0",
      sourceBasis: "MEC CZ-8401 + AP-3006 + Alkaline process guide",
      basis: "volume",
      components: Object.freeze([
        Object.freeze({ name: "DI Water", percent: 90 }),
        Object.freeze({ name: "35% HCl", percent: 10 })
      ]),
      info: Object.freeze(["Documented nominal concentration: approximately 1.2 mol/L."]),
      notDefined: Object.freeze(["Mixing order (not given in the source)."])
    }),
    ACID_RINSE_REPLENISHMENT: Object.freeze({
      chemistry: "Acid Rinse / HCl", operation: "Replenishment", configVersion: "AR-RP-1.0",
      sourceBasis: "MEC process guide reference dosing (two-step treatment reference conditions)",
      basis: "area", dosingLPerM2: 5.2,
      components: Object.freeze([]),
      info: Object.freeze([]),
      notDefined: Object.freeze([
        "Whether 5.2 L/m² (MEC reference, two-step treatment) is fixed, configurable or tool-specific — not confirmed for production.",
        "Processed-area definition; one-side vs two-side area.",
        "Replenisher composition and how replenishment is physically dosed."
      ])
    }),

    /* ---------- 04 AP-3006 Bath Adjustment / M15 ---------- */
    AP3006_BATH_ADJUSTMENT: Object.freeze({
      chemistry: "AP-3006", operation: "Bath Adjustment (M15)", configVersion: "AP-3006-M15-1.0",
      sourceBasis: "Approved AP-3006/CZ-8401/Alkaline calculation workbook, sheet M15",
      // Contribution of each added material (EE and Accelerator in %, Cu in mg/L)
      materials: Object.freeze([
        Object.freeze({ key: "m1", name: "AP-3006M1", ee: 200, acc: 200, cu: 0 }),
        Object.freeze({ key: "m2", name: "AP-3006M2", ee: 0, acc: 0, cu: 240 }),
        Object.freeze({ key: "r",  name: "AP-3006R",  ee: 200, acc: 165, cu: 0 }),
        Object.freeze({ key: "di", name: "DI Water",  ee: 0, acc: 0, cu: 0 })
      ]),
      optimum: Object.freeze({
        ee:  Object.freeze({ target: 100, tol: 10, unit: "%" }),
        acc: Object.freeze({ target: 100, tol: 20, unit: "%" }),
        cu:  Object.freeze({ target: 30,  tol: 5,  unit: "mg/L" })
      }),
      // Control limits from the workbook M15 sheet
      control: Object.freeze({
        ee:  Object.freeze({ min: 85, max: 115, unit: "%" }),
        acc: Object.freeze({ min: 75, max: 125, unit: "%" }),
        cu:  Object.freeze({ min: 10, max: 35,  unit: "mg/L" })
      }),
      // Workbook guidance text shown when a value is outside the control limit
      guidance: Object.freeze({
        cu:  Object.freeze({ low: "Film formation performance goes down. Add AP-3006M2 to return to the center value or replace the whole working solution with fresh make-up solution.",
                             high: "Film formation performance goes up. Replace half or the whole working solution with fresh make-up solution." }),
        ee:  Object.freeze({ low: "Film formation performance goes up. Add AP-3006M1 to return to the center value or replace the whole working solution with fresh make-up solution.",
                             high: "Film formation performance goes down. Replace half or the whole working solution with fresh make-up solution." }),
        acc: Object.freeze({ low: "Film formation performance goes down. Add AP-3006M1 to return to the center value or replace the whole working solution with fresh make-up solution.",
                             high: "Film formation performance goes up. Replace half or the whole working solution with fresh make-up solution." })
      }),
      tankWarning: "If the working solution volume after adjustment exceeds the tank volume, reduce the working solution volume before adjustment and recalculate.",
      // "Calculate additions" mode — workbook sheet "AP-3006 Optional adjustment"
      optional: Object.freeze({
        cu100PctMgPerL: 30,          // Cu conc. 100 % = 30 mg/L
        targetEEPct: 100,            // workbook default targets
        targetAccPct: 100,
        defaultTargetCuMgPerL: 30
      }),
      display: Object.freeze({ volumeDecimals: 1, valueDecimals: 2 })
    })
  });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = CHEMISTRY_CONFIG;
  } else {
    root.CHEMISTRY_CONFIG = CHEMISTRY_CONFIG;
  }
})(this);
