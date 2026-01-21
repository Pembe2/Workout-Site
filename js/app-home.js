import { GROUPS, TAGS, EXERCISES } from "./data-exercises.js";

const $ = (sel) => document.querySelector(sel);

function norm(s){ return (s || "").toLowerCase().trim(); }

function matchesQuery(ex, q){
  if(!q) return true;
  const hay = [
    ex.name,
    ex.level,
    (ex.equipment || []).join(" "),
    (ex.tags || []).join(" "),
    (ex.steps || []).join(" "),
    (ex.cues || []).join(" "),
  ].join(" ").toLowerCase();
  return hay.includes(q);
}

function chip(text){ return `<span class="chip">${text}</span>`; }

function renderExerciseCard(ex){
  const groupLabel = GROUPS.find(g => g.id === ex.group)?.label || ex.group;
  const chips = [
    groupLabel,
    ...(ex.tags || []).map(t => TAGS.find(x => x.id === t)?.label || t),
    ex.level,
  ].filter(Boolean).map(chip).join("");
  const meta = [
    ex.equipment?.length ? `Equipment: ${ex.equipment.join(", ")}` : null,
  ].filter(Boolean).join(" • ");

  const steps = (ex.steps || []).slice(0, 3).map(s => `<li>${s}</li>`).join("");

  return `
    <div class="exercise">
      <div class="ex-head">
        <div>
          <div class="ex-title">${ex.name}</div>
          <div class="ex-meta">${meta || ""}</div>
        </div>
        <div class="chips">${chips}</div>
      </div>
      <ul class="list">${steps}</ul>
    </div>
  `;
}

function populateSelect(sel, items, placeholder){
  const el = $(sel);
  el.innerHTML = placeholder ? `<option value="">${placeholder}</option>` : `<option value=""></option>`;
  for(const it of items){
    const opt = document.createElement("option");
    opt.value = it.id;
    opt.textContent = it.label;
    el.appendChild(opt);
  }
}

function renderGroupCards(){
  const container = $("#groupCards");
  container.innerHTML = GROUPS.map(g => `
    <a class="card" href="exercises.html?group=${encodeURIComponent(g.id)}">
      <div class="card-title">${g.label}</div>
      <div class="card-sub">Browse exercises and search within ${g.label.toLowerCase()}.</div>
    </a>
  `).join("");
}

function update(){
  const q = norm($("#q").value);
  const tag = $("#tag").value;
  const group = $("#group").value;

  const filtered = EXERCISES.filter(ex =>
    matchesQuery(ex, q) &&
    (!tag || (ex.tags || []).includes(tag)) &&
    (!group || ex.group === group)
  );

  $("#count").textContent = `${filtered.length} exercise${filtered.length === 1 ? "" : "s"} shown`;
  $("#results").innerHTML = filtered.map(renderExerciseCard).join("") || `<div class="muted">No matches found.</div>`;
}

populateSelect("#tag", TAGS, "All");
populateSelect("#group", GROUPS, "All");
renderGroupCards();
update();

$("#q").addEventListener("input", update);
$("#tag").addEventListener("change", update);
$("#group").addEventListener("change", update);
