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
| 04 AP-3006 | ✅ M1 50 %, M2 = Cu/240, DI balance | ✅ Routine Replenishment: area × 0.28 L/m²; R 70 / M2 22.5 / DI 7.5 | ✅ Calculate additions + M15 check |
| 05 Alkaline | ⏸ Stock-concentration conflict | ⏸ Same | ⏸ Same + workbook formulas needed |

## Confirmed decisions
- AP-3006 Make-Up: operator enters the volume and target Cu, the tank is assumed empty, Cu outside 10–35 mg/L is hard-blocked, and the Cu field is pre-filled with 30 mg/L.
- AP-3006 has three independent workflows (enforced by tests):
  - **Make-Up**: new bath, M1 + M2 + DI. No AP-3006R.
  - **Routine Replenishment**: production area, R + M2 + DI. No AP-3006M1, no bath analysis, not M15.
  - **Bath Adjustment**: measured lab results (volume, EE, Accelerator, Cu), M1 / M2 / R / DI as required. No processed area.
- Routine Replenishment: 0.28 L/m² is the MEC reference amount, configurable but not yet confirmed as a fixed or tool-independent plant value. There is no maximum area.
- Full internal precision everywhere. Display: litres 0.1 L, percentages 2 dp.
- No saving, printing, export, approvals or lot recording.

## AP-3006 Bath Adjustment
Two modes, both reproducing the approved workbook:

**Calculate additions** (sheet "AP-3006 Optional adjustment"). The operator enters the current bath and the target Cu [mg/L]; the app returns the additions. Cu reaches the target exactly; Effective Element is brought to 100 % (Cu has priority, so EE and Accelerator land slightly off).
- Cu % scale: 100 % = 30 mg/L, so AP-3006M2 = 800 %. Priority target T = IF((T_EE − EE) < (T_Acc − Acc), T_EE, T_Acc). M1 is always calculated from EE, as the workbook formula does (user-approved).
- a) M1 + M2: M1 = V(T − EE)/(200 − T); M2 = (V + M1)(T_Cu − Cu')/(800 − T_Cu)
- b) DI + M2: DI = V(EE − T)/T; M2 = (V + DI)(T_Cu − Cu')/(800 − T_Cu)
- c) M1 + DI: M1 as in a; DI = (V + M1)(Cu' − T_Cu)/T_Cu   (Cu' = Cu diluted by the first addition)
- Method chosen automatically (user-approved), with the conditions compared relative to the targets: a = all below target; b = EE > Cu; c = Cu > EE and EE below target. The operator can override it. A negative amount means "cannot be adjusted with this method".
- Workbook sample: 274 L, EE 90.8 %, Acc 78.2 %, Cu 27.64 → 30 mg/L gives 25.21 L M1 + 6.68 L M2, 305.9 L, EE 97.82 %, Acc 86.53 %.

**Check additions** (sheet M15). Final_X = (Current_X × V + Σ contribution × addition) / Final_V. Contributions: M1 EE 200 / Acc 200; M2 Cu 240 mg/L; R EE 200 / Acc 165; DI 0.

Status shown in both modes: optimum (Cu 30 ± 5, EE 100 ± 10, Acc 100 ± 20) and control limit (Cu 10–35, EE 85–115, Acc 75–125). Workbook guidance text appears when a value is outside the control limit, and the tank-volume warning is shown.

## Not defined yet — do not assume
- Tank capacity, fill volume, number of tanks/tools, dosing increment / executable rounding.
- Whether the MEC L/m² values (1.6, 0.16, 5.2) are fixed or tool-specific; processed-area definition; one-side vs two-side area.
- Replenisher composition for HCl Pretreatment and Acid Rinse; physical dosing / premix / mixing order (except the AP-3006 make-up order).
- Mixing order for HCl make-up (not given in the source).
- CZ-8401 and Alkaline bath-adjustment formulas; active Alkaline stock concentrations.
