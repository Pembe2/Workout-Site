# Codex Context – Exercise Library Site

This project is a static, data-driven exercise library + workout builder.

## Core Principles (Do Not Violate)
- Static-only (no backend, no build step required)
- GitHub Pages compatible
- Exercises are data-driven from js/data-exercises.js (single source of truth)
- Pages render dynamically; do not hardcode exercise content
- Home page shows muscle-group cards; home exercise results appear only after non-empty search input
- Group pages show only that group’s exercises
- Workout Builder uses localStorage only

## Key Files
- js/data-exercises.js        // Single source of truth for exercises
- js/app-home.js              // Home search + add-to-workout
- js/app-category.js          // Group page logic + add-to-workout
- js/app-workout.js           // Workout builder + timer engine
- workout.html                // Builder UI
- ARCHITECTURE.md             // Canonical architecture reference

## Exercise Model Contract
Each exercise in EXERCISES follows:
{
  id: string,
  name: string,
  group: string,             // must match GROUPS.id
  tags: string[],            // must match TAGS.id
  equipment: string[],
  level: "Beginner" | "Intermediate" | "Advanced",
  steps: string[],
  cues?: string[]
}

## Workout Builder Model
Draft is stored in localStorage key: WORKOUT_BUILDER_V1
Saved workouts list is stored in localStorage key: WORKOUT_SAVED_V1

Each workout item in draft.items:
{
  uid: string,               // unique per item instance
  exerciseId: string,        // references EXERCISES.id
  name: string,
  group: string,
  sets: number,
  reps: number,              // used if isTimed=false
  isTimed: boolean,
  durationSec: number,       // used if isTimed=true
  restOverrideEnabled: boolean,
  restSec: number            // used if restOverrideEnabled=true, else uses draft.globalRestSec
}

## Timer Rules
- Timed sets: auto countdown for durationSec, then transitions to rest
- Rep sets: user clicks “Set complete” to transition to rest
- Rest uses per-exercise override if enabled; otherwise draft.globalRestSec
- No overlapping timers; always clear intervals before starting a new countdown

## Implementation Guidance for Codex
When adding features:
- Preserve existing file structure unless a migration is explicitly planned
- Reuse existing data model and localStorage keys
- Prefer event delegation over many per-element listeners
- Keep UI changes minimal and consistent with existing styling
