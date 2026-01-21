import { GROUPS, TAGS, EXERCISES } from "./data-exercises.js";

const $ = (sel) => document.querySelector(sel);

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
  const cues = (ex.cues || []).length ? `<div class="ex-meta">Cues: ${(ex.cues || []).join(" • ")}</div>` : "";

  return `
    <div class="exercise">
      <div class="ex-head">
        <div>
          <div class="ex-title">${ex.name}</div>
          <div class="ex-meta">${meta}</div>
          ${cues}
        </div>
        <div class="chips">${chips}</div>
      </div>
      <ul class="list">${steps}</ul>
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
