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
    circuitWithNext: false,
    weight: "",
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

function getParam(name){
  const u = new URL(window.location.href);
  return u.searchParams.get(name);
}

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
    ...(ex.tags || []).map(t => TAGS.find(x => x.id === t)?.label || t),
    ex.level,
  ].filter(Boolean).map(chip).join("");
  const meta = [
    groupLabel,
    ex.equipment?.length ? `Equipment: ${ex.equipment.join(", ")}` : null,
  ].filter(Boolean).join(" • ");

  const steps = (ex.steps || []).map(s => `<li>${s}</li>`).join("");
  const cues = (ex.cues || []).length ? `<div class="ex-meta ex-cues">Cues: ${(ex.cues || []).join(" • ")}</div>` : "";

  return `
    <div class="exercise">
      <div class="ex-head">
        <div class="ex-main">
          <div class="ex-title">${ex.name}</div>
          <div class="ex-meta">${meta}</div>
          ${cues}
        </div>
        <div class="chips">${chips}</div>
        <div class="ex-actions">
          <button class="btn primary" type="button" data-action="add" data-exid="${ex.id}">Add</button>
        </div>
      </div>
      <ul class="list ex-steps">${steps}</ul>
    </div>
  `;
}

function populateSelect(el, items, placeholder){
  el.innerHTML = placeholder ? `<option value="">${placeholder}</option>` : `<option value=""></option>`;
  for(const it of items){
    const opt = document.createElement("option");
    opt.value = it.id;
    opt.textContent = it.label;
    el.appendChild(opt);
  }
}

const groupId = getParam("group") || "shoulders";
const group = GROUPS.find(g => g.id === groupId) || GROUPS[0];

document.title = `${group.label} Exercises`;
$("#pageTitle").textContent = `${group.label} Exercises`;
$("#groupHeading").textContent = group.label;

populateSelect($("#tag"), TAGS, "All");
populateSelect($("#groupJump"), GROUPS, "Select…");
$("#groupJump").value = "";

function update(){
  const q = norm($("#q").value);
  const tag = $("#tag").value;

  const filtered = EXERCISES.filter(ex =>
    ex.group === group.id &&
    matchesQuery(ex, q) &&
    (!tag || (ex.tags || []).includes(tag))
  );

  $("#count").textContent = `${filtered.length} exercise${filtered.length === 1 ? "" : "s"} shown in ${group.label}`;
  $("#results").innerHTML = filtered.map(renderExerciseCard).join("") || `<div class="muted">No matches found.</div>`;
}

update();

$("#q").addEventListener("input", update);
$("#tag").addEventListener("change", update);
$("#groupJump").addEventListener("change", (e) => {
  const next = e.target.value;
  if(next){
    window.location.href = `exercises.html?group=${encodeURIComponent(next)}`;
  }
});


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
