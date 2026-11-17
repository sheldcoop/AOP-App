# AOP Chemistry Calculation App

## AP-3006 Make-Up module
Open `index.html` in a browser (no install needed). Run tests with `npm test` (Node 18+).

- `js/chemistry-config.js` — the only place chemistry constants are set (M1 50 %, M2 = 240 mg/L Cu, range 10–35 mg/L, default 30 mg/L, display precision, mix order).
- `js/ap3006-makeup.js` — the calculation and validation logic, with no UI code.
- `tests/` — automated acceptance tests (spec §17).

## Confirmed scope for version 1
- The operator manually enters the final working-bath volume [L] and target Cu [mg/L].
- The tank is assumed empty at make-up; leftover or residual solution is not considered.
- Calculation uses full precision. Display: volumes 0.1 L, percentages 2 dp. Chemical quantities are never rounded for dosing.
- Cu outside 10–35 mg/L is hard-blocked. The Cu field is pre-filled with 30 mg/L.
- Saving, printing, export, supervisor approval and M1/M2 lot numbers are not part of the calculation and are not implemented.

## Not defined yet — do not assume
- Tank capacity, standard fill volume, number of AP-3006 tanks/tools.
- Minimum practical dosing increment. Once it is confirmed, add a rounded executable recipe beside the
  theoretical one, with predicted Cu recalculated from the rounded (actually dosed) volumes.
