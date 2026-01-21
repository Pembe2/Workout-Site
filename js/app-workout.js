// NOTE FOR AI TOOLS:
// This project follows the architecture documented in /ARCHITECTURE.md and /CODEX_CONTEXT.md.
// Do not duplicate data sources or bypass the single source of truth in js/data-exercises.js.
// Prefer making changes that preserve existing patterns and storage keys.

import { GROUPS, TAGS, EXERCISES } from "./data-exercises.js";

const WORKOUT_KEY = "WORKOUT_BUILDER_V1";
const SAVED_WORKOUTS_KEY = "WORKOUT_SAVED_V1";
const LAST_PERF_KEY = "WORKOUT_LAST_PERF_V1";

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
    items: Array.isArray(d.items) ? d.items.map((item) => ({
      ...item,
      circuitWithNext: !!item.circuitWithNext,
    })) : [],
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

function loadLastPerf(){
  const obj = safeParse(localStorage.getItem(LAST_PERF_KEY), {});
  return obj && typeof obj === "object" ? obj : {};
}

function saveLastPerf(map){
  localStorage.setItem(LAST_PERF_KEY, JSON.stringify(map));
}

function seedSavedWorkouts(){
  const existing = loadSavedWorkouts();
  if(existing.length > 0) return;

  const makeItem = (name, sets, reps, weight = "", isTimed = false, durationSec = 45) => ({
    uid: uid(),
    exerciseId: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    group: "custom",
    circuitWithNext: false,
    weight,
    sets,
    reps,
    isTimed,
    durationSec,
    restOverrideEnabled: false,
    restSec: 60,
  });

  const now = new Date().toISOString();
  const seed = [
    {
      name: "Push (Barbell/Dumbbell)",
      globalRestSec: 60,
      autoStartRest: true,
      savedAt: now,
      items: [
        makeItem("Barbell Bench Press", 4, 8),
        makeItem("Barbell Incline Press", 3, 10),
        makeItem("Barbell Overhead Press", 3, 10),
        makeItem("Dumbbell Lateral Raise", 3, 15),
        makeItem("Dumbbell Chest Fly", 3, 12),
        makeItem("Barbell Close-Grip Bench Press", 3, 10),
        makeItem("Dumbbell Overhead Triceps Extension", 3, 12),
      ],
    },
    {
      name: "Pull (Cable Focus)",
      globalRestSec: 60,
      autoStartRest: true,
      savedAt: now,
      items: [
        makeItem("Lat Pulldown", 4, 10),
        makeItem("Seated Cable Row", 4, 10),
        makeItem("Dumbbell Bent-Over Row", 3, 10),
        makeItem("Cable Face Pull", 3, 15),
        makeItem("Dumbbell Chest-Supported Row", 3, 10),
        makeItem("Barbell Curl", 3, 12),
        makeItem("Cable Curl", 3, 15),
      ],
    },
    {
      name: "Lower Body (Barbell/Dumbbell)",
      globalRestSec: 60,
      autoStartRest: true,
      savedAt: now,
      items: [
        makeItem("Barbell Back Squat", 4, 8),
        makeItem("Barbell Romanian Deadlift", 3, 10),
        makeItem("Dumbbell Walking Lunge", 3, 12),
        makeItem("Hip Thrust", 3, 12),
        makeItem("Dumbbell Step-up", 3, 10),
        makeItem("Dumbbell Calf Raise", 4, 15),
      ],
    },
  ];

  saveSavedWorkouts(seed);
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

function openRunModal(){
  const modal = $("#runModal");
  if(!modal) return;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeRunModal(){
  const modal = $("#runModal");
  if(!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function setLogVisibility(isVisible){
  const el = $("#setLog");
  if(el) el.style.display = isVisible ? "block" : "none";
}

function resetSetLogInputs(item){
  const repsEl = $("#runReps");
  const weightEl = $("#runWeight");
  const notesEl = $("#runNotes");
  const last = runState?.lastInputs?.[item?.uid] || null;
  const plannedReps = item?.isTimed ? "" : String(Math.max(1, +item?.reps || 10));
  const plannedWeight = item?.weight || "";
  if(repsEl){
    repsEl.value = last?.reps ?? plannedReps;
    if(item?.isTimed){
      repsEl.placeholder = "Optional";
    } else {
      const reps = Math.max(1, +item?.reps || 10);
      repsEl.placeholder = `Target: ${reps}`;
    }
  }
  if(weightEl) weightEl.value = last?.weight ?? plannedWeight;
  if(notesEl) notesEl.value = last?.notes ?? "";
}

function captureSetLog(){
  if(!runState || runState.phase !== "work") return;
  const item = currentItem();
  if(!item) return;
  if(!Array.isArray(runState.logs)) runState.logs = [];
  if(!runState.lastInputs) runState.lastInputs = {};

  const repsVal = $("#runReps")?.value?.trim();
  const weightVal = $("#runWeight")?.value?.trim();
  const notesVal = $("#runNotes")?.value?.trim();

  runState.logs.push({
    itemUid: item.uid,
    exerciseId: item.exerciseId,
    name: item.name,
    set: currentEntry()?.set || 1,
    idx: runState.queueIndex,
    isTimed: !!item.isTimed,
    targetReps: item.isTimed ? null : Math.max(1, +item.reps || 0),
    targetDurationSec: item.isTimed ? Math.max(1, +item.durationSec || 0) : null,
    actualReps: repsVal ? Math.max(0, parseInt(repsVal, 10)) : null,
    weight: weightVal || "",
    notes: notesVal || ""
  });

  runState.lastInputs[item.uid] = {
    reps: repsVal || "",
    weight: weightVal || "",
    notes: notesVal || ""
  };

  if(repsVal || weightVal){
    const perf = loadLastPerf();
    perf[item.exerciseId] = {
      reps: repsVal || "",
      weight: weightVal || ""
    };
    saveLastPerf(perf);
  }
}

function renderSummary(logs){
  const wrap = $("#runSummary");
  const body = $("#runSummaryBody");
  if(!wrap || !body) return;
  wrap.hidden = false;

  const logList = Array.isArray(logs) ? logs : (runState?.logs || []);
  if(logList.length === 0){
    body.innerHTML = `<div class="muted">No sets logged.</div>`;
    return;
  }

  const html = draft.items.map((item) => {
    const entries = logList.filter((log) => log.itemUid === item.uid);
    if(entries.length === 0){
      return `
        <div class="summary-group">
          <div class="summary-title">${item.name}</div>
          <div class="summary-meta muted">No sets logged.</div>
        </div>
      `;
    }

    const rows = entries.map((log) => {
      const repsText = log.actualReps !== null ? `${log.actualReps}` : (log.targetReps ? `${log.targetReps} target` : "--");
      const weightText = log.weight ? log.weight : "--";
      const details = [
        log.isTimed && log.targetDurationSec ? `Time: ${log.targetDurationSec}s` : null,
        log.notes ? `Notes: ${log.notes}` : null
      ].filter(Boolean).join(" • ") || "--";
      return `
        <div class="summary-row">
          <div>Set ${log.set}</div>
          <div>Reps: ${repsText}</div>
          <div>Weight: ${weightText}</div>
          <div>${details}</div>
        </div>
      `;
    }).join("");

    return `
      <div class="summary-group">
        <div class="summary-title">${item.name}</div>
        <div class="summary-meta muted">${entries.length} set${entries.length === 1 ? "" : "s"} logged</div>
        <div class="summary-rows">${rows}</div>
      </div>
    `;
  }).join("");

  body.innerHTML = html;
}

// ----------------- Builder rendering -----------------
function render(){
  $("#workoutName").value = draft.name || "";
  $("#globalRest").value = draft.globalRestSec ?? 60;
  $("#autoStartRest").value = draft.autoStartRest ? "yes" : "no";
  renderSavedWorkouts();

  const list = $("#workoutList");
  const empty = $("#emptyState");
  if(draft.items.length === 0){
    list.innerHTML = "";
    empty.style.display = "block";
  } else {
    empty.style.display = "none";
    list.innerHTML = renderWorkoutList();
  }
}

function renderWorkoutList(){
  const items = draft.items;
  let html = "";
  let i = 0;

  while(i < items.length){
    const chainIndexes = [i];
    while(i < items.length - 1 && items[i].circuitWithNext){
      i += 1;
      chainIndexes.push(i);
    }

    if(chainIndexes.length > 1){
      const chainHtml = chainIndexes.map((idx) => renderItem(items[idx], idx, items.length)).join("");
      html += `
        <div class="circuit-group">
          <div class="circuit-label">Circuit</div>
          ${chainHtml}
        </div>
      `;
    } else {
      html += renderItem(items[i], i, items.length);
    }
    i += 1;
  }

  return html;
}

function renderItem(item, idx, total){
  const ex = EXERCISES.find(x => x.id === item.exerciseId);
  const groupLabel = GROUPS.find(g => g.id === (ex?.group || item.group))?.label || item.group || "Group";
  const tags = (ex?.tags || []).map(t => TAGS.find(x => x.id === t)?.label || t);
  const headerChips = [groupLabel, ...tags].filter(Boolean).map(chip).join("");
  const lastPerf = loadLastPerf()[item.exerciseId];
  const repsValue = lastPerf?.reps ? lastPerf.reps : (item.reps ?? 10);
  const weightValue = lastPerf?.weight ? lastPerf.weight : (item.weight ?? "");

  const isTimed = !!item.isTimed;
  const restEffective = item.restOverrideEnabled ? item.restSec : draft.globalRestSec;
  const restLabel = item.restOverrideEnabled ? "Item rest" : "Rest";
  const isLast = idx === total - 1;
  const circuitLabel = item.circuitWithNext ? "Circuit with below: On" : "Circuit with below";

  return `
    <div class="item" data-uid="${item.uid}">
      <div class="item-head">
        <div>
          <div class="item-title">${item.name}</div>
          <div class="ex-meta">${headerChips || ""}</div>
        </div>
        <div class="chips">
          ${chip(isTimed ? "Timed" : "Reps")}
          ${chip(`${restLabel}: ${restEffective}s`)}
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
          <input class="input" type="number" min="1" step="1" data-field="${isTimed ? "durationSec" : "reps"}" value="${isTimed ? (item.durationSec ?? 45) : repsValue}">
        </div>

        <div class="field">
          <label class="label">Weight</label>
          <input class="input" type="text" data-field="weight" value="${weightValue}" placeholder="e.g., 135 lb / 60 kg">
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
        <button class="btn secondary ${item.circuitWithNext ? "is-active" : ""}" type="button" data-action="toggleCircuit" aria-pressed="${item.circuitWithNext ? "true" : "false"}" ${isLast ? "disabled" : ""}>${circuitLabel}</button>
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

function renderSavedWorkouts(){
  const select = $("#savedWorkoutSelect");
  if(!select) return;
  const saved = loadSavedWorkouts();
  if(saved.length === 0){
    select.innerHTML = `<option value="">No saved workouts</option>`;
    return;
  }
  select.innerHTML = saved.map((w, idx) => {
    const name = w.name || `Workout ${idx + 1}`;
    const date = w.savedAt ? new Date(w.savedAt).toLocaleDateString() : "";
    return `<option value="${idx}">${name}${date ? ` • ${date}` : ""}</option>`;
  }).join("");
  select.value = "";
}


// ----------------- Timer / Runner -----------------
let runState = null; // { phase, queueIndex, remainingSec, intervalId, paused, activeRestSec, queue, logs }
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
  if(item.restOverrideEnabled){
    return Math.max(0, +item.restSec || 0);
  }
  return Math.max(0, +draft.globalRestSec || 0);
}

function currentEntry(){
  if(!runState) return null;
  return runState.queue?.[runState.queueIndex] || null;
}

function currentItem(){
  const entry = currentEntry();
  if(!entry) return null;
  return draft.items.find(i => i.uid === entry.itemUid) || null;
}

function buildRunQueue(){
  const queue = [];
  const items = draft.items;
  let i = 0;

  while(i < items.length){
    const chain = [items[i]];
    while(i < items.length - 1 && items[i].circuitWithNext){
      i += 1;
      chain.push(items[i]);
    }

    if(chain.length > 1){
      const rounds = Math.max(...chain.map((item) => Math.max(1, +item.sets || 1)));
      for(let round = 1; round <= rounds; round += 1){
        for(const item of chain){
          const sets = Math.max(1, +item.sets || 1);
          if(round <= sets){
            queue.push({
              itemUid: item.uid,
              set: round,
              totalSets: rounds,
              isCircuit: true,
              round,
              rounds,
              chainId: chain[0].uid,
            });
          }
        }
      }
    } else {
      const sets = Math.max(1, +items[i].sets || 1);
      for(let s = 1; s <= sets; s += 1){
        queue.push({
          itemUid: items[i].uid,
          set: s,
          totalSets: sets,
          isCircuit: false,
        });
      }
    }

    i += 1;
  }

  return queue;
}

function getRestSecForEntry(entry, item){
  if(!entry || !item) return 0;
  if(entry.isCircuit){
    const next = runState?.queue?.[runState.queueIndex + 1];
    const sameChain = next?.isCircuit && next?.chainId === entry.chainId;
    const sameRound = sameChain && next?.round === entry.round;
    if(sameRound){
      return 0;
    }
  }
  return getRestSec(item);
}

function beginWorkPhase(){
  const item = currentItem();
  if(!item){
    finishWorkout();
    return;
  }
  const ex = EXERCISES.find(x => x.id === item.exerciseId);
  const entry = currentEntry();
  const setNum = entry?.set || 1;
  const totalSets = entry?.totalSets || Math.max(1, +item.sets || 1);

  const chipsHtml = [
    chip(GROUPS.find(g => g.id === (ex?.group || item.group))?.label || "Group"),
    chip(`Step ${runState.queueIndex + 1}/${runState.queue.length}`),
    chip(`${entry?.isCircuit ? "Round" : "Set"} ${setNum}/${totalSets}`),
    entry?.isCircuit ? chip("Circuit") : ""
  ].join("");

  setLogVisibility(true);
  resetSetLogInputs(item);

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
    $("#timerValue").textContent = "";
    $("#completeSet").disabled = false;
  }
}

function beginRestPhase(){
  const item = currentItem();
  if(!item){
    finishWorkout();
    return;
  }
  const entry = currentEntry();
  const rest = getRestSecForEntry(entry, item);
  runState.activeRestSec = rest;

  if(rest <= 0){
    advanceAfterRest();
    return;
  }

  const setNum = entry?.set || 1;
  const totalSets = entry?.totalSets || Math.max(1, +item.sets || 1);

  const chipsHtml = [
    chip(`Rest`),
    chip(`${entry?.isCircuit ? "Round" : "Set"} ${setNum}/${totalSets}`)
  ].join("");

  setRunnerUI(item.name, "Recover, then continue.", "Rest", rest, chipsHtml);
  $("#completeSet").disabled = true;
  setLogVisibility(false);

  if(draft.autoStartRest){
    startCountdown(rest, () => advanceAfterRest());
  } else {
    // Manual rest: show time but require user to click Skip to advance.
    clearIntervalSafe();
    $("#timerValue").textContent = fmtTime(rest);
  }
}

function advanceAfterRest(){
  if(!runState) return;
  if(runState.queueIndex + 1 >= runState.queue.length){
    finishWorkout();
    return;
  }
  runState.queueIndex += 1;
  runState.phase = "work";
  beginWorkPhase();
}

function completeSetInternal(){
  // called for rep-based via click, or timed when countdown ends
  captureSetLog();
  runState.phase = "rest";
  beginRestPhase();
}

function finishWorkout(){
  clearIntervalSafe();
  setLogVisibility(false);
  const logs = runState?.logs || [];
  runState = null;
  setRunnerButtons(false);
  setRunnerUI("Workout complete", "Nice work. You can edit and start again.", "Done", 0, chip("Complete"));
  $("#timerValue").textContent = "00:00";
  $("#completeSet").disabled = true;
  renderSummary(logs);
}

function stopWorkout(){
  clearIntervalSafe();
  setLogVisibility(false);
  runState = null;
  setRunnerButtons(false);
  setRunnerUI("Stopped", "Workout stopped. Edit your plan or press Start to run again.", "Stopped", 0, chip("Stopped"));
  $("#timerValue").textContent = "00:00";
  $("#completeSet").disabled = true;
}

// ----------------- Events -----------------
seedSavedWorkouts();
render();
setLogVisibility(false);

// Top controls
$("#workoutName").addEventListener("input", () => { updateDraftFromTopControls(); });
$("#globalRest").addEventListener("change", () => { updateDraftFromTopControls(); render(); });
$("#autoStartRest").addEventListener("change", () => { updateDraftFromTopControls(); });

$("#loadWorkout").addEventListener("click", () => {
  const select = $("#savedWorkoutSelect");
  const idx = select?.value;
  if(idx === "" || idx === null || idx === undefined) return;
  const saved = loadSavedWorkouts();
  const chosen = saved[Number(idx)];
  if(!chosen) return;
  draft = {
    name: typeof chosen.name === "string" ? chosen.name : "",
    globalRestSec: Number.isFinite(+chosen.globalRestSec) ? Math.max(0, +chosen.globalRestSec) : 60,
    autoStartRest: chosen.autoStartRest !== false,
    items: Array.isArray(chosen.items) ? chosen.items : [],
  };
  saveDraft(draft);
  stopWorkout();
  render();
});

$("#deleteWorkout").addEventListener("click", () => {
  const select = $("#savedWorkoutSelect");
  const idx = select?.value;
  if(idx === "" || idx === null || idx === undefined) return;
  const saved = loadSavedWorkouts();
  const index = Number(idx);
  if(!Number.isFinite(index) || index < 0 || index >= saved.length) return;
  saved.splice(index, 1);
  saveSavedWorkouts(saved);
  renderSavedWorkouts();
});


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
  if(field === "weight") item.weight = val;

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
  if(action === "toggleCircuit"){
    if(idx < draft.items.length - 1){
      draft.items[idx].circuitWithNext = !draft.items[idx].circuitWithNext;
    }
  } else if(action === "remove"){
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
  renderSavedWorkouts();
  $("#saveWorkout").textContent = "Saved";
  setTimeout(() => $("#saveWorkout").textContent = "Save", 900);
});

$("#startWorkout").addEventListener("click", () => {
  updateDraftFromTopControls();
  if(draft.items.length === 0) return;

  const queue = buildRunQueue();
  if(queue.length === 0) return;
  runState = { phase: "work", queueIndex: 0, remainingSec: 0, intervalId: null, paused: false, activeRestSec: 0, queue, logs: [], lastInputs: {} };
  setRunnerButtons(true);
  $("#pauseResume").textContent = "Pause";
  const summary = $("#runSummary");
  const summaryBody = $("#runSummaryBody");
  if(summary) summary.hidden = true;
  if(summaryBody) summaryBody.innerHTML = "";
  openRunModal();
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

document.addEventListener("click", (e) => {
  const closeBtn = e.target.closest("[data-action=\"closeRun\"]");
  if(!closeBtn) return;
  closeRunModal();
});
