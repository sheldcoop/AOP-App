# AOP Chemistry Calculation App

## AP-3006 Make-Up module
Open `index.html` in a browser (no install needed). Run tests with `npm test` (Node 18+).

- `js/chemistry-config.js` — the only place chemistry constants are set (M1 50 %, M2 = 240 mg/L Cu, range 10–35 mg/L, default 30 mg/L, display precision, mix order).
- `js/ap3006-makeup.js` — the calculation and validation logic, with no UI code.
- `tests/` — automated acceptance tests (spec §17).

User-approved decisions: HTML app; full internal precision, display volumes 0.1 L and % 2 dp;
Cu outside 10–35 mg/L is hard-blocked; Cu field pre-filled with 30 mg/L.
Not implemented (still unconfirmed): tank capacity/tool selection, residual heel, dosing increment / rounded executable recipe, audit logging, print/export, approvals.
