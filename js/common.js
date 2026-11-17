/* Shared numeric helpers (no chemistry). */
(function (root) {
  var FP_TOLERANCE = 1e-9; // floating-point only, not an operational tolerance

  function parseNumber(raw) {
    if (raw === null || raw === undefined) return { empty: true };
    if (typeof raw === "number") return Number.isFinite(raw) ? { value: raw } : { invalid: true };
    var s = String(raw).trim();
    if (s === "") return { empty: true };
    if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s)) return { invalid: true };
    var v = Number(s);
    return Number.isFinite(v) ? { value: v } : { invalid: true };
  }

  function approxEqual(a, b) {
    return Math.abs(a - b) <= FP_TOLERANCE * Math.max(1, Math.abs(a), Math.abs(b));
  }

  var api = { parseNumber: parseNumber, approxEqual: approxEqual, FP_TOLERANCE: FP_TOLERANCE };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.AOPCommon = api;
})(this);
