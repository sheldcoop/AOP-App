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

## AP-3006 Bath Adjustment
Starts from the measured bath: volume [L], Effective Element [%], Accelerator [%], Cu [mg/L].
Only solutions available at the machine are used (user-confirmed); AP-3006M1 is not available on its own:

| Solution | Composition | EE | Acc | Cu |
|---|---|---:|---:|---:|
| DI Water | 100 % DI | 0 | 0 | 0 |
| Fresh make-up premix (lab) | M1 50 %, M2 = premix Cu/240 × 100, DI balance | 100 % | 100 % | premix Cu (operator enters, 10–35 mg/L) |
| Replenisher mix | R 70 %, M2 22.5 %, DI 7.5 % | 140 % | 115.5 % | 54 mg/L |

Contributions are derived from the workbook M15 single-chemical constants (M1 EE 200 / Acc 200; M2 Cu 240 mg/L; R EE 200 / Acc 165).

- **Target Cu → how much to add:** for each solution used on its own, amount = V × (Target − Cu) / (Cu_solution − Target), plus the predicted EE, Accelerator and Cu. A solution that cannot move Cu towards the target is shown as not possible. Example: 500 L at 40 → 30 mg/L needs 166.7 L DI (EE drops to 75 %) or 250 L of a 10 mg/L premix (EE stays 100 %).
- **Check my additions:** the M15 concentration balance applied to the entered amounts of the three solutions.
- Statuses use the workbook optimum ranges (Cu 30 ± 5, EE 100 ± 10, Acc 100 ± 20) and control limits (Cu 10–35, EE 85–115, Acc 75–125). Workbook guidance text and the tank-volume warning are shown.

## Not defined yet — do not assume
- Tank capacity, fill volume, number of tanks/tools, dosing increment / executable rounding.
- Whether the MEC L/m² values (1.6, 0.16, 5.2) are fixed or tool-specific; processed-area definition; one-side vs two-side area.
- Replenisher composition for HCl Pretreatment and Acid Rinse; physical dosing / mixing order (except the AP-3006 make-up order).
- Mixing order for HCl make-up (not given in the source).
- CZ-8401 and Alkaline bath-adjustment formulas; active Alkaline stock concentrations.
