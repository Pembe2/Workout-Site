// NOTE FOR AI TOOLS:
// This project follows the architecture documented in /ARCHITECTURE.md and /CODEX_CONTEXT.md.
// Do not duplicate data sources or bypass the single source of truth in js/data-exercises.js.
// Prefer making changes that preserve existing patterns and storage keys.

import { GROUPS, TAGS, EXERCISES } from "./data-exercises.js";

const WORKOUT_KEY = "WORKOUT_BUILDER_V1";
const SAVED_WORKOUTS_KEY = "WORKOUT_SAVED_V1";

const $ = (sel) => document.querySelector(sel);

function safeParse(jsonStr, fallback){
  try{
    const v = JSON.parse(jsonStr);
    return v ?? fallback;
  }catch{
    return fallback;
  }
}

function loadDraft(){
  const d = safeParse(localStorage.getItem(WORKOUT_KEY), null);
  if(!d || typeof d !== "object") return { name:"", globalRestSec:60, autoStartRest:true, items:[] };
  return {
    name: typeof d.name === "string" ? d.name : "",
    globalRestSec: Number.isFinite(+d.globalRestSec) ? Math.max(0, +d.globalRestSec) : 60,
    autoStartRest: d.autoStartRest !== false,
    items: Array.isArray(d.items) ? d.items : [],
  };
}

function saveDraft(d){
  localStorage.setItem(WORKOUT_KEY, JSON.stringify(d));
}

function loadSavedWorkouts(){
  const arr = safeParse(localStorage.getItem(SAVED_WORKOUTS_KEY), []);
  return Array.isArray(arr) ? arr : [];
}

function saveSavedWorkouts(arr){
  localStorage.setItem(SAVED_WORKOUTS_KEY, JSON.stringify(arr));
}

function fmtTime(sec){
  sec = Math.max(0, Math.floor(sec));
  const m = String(Math.floor(sec/60)).padStart(2,"0");
  const s = String(sec%60).padStart(2,"0");
  return `${m}:${s}`;
}

function uid(){
  return (crypto?.randomUUID ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2)));
}

function chip(text){ return `<span class="chip">${text}</span>`; }

let draft = loadDraft();

// ----------------- Builder rendering -----------------
function render(){
  $("#workoutName").value = draft.name || "";
  $("#globalRest").value = draft.globalRestSec ?? 60;
  $("#autoStartRest").value = draft.autoStartRest ? "yes" : "no";

  const list = $("#workoutList");
  const empty = $("#emptyState");
  if(draft.items.length === 0){
    list.innerHTML = "";
    empty.style.display = "block";
  } else {
    empty.style.display = "none";
    list.innerHTML = draft.items.map(renderItem).join("");
  }
}

function renderItem(item){
  const ex = EXERCISES.find(x => x.id === item.exerciseId);
  const groupLabel = GROUPS.find(g => g.id === (ex?.group || item.group))?.label || item.group || "Group";
  const tags = (ex?.tags || []).map(t => TAGS.find(x => x.id === t)?.label || t);
  const headerChips = [groupLabel, ...tags].filter(Boolean).map(chip).join("");

  const isTimed = !!item.isTimed;
  const restEffective = item.restOverrideEnabled ? item.restSec : draft.globalRestSec;

  return `
    <div class="item" data-uid="${item.uid}">
      <div class="item-head">
        <div>
          <div class="item-title">${item.name}</div>
          <div class="ex-meta">${headerChips || ""}</div>
        </div>
        <div class="chips">
          ${chip(isTimed ? "Timed" : "Reps")}
          ${chip(`Rest: ${restEffective}s`)}
        </div>
      </div>

      <div class="item-controls">
        <div class="field">
          <label class="label">Sets</label>
          <input class="input" type="number" min="1" step="1" data-field="sets" value="${item.sets ?? 3}">
        </div>

        <div class="field">
          <label class="label">Mode</label>
          <select class="select" data-field="isTimed">
            <option value="false" ${!isTimed ? "selected" : ""}>Reps</option>
            <option value="true" ${isTimed ? "selected" : ""}>Timed</option>
          </select>
        </div>

        <div class="field">
          <label class="label">${isTimed ? "Duration (sec)" : "Reps"}</label>
          <input class="input" type="number" min="1" step="1" data-field="${isTimed ? "durationSec" : "reps"}" value="${isTimed ? (item.durationSec ?? 45) : (item.reps ?? 10)}">
        </div>

        <div class="field">
          <label class="label">Rest override?</label>
          <select class="select" data-field="restOverrideEnabled">
            <option value="false" ${!item.restOverrideEnabled ? "selected" : ""}>Use default</option>
            <option value="true" ${item.restOverrideEnabled ? "selected" : ""}>Override</option>
          </select>
        </div>

        <div class="field" style="${item.restOverrideEnabled ? "" : "opacity:.55;"}">
          <label class="label">Rest (sec)</label>
          <input class="input" type="number" min="0" step="5" data-field="restSec" value="${item.restSec ?? 60}" ${item.restOverrideEnabled ? "" : "disabled"}>
        </div>
      </div>

      <div class="item-actions">
        <button class="btn secondary" type="button" data-action="moveUp">Up</button>
        <button class="btn secondary" type="button" data-action="moveDown">Down</button>
        <button class="btn danger" type="button" data-action="remove">Remove</button>
      </div>
    </div>
  `;
}

function updateDraftFromTopControls(){
  draft.name = $("#workoutName").value.trim();
  draft.globalRestSec = Math.max(0, parseInt($("#globalRest").value || "0", 10));
  draft.autoStartRest = $("#autoStartRest").value === "yes";
  saveDraft(draft);
}

// ----------------- Timer / Runner -----------------
let runState = null; // { phase, idx, set, remainingSec, intervalId, paused, activeRestSec }
function setRunnerButtons(enabled){
  $("#pauseResume").disabled = !enabled;
  $("#completeSet").disabled = !enabled;
  $("#skip").disabled = !enabled;
  $("#stop").disabled = !enabled;
}

function setRunnerUI(title, sub, label, seconds, chipsHtml=""){
  $("#runTitle").textContent = title;
  $("#runSub").textContent = sub;
  $("#timerLabel").textContent = label;
  $("#timerValue").textContent = fmtTime(seconds);
  $("#runChips").innerHTML = chipsHtml;
}

function clearIntervalSafe(){
  if(runState?.intervalId){
    clearInterval(runState.intervalId);
    runState.intervalId = null;
  }
}

function startCountdown(seconds, onDone){
  clearIntervalSafe();
  runState.remainingSec = seconds;
  $("#timerValue").textContent = fmtTime(runState.remainingSec);

  runState.intervalId = setInterval(() => {
    if(runState.paused) return;
    runState.remainingSec -= 1;
    $("#timerValue").textContent = fmtTime(runState.remainingSec);
    if(runState.remainingSec <= 0){
      clearIntervalSafe();
      onDone?.();
    }
  }, 1000);
}

function getRestSec(item){
  return item.restOverrideEnabled ? Math.max(0, +item.restSec || 0) : Math.max(0, +draft.globalRestSec || 0);
}

function currentItem(){
  if(!runState) return null;
  return draft.items[runState.idx] || null;
}

function beginWorkPhase(){
  const item = currentItem();
  if(!item){
    finishWorkout();
    return;
  }
  const ex = EXERCISES.find(x => x.id === item.exerciseId);
  const setNum = runState.set + 1;
  const totalSets = Math.max(1, +item.sets || 1);

  const chipsHtml = [
    chip(GROUPS.find(g => g.id === (ex?.group || item.group))?.label || "Group"),
    chip(`Exercise ${runState.idx + 1}/${draft.items.length}`),
    chip(`Set ${setNum}/${totalSets}`)
  ].join("");

  if(item.isTimed){
    const dur = Math.max(1, +item.durationSec || 45);
    setRunnerUI(item.name, "Timed set in progress", "Work", dur, chipsHtml);
    $("#completeSet").disabled = true; // not needed for timed set
    startCountdown(dur, () => {
      // auto complete the set when timer ends
      completeSetInternal();
    });
  } else {
    const reps = Math.max(1, +item.reps || 10);
    setRunnerUI(item.name, `Reps: ${reps}. Click “Set complete” when finished.`, "Work", 0, chipsHtml);
    clearIntervalSafe();
    $("#timerValue").textContent = "—";
    $("#completeSet").disabled = false;
  }
}

function beginRestPhase(){
  const item = currentItem();
  if(!item){
    finishWorkout();
    return;
  }
  const rest = getRestSec(item);
  runState.activeRestSec = rest;

  if(rest <= 0){
    advanceAfterRest();
    return;
  }

  const setNum = runState.set + 1;
  const totalSets = Math.max(1, +item.sets || 1);

  const chipsHtml = [
    chip(`Rest`),
    chip(`Set ${setNum}/${totalSets}`)
  ].join("");

  setRunnerUI(item.name, "Recover, then continue.", "Rest", rest, chipsHtml);
  $("#completeSet").disabled = true;

  if(draft.autoStartRest){
    startCountdown(rest, () => advanceAfterRest());
  } else {
    // Manual rest: show time but require user to click Skip to advance.
    clearIntervalSafe();
    $("#timerValue").textContent = fmtTime(rest);
  }
}

function advanceAfterRest(){
  const item = currentItem();
  if(!item){
    finishWorkout();
    return;
  }
  const totalSets = Math.max(1, +item.sets || 1);

  if(runState.set + 1 < totalSets){
    runState.set += 1;
    runState.phase = "work";
    beginWorkPhase();
  } else {
    runState.idx += 1;
    runState.set = 0;
    runState.phase = "work";
    beginWorkPhase();
  }
}

function completeSetInternal(){
  // called for rep-based via click, or timed when countdown ends
  runState.phase = "rest";
  beginRestPhase();
}

function finishWorkout(){
  clearIntervalSafe();
  runState = null;
  setRunnerButtons(false);
  setRunnerUI("Workout complete", "Nice work. You can edit and start again.", "Done", 0, chip("Complete"));
  $("#timerValue").textContent = "00:00";
  $("#completeSet").disabled = true;
}

function stopWorkout(){
  clearIntervalSafe();
  runState = null;
  setRunnerButtons(false);
  setRunnerUI("Stopped", "Workout stopped. Edit your plan or press Start to run again.", "Stopped", 0, chip("Stopped"));
  $("#timerValue").textContent = "00:00";
  $("#completeSet").disabled = true;
}

// ----------------- Events -----------------
render();

// Top controls
$("#workoutName").addEventListener("input", () => { updateDraftFromTopControls(); });
$("#globalRest").addEventListener("change", () => { updateDraftFromTopControls(); render(); });
$("#autoStartRest").addEventListener("change", () => { updateDraftFromTopControls(); });

// Builder list event delegation
$("#workoutList").addEventListener("change", (e) => {
  const wrap = e.target.closest(".item");
  if(!wrap) return;
  const uid = wrap.getAttribute("data-uid");
  const item = draft.items.find(x => x.uid === uid);
  if(!item) return;

  const field = e.target.getAttribute("data-field");
  if(!field) return;

  const val = e.target.value;

  if(field === "sets") item.sets = Math.max(1, parseInt(val || "1", 10));
  if(field === "reps") item.reps = Math.max(1, parseInt(val || "1", 10));
  if(field === "durationSec") item.durationSec = Math.max(1, parseInt(val || "1", 10));
  if(field === "isTimed") item.isTimed = (val === "true");
  if(field === "restOverrideEnabled") item.restOverrideEnabled = (val === "true");
  if(field === "restSec") item.restSec = Math.max(0, parseInt(val || "0", 10));

  saveDraft(draft);
  render(); // rerender to update labels / disabled states
});

$("#workoutList").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if(!btn) return;
  const wrap = btn.closest(".item");
  if(!wrap) return;
  const uid = wrap.getAttribute("data-uid");
  const idx = draft.items.findIndex(x => x.uid === uid);
  if(idx < 0) return;

  const action = btn.getAttribute("data-action");
  if(action === "remove"){
    draft.items.splice(idx, 1);
  } else if(action === "moveUp" && idx > 0){
    const tmp = draft.items[idx-1];
    draft.items[idx-1] = draft.items[idx];
    draft.items[idx] = tmp;
  } else if(action === "moveDown" && idx < draft.items.length - 1){
    const tmp = draft.items[idx+1];
    draft.items[idx+1] = draft.items[idx];
    draft.items[idx] = tmp;
  }

  saveDraft(draft);
  render();
});

// Clear / Save / Start
$("#clearWorkout").addEventListener("click", () => {
  draft = { name:"", globalRestSec:60, autoStartRest:true, items:[] };
  saveDraft(draft);
  stopWorkout();
  render();
});

$("#saveWorkout").addEventListener("click", () => {
  updateDraftFromTopControls();
  const saved = loadSavedWorkouts();
  const payload = { ...draft, savedAt: new Date().toISOString() };
  saved.unshift(payload);
  saveSavedWorkouts(saved.slice(0, 20));
  $("#saveWorkout").textContent = "Saved";
  setTimeout(() => $("#saveWorkout").textContent = "Save", 900);
});

$("#startWorkout").addEventListener("click", () => {
  updateDraftFromTopControls();
  if(draft.items.length === 0) return;

  runState = { phase: "work", idx: 0, set: 0, remainingSec: 0, intervalId: null, paused: false, activeRestSec: 0 };
  setRunnerButtons(true);
  $("#pauseResume").textContent = "Pause";
  beginWorkPhase();
});

// Runner controls
$("#pauseResume").addEventListener("click", () => {
  if(!runState) return;
  runState.paused = !runState.paused;
  $("#pauseResume").textContent = runState.paused ? "Resume" : "Pause";
});

$("#completeSet").addEventListener("click", () => {
  if(!runState) return;
  const item = currentItem();
  if(!item || item.isTimed) return;
  completeSetInternal();
});

$("#skip").addEventListener("click", () => {
  if(!runState) return;
  // Skip current phase: if work -> treat as complete; if rest -> advance
  const item = currentItem();
  if(!item) return;

  if(runState.phase === "work"){
    clearIntervalSafe();
    completeSetInternal();
  } else {
    clearIntervalSafe();
    advanceAfterRest();
  }
});

$("#stop").addEventListener("click", () => stopWorkout());
