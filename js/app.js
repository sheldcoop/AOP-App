/* AOP Chemistry Calculation — UI. Calculation logic lives in the separate module files. */
// AP-3006 Make-Up UI
(function () {
  var CFG = window.CHEMISTRY_CONFIG.AP3006_MAKEUP;
  var D = CFG.display;
  var $ = function (id) { return document.getElementById(id); };
  var fmt = function (x, d) { return x.toFixed(d); };

  $("cu").value = String(CFG.cuDefaultMgPerL);
  $("cuHint").textContent = "Documented make-up range: " + CFG.cuMinMgPerL + "–" + CFG.cuMaxMgPerL + " mg/L";
  CFG.mixOrder.forEach(function (name) {
    var li = document.createElement("li"); li.textContent = name; $("mixOrder").appendChild(li);
  });

  function render() {
    var r = window.AP3006MakeUp.calculateMakeUp($("volume").value, $("cu").value, CFG);
    $("volume").removeAttribute("aria-invalid");
    $("cu").removeAttribute("aria-invalid");

    if (!r.ok) {
      $("results").hidden = true;
      var list = $("errorList"); list.innerHTML = "";
      r.errors.forEach(function (e) {
        var li = document.createElement("li"); li.textContent = e.message; list.appendChild(li);
        if (e.field === "volume" || e.field === "cu") $(e.field).setAttribute("aria-invalid", "true");
      });
      $("errors").hidden = false;
      return;
    }

    $("errors").hidden = true;
    $("results").hidden = false;
    $("m1Pct").textContent = fmt(r.percent.m1, D.percentDecimals) + " %";
    $("m2Pct").textContent = fmt(r.percent.m2, D.percentDecimals) + " %";
    $("diPct").textContent = fmt(r.percent.di, D.percentDecimals) + " %";
    $("totPct").textContent = fmt(r.percent.m1 + r.percent.m2 + r.percent.di, D.percentDecimals) + " %";
    $("m1L").textContent = fmt(r.litres.m1, D.volumeDecimals);
    $("m2L").textContent = fmt(r.litres.m2, D.volumeDecimals);
    $("diL").textContent = fmt(r.litres.di, D.volumeDecimals);
    $("totL").textContent = fmt(r.totalL, D.volumeDecimals);
    $("targetCu").textContent = fmt(r.inputs.targetCuMgPerL, D.cuDecimals) + " mg/L";
    $("predCu").textContent = fmt(r.predictedCuMgPerL, D.cuDecimals) + " mg/L";

    var V = r.inputs.finalVolumeL, Cu = r.inputs.targetCuMgPerL, K = CFG.m2CuEquivalentMgPerL, M1 = CFG.m1VolumePercent;
    $("calcDetails").textContent = [
      "Constants (" + r.configVersion + "): M1 = " + M1 + " v/v %, AP-3006M2 Cu equivalent = " + K + " mg/L",
      "",
      "M2 %  = Target Cu / " + K + " × 100     = " + Cu + " / " + K + " × 100 = " + r.percent.m2.toFixed(6),
      "DI %  = 100 − " + M1 + " − M2 %          = " + r.percent.di.toFixed(6),
      "M1 L  = Final Volume × " + M1 + " / 100  = " + V + " × " + M1 + " / 100 = " + r.litres.m1.toFixed(6),
      "M2 L  = Final Volume × M2 % / 100 = " + r.litres.m2.toFixed(6),
      "DI L  = Final Volume × DI % / 100 = " + r.litres.di.toFixed(6),
      "",
      "Balance:      M1 + M2 + DI = " + r.totalL.toFixed(6) + " L (requested " + V + " L)",
      "Predicted Cu: " + K + " × M2 L / V = " + r.predictedCuMgPerL.toFixed(6) + " mg/L"
    ].join("\n");
  }

  $("volume").addEventListener("input", render);
  $("cu").addEventListener("input", render);
  render();
})();

// Replenishment UI (independent calculation module)
(function () {
  var CFG = window.CHEMISTRY_CONFIG.AP3006_REPLENISHMENT;
  var D = CFG.display;
  var $ = function (id) { return document.getElementById(id); };
  $("dosingHint").textContent = "Dosing basis: " + CFG.dosingLPerM2 + " L/m² (MEC reference dosing amount)";

  function render() {
    var r = window.AP3006Replenishment.calculateReplenishment($("area").value, CFG);
    $("area").removeAttribute("aria-invalid");
    if (!r.ok) {
      $("rResults").hidden = true;
      var list = $("rErrorList"); list.innerHTML = "";
      r.errors.forEach(function (e) {
        var li = document.createElement("li"); li.textContent = e.message; list.appendChild(li);
        if (e.field === "area") $("area").setAttribute("aria-invalid", "true");
      });
      $("rErrors").hidden = false;
      return;
    }
    $("rErrors").hidden = true;
    $("rResults").hidden = false;
    var p = D.percentDecimals, v = D.volumeDecimals;
    $("rRPct").textContent = r.percent.r.toFixed(p) + " %";
    $("rM2Pct").textContent = r.percent.m2.toFixed(p) + " %";
    $("rDiPct").textContent = r.percent.di.toFixed(p) + " %";
    $("rTotPct").textContent = (r.percent.r + r.percent.m2 + r.percent.di).toFixed(p) + " %";
    $("rRL").textContent = r.litres.r.toFixed(v);
    $("rM2L").textContent = r.litres.m2.toFixed(v);
    $("rDiL").textContent = r.litres.di.toFixed(v);
    $("rTotL").textContent = r.totalL.toFixed(v);
    var A = r.inputs.processedAreaM2, k = r.dosingLPerM2;
    $("rCalcDetails").textContent = [
      "Constants (" + r.configVersion + "): dosing = " + k + " L/m²; AP-3006R " + r.percent.r + " %, AP-3006M2 " + r.percent.m2 + " %, DI " + r.percent.di + " %",
      "",
      "Total L     = Processed Area × " + k + " = " + A + " × " + k + " = " + r.totalL.toFixed(6),
      "AP-3006R L  = Total × " + r.percent.r + " / 100 = " + r.litres.r.toFixed(6),
      "AP-3006M2 L = Total × " + r.percent.m2 + " / 100 = " + r.litres.m2.toFixed(6),
      "DI Water L  = Total × " + r.percent.di + " / 100 = " + r.litres.di.toFixed(6),
      "",
      "Balance: R + M2 + DI = " + (r.litres.r + r.litres.m2 + r.litres.di).toFixed(6) + " L"
    ].join("\n");
  }
  $("area").addEventListener("input", render);
  render();
})();

// AP-3006 Bath Adjustment (M15) UI
(function () {
  var CFG = window.CHEMISTRY_CONFIG.AP3006_BATH_ADJUSTMENT;
  var D = CFG.display;
  var $ = function (id) { return document.getElementById(id); };
  var box = $("ba-additions");
  CFG.materials.forEach(function (m) {
    var l = document.createElement("label"); l.htmlFor = "ba-add-" + m.key; l.textContent = m.name + " [L]";
    var i = document.createElement("input"); i.id = "ba-add-" + m.key; i.inputMode = "decimal"; i.autocomplete = "off"; i.value = "0";
    box.appendChild(l); box.appendChild(i);
  });
  var curIds = ["currentVolume", "ee", "acc", "cu"];
  var allIds = curIds.map(function (k) { return "ba-" + k; })
    .concat(CFG.materials.map(function (m) { return "ba-add-" + m.key; }));

  function idFor(field) { return curIds.indexOf(field) >= 0 ? "ba-" + field : "ba-add-" + field; }
  function f(x) { return x.toFixed(D.valueDecimals); }
  function sgn(x, d) { return (x >= 0 ? "+" : "") + x.toFixed(d); }

  function render() {
    var inputs = { additions: {} };
    curIds.forEach(function (k) { inputs[k] = $("ba-" + k).value; });
    CFG.materials.forEach(function (m) { inputs.additions[m.key] = $("ba-add-" + m.key).value; });
    allIds.forEach(function (id) { $(id).removeAttribute("aria-invalid"); });
    var r = window.AP3006BathAdjustment.calculateBathAdjustment(inputs, CFG);
    if (!r.ok) {
      $("baResults").hidden = true;
      var list = $("baErrorList"); list.innerHTML = "";
      r.errors.forEach(function (e) {
        var li = document.createElement("li"); li.textContent = e.message; list.appendChild(li);
        var el = $(idFor(e.field)); if (el) el.setAttribute("aria-invalid", "true");
      });
      $("baErrors").hidden = false;
      return;
    }
    $("baErrors").hidden = true; $("baResults").hidden = false;
    var rows = [["Volume [L]", r.volume.before.toFixed(D.volumeDecimals), sgn(r.volume.added, D.volumeDecimals), r.volume.after.toFixed(D.volumeDecimals), "—", ""]];
    [["ee", "Effective Element [%]"], ["acc", "Accelerator [%]"], ["cu", "Cu [mg/L]"]].forEach(function (p) {
      var x = r.params[p[0]], o = x.optimum;
      rows.push([p[1], f(x.before), sgn(x.change, D.valueDecimals), f(x.after),
        o.target + " ± " + o.tol + " (" + o.min + "–" + o.max + ")",
        x.withinOptimum ? '<span class="status-ok">Within optimum</span>' : '<span class="status-out">Outside optimum</span>']);
    });
    $("baTable").innerHTML = rows.map(function (row, i) {
      return "<tr>" + row.map(function (c, j) {
        return j === 0 ? "<td>" + c + "</td>" : j === 5 ? "<td>" + c + "</td>" : '<td class="num">' + c + "</td>";
      }).join("") + "</tr>";
    }).join("");

    var lines = ["Constants (" + r.configVersion + "):"];
    CFG.materials.forEach(function (m) {
      lines.push("  " + m.name + ": EE " + m.ee + " %, Accelerator " + m.acc + " %, Cu " + m.cu + " mg/L");
    });
    var V0 = r.volume.before, V1 = r.volume.after;
    lines.push("", "Final Volume = " + V0 + " + " + CFG.materials.map(function (m) { return r.additions[m.key]; }).join(" + ") + " = " + V1.toFixed(6) + " L");
    [["ee", "EE"], ["acc", "Accelerator"], ["cu", "Cu"]].forEach(function (p) {
      var terms = CFG.materials.filter(function (m) { return m[p[0]] !== 0; })
        .map(function (m) { return m[p[0]] + " × " + r.additions[m.key]; });
      lines.push("Final " + p[1] + " = (" + r.params[p[0]].before + " × " + V0 + (terms.length ? " + " + terms.join(" + ") : "") + ") / " + V1.toFixed(6) + " = " + r.params[p[0]].after.toFixed(6));
    });
    $("baCalcDetails").textContent = lines.join("\n");
  }
  allIds.forEach(function (id) { $(id).addEventListener("input", render); });
  render();
})();

// Generic Make-Up / Replenishment panels (HCl Pretreatment, CZ-8401, Acid Rinse)
function buildRecipePanel(id, cfg) {
  var D = { volumeDecimals: 1, percentDecimals: 2 };
  var el = function (tag, attrs, html) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (html !== undefined) e.innerHTML = html;
    return e;
  };
  var esc = function (s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); };
  var panel = el("div", { id: id, role: "tabpanel", hidden: "" });
  var label = window.AOPRecipe.inputLabel(cfg);
  var isArea = cfg.basis === "area";
  var html = '<h2 style="font-size:1.3rem;margin:0 0 4px">' + esc(cfg.chemistry + " " + cfg.operation) + "</h2>" +
    '<p class="sub">' + (isArea ? "Quantity from processed area." : "Fresh bath preparation from final bath volume.") + "</p>" +
    '<section><h2>A. Required input</h2><label for="' + id + '-in">' + esc(label) + "</label>" +
    '<input id="' + id + '-in" inputmode="decimal" autocomplete="off">' +
    (isArea ? '<div class="hint">Dosing basis: ' + cfg.dosingLPerM2 + " L/m² (MEC reference dosing amount)</div>" : "") +
    cfg.info.map(function (t) { return '<div class="hint">' + esc(t) + "</div>"; }).join("") +
    '<div class="errors" id="' + id + '-err" role="alert" hidden><ul></ul></div></section>' +
    '<div id="' + id + '-res" hidden><section><h2>B. Calculated result</h2><table>' +
    '<thead><tr><th>Component</th><th class="num">v/v %</th><th class="num">Required volume [L]</th></tr></thead>' +
    '<tbody id="' + id + '-tb"></tbody></table>' +
    '<p class="muted">Displayed values are rounded for display only; calculations use full precision.' +
    (isArea ? "" : " Basis: tank starts empty.") + "</p></section>" +
    (cfg.notDefined.length ? '<section><h2>C. Not yet defined</h2><div class="note">The source does not define the following, so the app gives no instruction for them:<ul style="margin:6px 0 0;padding-left:18px">' +
      cfg.notDefined.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul></div></section>" : "") +
    '<section><h2>' + (cfg.notDefined.length ? "D" : "C") + '. Calculation details</h2><details><summary>Show calculation</summary><pre id="' + id + '-calc"></pre></details></section></div>';
  panel.innerHTML = html;
  document.getElementById("generatedPanels").appendChild(panel);

  var $ = function (s) { return document.getElementById(id + "-" + s); };
  function render() {
    var r = window.AOPRecipe.calculateRecipe($("in").value, cfg);
    $("in").removeAttribute("aria-invalid");
    if (!r.ok) {
      $("res").hidden = true;
      $("err").querySelector("ul").innerHTML = r.errors.map(function (e) { return "<li>" + esc(e.message) + "</li>"; }).join("");
      $("err").hidden = false;
      if (r.errors[0].field === "input") $("in").setAttribute("aria-invalid", "true");
      return;
    }
    $("err").hidden = true; $("res").hidden = false;
    var rows = r.components.map(function (c) {
      return "<tr><td>" + esc(c.name) + '</td><td class="num">' + c.percent.toFixed(D.percentDecimals) + ' %</td><td class="num">' + c.litres.toFixed(D.volumeDecimals) + "</td></tr>";
    });
    var totName = isArea ? "Total replenishment" : "Total";
    rows.push('<tr class="total"><td>' + totName + (r.components.length ? "" : " (composition not specified)") + '</td><td class="num">' +
      (r.components.length ? "100.00 %" : "—") + '</td><td class="num">' + r.totalL.toFixed(D.volumeDecimals) + "</td></tr>");
    $("tb").innerHTML = rows.join("");
    var lines = ["Constants (" + r.configVersion + "): " +
      (isArea ? "dosing = " + r.dosingLPerM2 + " L/m²" + (r.components.length ? "; " : "") : "") +
      r.components.map(function (c) { return c.name + " " + c.percent + " %"; }).join(", "), ""];
    lines.push(isArea ? "Total L = Processed Area × " + r.dosingLPerM2 + " = " + r.input + " × " + r.dosingLPerM2 + " = " + r.totalL.toFixed(6)
                      : "Total L = Final Bath Volume = " + r.totalL.toFixed(6));
    r.components.forEach(function (c) {
      lines.push(c.name + " L = Total × " + c.percent + " / 100 = " + c.litres.toFixed(6));
    });
    $("calc").textContent = lines.join("\n");
  }
  $("in").addEventListener("input", render);
  render();
  return id;
}

function buildPendingPanel(id, title, reason, needed, known) {
  var esc = function (s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); };
  var p = document.createElement("div");
  p.id = id; p.setAttribute("role", "tabpanel"); p.hidden = true;
  p.innerHTML = '<h2 style="font-size:1.3rem;margin:0 0 4px">' + esc(title) + "</h2>" +
    '<section><div class="pending"><strong>Not implemented yet — waiting for confirmation.</strong><p style="margin:6px 0">' + esc(reason) + "</p>" +
    "<strong>Needed before this calculation can be built:</strong><ul>" + needed.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" +
    (known && known.length ? "<strong>Known source information (reference only):</strong><ul>" + known.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" : "") +
    "</div></section>";
  document.getElementById("generatedPanels").appendChild(p);
  return id;
}

// Navigation: chemistry → operation
(function () {
  var C = window.CHEMISTRY_CONFIG;
  var ALK_CONFLICT = "The older MEC process guide (24% NaOH, 5 wt% citric acid) and the newer calculation workbook (35% NaOH, 2.5% citric acid) use different stock concentrations. The active production configuration must be confirmed.";
  var NAV = [
    { label: "01 HCl Pretreatment", ops: [
      ["Make-Up", buildRecipePanel("p-hclpt-mu", C.HCL_PRETREAT_MAKEUP)],
      ["Replenishment", buildRecipePanel("p-hclpt-rp", C.HCL_PRETREAT_REPLENISHMENT)] ] },
    { label: "02 CZ-8401", ops: [
      ["Make-Up", buildRecipePanel("p-cz-mu", C.CZ8401_MAKEUP)],
      ["Replenishment", buildRecipePanel("p-cz-rp", C.CZ8401_REPLENISHMENT)],
      ["Bath Adjustment", buildPendingPanel("p-cz-ba", "CZ-8401 Bath Adjustment",
        "The architecture document lists the inputs, control ranges and material constants from the workbook, but not the calculation formulas or what the sheet outputs.",
        ["The CZ-8401 workbook sheet formulas, or confirmation that it works like AP-3006 M15 (operator enters additions → predicted Anion % and Cu g/L).",
         "Whether the app should only predict results, or recommend addition amounts."],
        ["Inputs: Working Solution Volume [L], Anion Concentration [%], Cu Concentration [g/L]",
         "Cu control 24 ± 4 g/L, optimum 24 ± 2 g/L; Anion control 100 ± 20 %, optimum 100 ± 10 %",
         "CZ-8401M: Anion 100 %, Cu 24 g/L · CZ-8401R: Anion 700 %, Cu 24 g/L · DI Water: 0 / 0"])] ] },
    { label: "03 Acid Rinse / HCl", ops: [
      ["Make-Up", buildRecipePanel("p-ar-mu", C.ACID_RINSE_MAKEUP)],
      ["Replenishment", buildRecipePanel("p-ar-rp", C.ACID_RINSE_REPLENISHMENT)] ] },
    { label: "04 AP-3006", ops: [
      ["Make-Up", "panel-makeup"], ["Replenishment", "panel-replen"], ["Bath Adjustment", "panel-ap-ba"] ] },
    { label: "05 Alkaline Post-treatment", ops: [
      ["Make-Up", buildPendingPanel("p-alk-mu", "Alkaline Post-treatment Make-Up", ALK_CONFLICT,
        ["Which NaOH and citric-acid stock concentrations are used in production."],
        ["Older guide (provisional): DI Water 97.18 %, 24% NaOH 0.86 %, 5 wt% Citric Acid 1.96 % v/v (≈ 0.26 % NaOH, 0.10 % citric acid)"])],
      ["Replenishment", buildPendingPanel("p-alk-rp", "Alkaline Post-treatment Replenishment", ALK_CONFLICT,
        ["Active stock concentrations.", "Whether 2.5 L/m² (MEC reference) is fixed or configurable; processed-area definition."],
        ["Older guide: DI Water 97.11 %, 24% NaOH 0.93 %, 5 wt% Citric Acid 1.96 % v/v; MEC reference dosing 2.5 L/m²"])],
      ["Bath Adjustment", buildPendingPanel("p-alk-ba", "Alkaline Post-treatment Bath Adjustment", ALK_CONFLICT,
        ["The workbook's Alkaline adjustment sheet formulas (not included in the architecture document)."],
        ["Inputs: Working Solution Volume [L], Alkaline Concentration [%], Accelerator Concentration [mg/L], Citric Acid Concentration [%]",
         "Adjustment chemicals: 35% NaOH (density 1.38), 2.5% Citric Acid (density 1.01), DI Water"])] ] }
  ];

  var chemTabs = document.getElementById("chemTabs"), opTabs = document.getElementById("opTabs");
  var allPanels = [];
  NAV.forEach(function (c) { c.ops.forEach(function (o) { allPanels.push(o[1]); }); });
  var current = { chem: 3, op: [0, 0, 0, 0, 0] };

  function show() {
    Array.prototype.forEach.call(chemTabs.children, function (b, i) { b.setAttribute("aria-selected", i === current.chem); });
    var chem = NAV[current.chem];
    opTabs.innerHTML = "";
    chem.ops.forEach(function (o, i) {
      var b = document.createElement("button");
      b.setAttribute("role", "tab"); b.textContent = o[0];
      b.setAttribute("aria-selected", i === current.op[current.chem]);
      b.addEventListener("click", function () { current.op[current.chem] = i; show(); });
      opTabs.appendChild(b);
    });
    var active = chem.ops[current.op[current.chem]][1];
    allPanels.forEach(function (id) { document.getElementById(id).hidden = id !== active; });
  }
  NAV.forEach(function (c, i) {
    var b = document.createElement("button");
    b.setAttribute("role", "tab"); b.textContent = c.label;
    b.addEventListener("click", function () { current.chem = i; show(); });
    chemTabs.appendChild(b);
  });
  show();
})();
