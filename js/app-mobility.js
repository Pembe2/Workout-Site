// NOTE FOR AI TOOLS:
// This project follows the architecture documented in /ARCHITECTURE.md and /CODEX_CONTEXT.md.
// Mobility uses js/data-mobility.js as the source of truth.

import { MOBILITY_AREAS, MOBILITY_DRILLS } from "./data-mobility.js";

const $ = (sel) => document.querySelector(sel);

function norm(s){ return (s || "").toString().trim().toLowerCase(); }

function matches(d, q){
  if(!q) return true;
  const hay = [
    d.name,
    d.dosage,
    (d.steps || []).join(" "),
    (d.cues || []).join(" "),
    d.area
  ].join(" ").toLowerCase();
  return hay.includes(q);
}

function chip(text){ return `<span class="chip">${text}</span>`; }

function areaLabel(id){
  return MOBILITY_AREAS.find(a => a.id === id)?.label || id;
}

function renderAreaCard(a){
  return `
    <a class="card" href="#area-${a.id}" style="text-decoration:none;">
      <div class="card-title">${a.label}</div>
      <div class="muted small">View drills</div>
    </a>
  `;
}

function renderDrillCard(d){
  const secs = Number.isFinite(+d.timeSec) ? Math.max(0, +d.timeSec) : 0;
  const meta = [
    chip(areaLabel(d.area)),
    secs ? chip(`~${secs}s`) : "",
    d.dosage ? chip(d.dosage) : ""
  ].filter(Boolean).join("");

  const steps = (d.steps || []).map(s => `<li>${s}</li>`).join("");
  const cues = (d.cues || []).length
    ? `<div class="muted small" style="margin-top:8px;"><b>Cues:</b> ${(d.cues || []).join(" | ")}</div>`
    : "";

  return `
    <div class="card">
      <div class="card-title">${d.name}</div>
      <div class="ex-meta">${meta}</div>
      <div style="margin-top:10px;">
        <ol class="muted" style="margin:0; padding-left:18px;">
          ${steps}
        </ol>
        ${cues}
      </div>
    </div>
  `;
}

function renderAreaSection(a){
  const drills = MOBILITY_DRILLS.filter(d => d.area === a.id);
  return `
    <div class="panel" id="area-${a.id}">
      <div class="panel-head">
        <h2 class="h1" style="font-size:18px;">${a.label}</h2>
        <p class="muted">Browse drills for this area. Use the search above to filter globally.</p>
      </div>
      <div class="stack">
        ${drills.map(renderDrillCard).join("")}
      </div>
    </div>
  `;
}

function populateAreas(){
  const sel = $("#area");
  sel.innerHTML = `<option value="">All areas</option>` + MOBILITY_AREAS.map(a => `<option value="${a.id}">${a.label}</option>`).join("");
  $("#areaCards").innerHTML = MOBILITY_AREAS.map(renderAreaCard).join("");
  $("#areaSections").innerHTML = MOBILITY_AREAS.map(renderAreaSection).join("");
}

function updateResults(){
  const q = norm($("#q").value);
  const area = $("#area").value;

  if(!q){
    $("#results").innerHTML = `<div class="muted">Start typing to search across all mobility drills, or browse by area below.</div>`;
    return;
  }

  const filtered = MOBILITY_DRILLS.filter(d =>
    matches(d, q) &&
    (!area || d.area === area)
  );

  $("#results").innerHTML = filtered.map(renderDrillCard).join("") || `<div class="muted">No matches found.</div>`;
}

populateAreas();
updateResults();

$("#q").addEventListener("input", updateResults);
$("#area").addEventListener("change", updateResults);
$("#clear").addEventListener("click", () => {
  $("#q").value = "";
  $("#area").value = "";
  updateResults();
});
