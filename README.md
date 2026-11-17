# AOP Chemistry Calculation App

Open `index.html` in a browser (no install needed). Run tests with `npm test` (Node 18+).

Navigation: select a chemistry (01–05), then an operation (Make-Up / Replenishment / Bath Adjustment).

## Files
- `js/chemistry-config.js`: the only place chemistry constants are set, one section per chemistry and operation.
- `js/common.js`: numeric helpers (number parsing, floating-point comparison). Contains no chemistry.
- `js/ap3006-makeup.js`, `js/ap3006-replenishment.js`, `js/ap3006-bath-adjustment.js`: the AP-3006 calculations, each independent.
- `js/recipe-calc.js`: a generic volume/area × percentage split. Used by HCl Pretreatment, CZ-8401 and Acid Rinse, each with its own config.
- `js/app.js`: the UI and navigation.
- `tests/`: automated tests for every implemented formula and boundary.

## Module status
| Chemistry | Make-Up | Replenishment | Bath Adjustment |
|---|---|---|---|
| 01 HCl Pretreatment | ✅ 90 % DI / 10 % 35% HCl | ✅ Area × 1.6 L/m², total only (MEC reference, not production-confirmed) | — |
| 02 CZ-8401 | ✅ 100 % CZ-8401M | ✅ Area × 0.16 L/m² CZ-8401R (MEC reference, not production-confirmed) | ⏸ Pending: workbook formulas needed |
| 03 Acid Rinse / HCl | ✅ 90 % DI / 10 % 35% HCl | ✅ Area × 5.2 L/m², total only (MEC reference, not production-confirmed) | — |
| 04 AP-3006 | ✅ M1 50 %, M2 = Cu/240, DI balance | ✅ Area × 0.28 L/m²; R 70 / M2 22.5 / DI 7.5 | ✅ M15 prediction |
| 05 Alkaline | ⏸ Stock-concentration conflict | ⏸ Same | ⏸ Same + workbook formulas needed |

## Confirmed decisions
- AP-3006 Make-Up: operator enters the volume and target Cu, the tank is assumed empty, Cu outside 10–35 mg/L is hard-blocked, and the Cu field is pre-filled with 30 mg/L.
- AP-3006 Replenishment: 0.28 L/m² is fixed but configurable. There is no maximum area and no link to bath analysis.
- Full internal precision everywhere. Display: litres 0.1 L, percentages 2 dp.
- No saving, printing, export, approvals or lot recording.

## AP-3006 Bath Adjustment (M15)
Final_Volume = Current + M1 + M2 + R + DI. Final_X = (Current_X × Current_Volume + Σ contribution × addition) / Final_Volume.
Contributions: M1 EE 200 / Acc 200; M2 Cu 240 mg/L; R EE 200 / Acc 165; DI 0.
Optimum ranges: Cu 30 ± 5 mg/L, EE 100 ± 10 %, Acc 100 ± 20 %.
Prediction only: the operator enters the additions; the app does not recommend amounts. Negative additions (draining) are rejected.

## Not defined yet — do not assume
- Tank capacity, fill volume, number of tanks/tools, dosing increment / executable rounding.
- Whether the MEC L/m² values (1.6, 0.16, 5.2) are fixed or tool-specific; processed-area definition; one-side vs two-side area.
- Replenisher composition for HCl Pretreatment and Acid Rinse; physical dosing / premix / mixing order (except the AP-3006 make-up order).
- Mixing order for HCl make-up (not given in the source).
- CZ-8401 and Alkaline bath-adjustment formulas; active Alkaline stock concentrations.
