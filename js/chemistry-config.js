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

    /* ---------- 04 AP-3006 Bath Adjustment ---------- */
    AP3006_BATH_ADJUSTMENT: Object.freeze({
      chemistry: "AP-3006", operation: "Bath Adjustment", configVersion: "AP-3006-BA-2.0",
      sourceBasis: "Approved AP-3006/CZ-8401/Alkaline calculation workbook, sheet M15 (contribution constants, ranges, guidance); MEC process guide (make-up and replenisher recipes)",
      // Workbook M15 contribution of each single chemical at 100 % (EE and Accelerator in %, Cu in mg/L)
      chemicals: Object.freeze({
        m1: Object.freeze({ name: "AP-3006M1", ee: 200, acc: 200, cu: 0 }),
        m2: Object.freeze({ name: "AP-3006M2", ee: 0, acc: 0, cu: 240 }),
        r:  Object.freeze({ name: "AP-3006R",  ee: 200, acc: 165, cu: 0 }),
        di: Object.freeze({ name: "DI Water",  ee: 0, acc: 0, cu: 0 })
      }),
      // Solutions actually available at the machine (user-confirmed). AP-3006M1 is not
      // available on its own. Composition in v/v % of each chemical.
      solutions: Object.freeze([
        Object.freeze({ key: "di", name: "DI Water", composition: Object.freeze({ di: 100 }) }),
        // Lab premix made with the Make-Up recipe: M1 50 %, M2 = premix Cu / 240 × 100, DI balance.
        // Its Cu is entered by the operator.
        Object.freeze({ key: "mu", name: "Make-up premix", premix: true, m1Percent: 50 }),
        // MEC replenisher mixture
        Object.freeze({ key: "rp", name: "Replenisher mix",
                        composition: Object.freeze({ r: 70, m2: 22.5, di: 7.5 }) })
      ]),
      // The premix is made with the Make-Up recipe, whose documented Cu range is 10–35 mg/L
      premixCuMinMgPerL: 10,
      premixCuMaxMgPerL: 35,
      defaultTargetCuMgPerL: 30,
      optimum: Object.freeze({
        ee:  Object.freeze({ target: 100, tol: 10, unit: "%" }),
        acc: Object.freeze({ target: 100, tol: 20, unit: "%" }),
        cu:  Object.freeze({ target: 30,  tol: 5,  unit: "mg/L" })
      }),
      control: Object.freeze({
        ee:  Object.freeze({ min: 85, max: 115, unit: "%" }),
        acc: Object.freeze({ min: 75, max: 125, unit: "%" }),
        cu:  Object.freeze({ min: 10, max: 35,  unit: "mg/L" })
      }),
      guidance: Object.freeze({
        cu:  Object.freeze({ low: "Film formation performance goes down. Add AP-3006M2 to return to the center value or replace the whole working solution with fresh make-up solution.",
                             high: "Film formation performance goes up. Replace half or the whole working solution with fresh make-up solution." }),
        ee:  Object.freeze({ low: "Film formation performance goes up. Add AP-3006M1 to return to the center value or replace the whole working solution with fresh make-up solution.",
                             high: "Film formation performance goes down. Replace half or the whole working solution with fresh make-up solution." }),
        acc: Object.freeze({ low: "Film formation performance goes down. Add AP-3006M1 to return to the center value or replace the whole working solution with fresh make-up solution.",
                             high: "Film formation performance goes up. Replace half or the whole working solution with fresh make-up solution." })
      }),
      tankWarning: "If the working solution volume after adjustment exceeds the tank volume, reduce the working solution volume before adjustment and recalculate.",
      display: Object.freeze({ volumeDecimals: 1, valueDecimals: 2 })
    })
  });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = CHEMISTRY_CONFIG;
  } else {
    root.CHEMISTRY_CONFIG = CHEMISTRY_CONFIG;
  }
})(this);
