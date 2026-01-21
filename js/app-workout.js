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
  if(!d || typeof d !== "object") return { name:"", globalRestSec:60, autoStartRest:true, items:[], blocks:[] };
  return {
    name: typeof d.name === "string" ? d.name : "",
    globalRestSec: Number.isFinite(+d.globalRestSec) ? Math.max(0, +d.globalRestSec) : 60,
    autoStartRest: d.autoStartRest !== false,
    items: Array.isArray(d.items) ? d.items : [],
    blocks: Array.isArray(d.blocks) ? d.blocks : [],
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
  if(repsEl){
    repsEl.value = "";
    if(item?.isTimed){
      repsEl.placeholder = "Optional";
    } else {
      const reps = Math.max(1, +item?.reps || 10);
      repsEl.placeholder = `Target: ${reps}`;
    }
  }
  if(weightEl) weightEl.value = "";
  if(notesEl) notesEl.value = "";
}

function captureSetLog(){
  if(!runState || runState.phase !== "work") return;
  const item = currentItem();
  if(!item) return;
  if(!Array.isArray(runState.logs)) runState.logs = [];

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
  renderBlocks();

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
  const block = draft.blocks.find(b => b.id === item.blockId);
  const blockLabel = block ? block.name : "";
  const blockChips = block ? [blockLabel, block.isCircuit ? `Circuit ${block.rounds || 1}x` : "Block"] : [];
  const headerChips = [groupLabel, ...tags, ...blockChips].filter(Boolean).map(chip).join("");

  const isTimed = !!item.isTimed;
  const isCircuit = !!block?.isCircuit;
  const restEffective = getRestSec(item);
  const restLabel = block?.restOverrideEnabled ? "Block rest" : (item.restOverrideEnabled ? "Item rest" : "Rest");

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
          <label class="label">${isCircuit ? "Rounds (from block)" : "Sets"}</label>
          <input class="input" type="number" min="1" step="1" data-field="sets" value="${isCircuit ? (block?.rounds ?? 1) : (item.sets ?? 3)}" ${isCircuit ? "disabled" : ""}>
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
          <label class="label">Block</label>
          <select class="select" data-field="blockId">
            <option value="">None</option>
            ${draft.blocks.map(b => `<option value="${b.id}" ${item.blockId === b.id ? "selected" : ""}>${b.name}${b.isCircuit ? " (Circuit)" : ""}</option>`).join("")}
          </select>
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

function renderBlocks(){
  const list = $("#blockList");
  if(!list) return;
  if(!Array.isArray(draft.blocks) || draft.blocks.length === 0){
    list.innerHTML = `<div class="muted">No blocks yet. Add one to group or circuit exercises.</div>`;
    return;
  }

  list.innerHTML = draft.blocks.map((block) => `
    <div class="block-row" data-block="${block.id}">
      <div class="item-title">${block.name || "Untitled block"}</div>
      <div class="block-controls">
        <div class="field">
          <label class="label">Name</label>
          <input class="input" type="text" data-block-field="name" value="${block.name || ""}">
        </div>
        <div class="field">
          <label class="label">Rounds</label>
          <input class="input" type="number" min="1" step="1" data-block-field="rounds" value="${block.rounds ?? 3}">
        </div>
        <div class="field">
          <label class="label">Circuit?</label>
          <select class="select" data-block-field="isCircuit">
            <option value="false" ${!block.isCircuit ? "selected" : ""}>No</option>
            <option value="true" ${block.isCircuit ? "selected" : ""}>Yes</option>
          </select>
        </div>
        <div class="field">
          <label class="label">Rest override?</label>
          <select class="select" data-block-field="restOverrideEnabled">
            <option value="false" ${!block.restOverrideEnabled ? "selected" : ""}>Use item/default</option>
            <option value="true" ${block.restOverrideEnabled ? "selected" : ""}>Override</option>
          </select>
        </div>
        <div class="field" style="${block.restOverrideEnabled ? "" : "opacity:.55;"}">
          <label class="label">Rest (sec)</label>
          <input class="input" type="number" min="0" step="5" data-block-field="restSec" value="${block.restSec ?? 60}" ${block.restOverrideEnabled ? "" : "disabled"}>
        </div>
      </div>
      <div class="item-actions">
        <button class="btn danger" type="button" data-block-action="remove">Remove</button>
      </div>
    </div>
  `).join("");
}

function buildRunQueue(){
  const queue = [];
  const blocks = Array.isArray(draft.blocks) ? draft.blocks : [];
  const circuitBlocks = new Set(blocks.filter(b => b.isCircuit).map(b => b.id));
  const handledCircuitBlocks = new Set();

  for(const item of draft.items){
    const blockId = item.blockId;
    const block = blocks.find(b => b.id === blockId);
    const isCircuit = blockId && circuitBlocks.has(blockId);

    if(isCircuit){
      if(handledCircuitBlocks.has(blockId)) continue;
      handledCircuitBlocks.add(blockId);

      const blockItems = draft.items.filter(i => i.blockId === blockId);
      const rounds = Math.max(1, +block?.rounds || 1);
      for(let round = 1; round <= rounds; round += 1){
        for(const bItem of blockItems){
          queue.push({
            itemUid: bItem.uid,
            set: round,
            totalSets: rounds,
            isCircuit: true,
            blockId,
            blockName: block?.name || "Circuit",
          });
        }
      }
      continue;
    }

    const sets = Math.max(1, +item.sets || 1);
    for(let s = 1; s <= sets; s += 1){
      queue.push({
        itemUid: item.uid,
        set: s,
        totalSets: sets,
        isCircuit: false,
        blockId,
        blockName: block?.name || "",
      });
    }
  }

  return queue;
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
  const block = draft.blocks?.find(b => b.id === item.blockId);
  if(block?.restOverrideEnabled){
    return Math.max(0, +block.restSec || 0);
  }
  if(item.restOverrideEnabled){
    return Math.max(0, +item.restSec || 0);
  }
  return Math.max(0, +draft.globalRestSec || 0);
}

function getRestSecForEntry(entry, item){
  if(!entry || !item) return 0;
  if(entry.isCircuit){
    const next = runState?.queue?.[runState.queueIndex + 1];
    const sameBlock = next?.isCircuit && next?.blockId && next.blockId === entry.blockId;
    const sameRound = sameBlock && next?.set === entry.set;
    if(sameRound){
      return 0;
    }
    const block = draft.blocks?.find(b => b.id === entry.blockId);
    if(block?.restOverrideEnabled){
      return Math.max(0, +block.restSec || 0);
    }
    return Math.max(0, +draft.globalRestSec || 0);
  }
  return getRestSec(item);
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
    entry?.isCircuit ? chip(entry.blockName || "Circuit") : ""
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
    blocks: Array.isArray(chosen.blocks) ? chosen.blocks : [],
  };
  saveDraft(draft);
  stopWorkout();
  render();
});

$("#addBlock").addEventListener("click", () => {
  if(!Array.isArray(draft.blocks)) draft.blocks = [];
  const nextIndex = draft.blocks.length + 1;
  draft.blocks.push({
    id: uid(),
    name: `Block ${nextIndex}`,
    rounds: 3,
    isCircuit: false,
    restOverrideEnabled: false,
    restSec: 60,
  });
  saveDraft(draft);
  render();
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
  if(field === "blockId") item.blockId = val || "";

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

$("#blockList").addEventListener("change", (e) => {
  const row = e.target.closest("[data-block]");
  if(!row) return;
  const blockId = row.getAttribute("data-block");
  const block = draft.blocks.find(b => b.id === blockId);
  if(!block) return;
  const field = e.target.getAttribute("data-block-field");
  if(!field) return;

  if(field === "name") block.name = e.target.value.trim();
  if(field === "rounds") block.rounds = Math.max(1, parseInt(e.target.value || "1", 10));
  if(field === "isCircuit") block.isCircuit = (e.target.value === "true");
  if(field === "restOverrideEnabled") block.restOverrideEnabled = (e.target.value === "true");
  if(field === "restSec") block.restSec = Math.max(0, parseInt(e.target.value || "0", 10));

  saveDraft(draft);
  render();
});

$("#blockList").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-block-action]");
  if(!btn) return;
  const row = e.target.closest("[data-block]");
  if(!row) return;
  const blockId = row.getAttribute("data-block");
  const action = btn.getAttribute("data-block-action");
  if(action !== "remove") return;

  draft.blocks = draft.blocks.filter(b => b.id !== blockId);
  draft.items.forEach((item) => {
    if(item.blockId === blockId) item.blockId = "";
  });
  saveDraft(draft);
  render();
});

// Clear / Save / Start
$("#clearWorkout").addEventListener("click", () => {
  draft = { name:"", globalRestSec:60, autoStartRest:true, items:[], blocks:[] };
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
  runState = { phase: "work", queueIndex: 0, remainingSec: 0, intervalId: null, paused: false, activeRestSec: 0, queue, logs: [] };
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
