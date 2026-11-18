# AOP Chemistry Calculation App

Open `index.html` in a browser (no install needed). Run tests with `npm test` (Node 18+).

Navigation: select a chemistry (01–05), then an operation (Make-Up / Replenishment / Bath Adjustment).

## Files
- `js/chemistry-config.js`: the only place chemistry constants are set, one section per chemistry and operation.
- `js/common.js`: numeric helpers (number parsing, floating-point comparison). Contains no chemistry.
- `js/ap3006-makeup.js`, `js/ap3006-bath-adjustment.js`: the AP-3006 calculations, independent of each other.
- `js/recipe-calc.js`: a generic volume/area × percentage split. Used by HCl Pretreatment, CZ-8401 and Acid Rinse, each with its own config.
- `js/app.js`: the UI and navigation.
- `tests/`: automated tests for every implemented formula and boundary.

## Module status
| Chemistry | Make-Up | Replenishment | Bath Adjustment |
|---|---|---|---|
| 01 HCl Pretreatment | ✅ 90 % DI / 10 % 35% HCl | ✅ Area × 1.6 L/m², total only (MEC reference, not production-confirmed) | — |
| 02 CZ-8401 | ✅ 100 % CZ-8401M | ✅ Area × 0.16 L/m² CZ-8401R (MEC reference, not production-confirmed) | ⏸ Pending: workbook formulas needed |
| 03 Acid Rinse / HCl | ✅ 90 % DI / 10 % 35% HCl | ✅ Area × 5.2 L/m², total only (MEC reference, not production-confirmed) | — |
| 04 AP-3006 | ✅ M1 50 %, M2 = Cu/240, DI balance | Removed (not needed) | ✅ Target Cu → DI / premix / replenisher mix; check additions |
| 05 Alkaline | ⏸ Stock-concentration conflict | ⏸ Same | ⏸ Same + workbook formulas needed |

## Confirmed decisions
- AP-3006 Make-Up: operator enters the volume and target Cu, the tank is assumed empty, Cu outside 10–35 mg/L is hard-blocked, and the Cu field is pre-filled with 30 mg/L.
- AP-3006 has two independent workflows (enforced by tests): **Make-Up** (new bath, M1 + M2 + DI) and **Bath Adjustment** (measured lab results). Routine Replenishment was removed at the user's request.
- Full internal precision everywhere. Display: litres 0.1 L, percentages 2 dp.
- No saving, printing, export, approvals or lot recording.

## AP-3006 Bath Adjustment (Tank 1 + Tank 2 + DI Water)
The operator enters the Cu in Tank 1 and Tank 2, the final volume, the target Cu and the litres to take from Tank 2.
The app returns litres from Tank 1, litres from Tank 2 and litres of DI Water:

- Tank 1 = (Target Cu × Final volume − Tank 2 Cu × Tank 2 L) ÷ Tank 1 Cu
- DI = Final volume − Tank 1 − Tank 2
- The allowed Tank 2 range (Tank 1 ≥ 0 and DI ≥ 0) is shown under the input.

Example (user's): Tank 1 30 mg/L, Tank 2 54 mg/L, 100 L at 18 mg/L, 10 L from Tank 2 → 42 L Tank 1 + 10 L Tank 2 + 48 L DI.

Earlier versions (M15 prediction, three-tank solver) remain in `js/ap3006-bath-adjustment.js` with tests but are not shown on screen.

## Not defined yet — do not assume
- Tank capacity, fill volume, number of tanks/tools, dosing increment / executable rounding.
- Whether the MEC L/m² values (1.6, 0.16, 5.2) are fixed or tool-specific; processed-area definition; one-side vs two-side area.
- Replenisher composition for HCl Pretreatment and Acid Rinse; physical dosing / mixing order (except the AP-3006 make-up order).
- Mixing order for HCl make-up (not given in the source).
- CZ-8401 and Alkaline bath-adjustment formulas; active Alkaline stock concentrations.
