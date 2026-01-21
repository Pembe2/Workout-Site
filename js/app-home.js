// NOTE FOR AI TOOLS:
// This project follows the architecture documented in /ARCHITECTURE.md and /CODEX_CONTEXT.md.
// Do not duplicate data sources or bypass the single source of truth in js/data-exercises.js.
// Prefer making changes that preserve existing patterns and storage keys.

import { GROUPS, TAGS, EXERCISES } from "./data-exercises.js";

const $ = (sel) => document.querySelector(sel);

const WORKOUT_KEY = "WORKOUT_BUILDER_V1";

function loadWorkoutDraft(){
  try{
    const raw = localStorage.getItem(WORKOUT_KEY);
    if(!raw) return { name: "", globalRestSec: 60, autoStartRest: true, items: [] };
    const obj = JSON.parse(raw);
    if(!obj || typeof obj !== "object") throw new Error("bad workout");
    obj.items = Array.isArray(obj.items) ? obj.items : [];
    return obj;
  }catch(e){
    return { name: "", globalRestSec: 60, autoStartRest: true, items: [] };
  }
}

function saveWorkoutDraft(draft){
  localStorage.setItem(WORKOUT_KEY, JSON.stringify(draft));
}

function addExerciseToWorkout(exId){
  const ex = EXERCISES.find(x => x.id === exId);
  if(!ex) return;

  const draft = loadWorkoutDraft();

  const item = {
    uid: (crypto?.randomUUID ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2))),
    exerciseId: ex.id,
    name: ex.name,
    group: ex.group,
    // Builder fields:
    sets: 3,
    reps: 10,
    isTimed: false,
    durationSec: 45,
    restOverrideEnabled: false,
    restSec: 60,
  };

  draft.items.push(item);
  saveWorkoutDraft(draft);

  // Lightweight confirmation
  const btn = document.querySelector(`[data-action="add"][data-exid="${exId}"]`);
  if(btn){
    const old = btn.textContent;
    btn.textContent = "Added";
    btn.disabled = true;
    setTimeout(() => { btn.textContent = old; btn.disabled = false; }, 900);
  }
}


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
        <div style="margin-top:10px; display:flex; justify-content:flex-end;">
          <button class="btn primary" type="button" data-action="add" data-exid="${ex.id}">Add</button>
        </div>
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

function setFilterEnabled(enabled){
  const tagEl = $("#tag");
  const groupEl = $("#group");
  tagEl.disabled = !enabled;
  groupEl.disabled = !enabled;
}

function clearFilters(){
  $("#tag").value = "";
  $("#group").value = "";
}

function update(){
  const q = norm($("#q").value);

  // Option A: do not show exercises on the home page until the user types a search query.
  if(!q){
    $("#count").textContent = "";
    $("#results").innerHTML = `<div class="muted">Start typing in the search box to find exercises across the library.</div>`;
    setFilterEnabled(false);
    clearFilters();
    return;
  }

  setFilterEnabled(true);

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


// Add-to-workout button handling (event delegation)
const resultsEl = document.getElementById("results");
if(resultsEl){
  resultsEl.addEventListener("click", (e) => {
    const btn = e.target?.closest?.('[data-action="add"]');
    if(!btn) return;
    const exId = btn.getAttribute("data-exid");
    if(exId) addExerciseToWorkout(exId);
  });
}
