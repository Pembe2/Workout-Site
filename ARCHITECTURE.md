# Exercise Library Site – Architecture

## Purpose
Static site for browsing exercises by muscle group with:
- Global search on Home
- Group-scoped search on Group pages
- Tag filters: push / pull / lower-body
- Separate Back Pain Relief page (static content)

## Repository Layout
- index.html              Home (global search + group cards)
- exercises.html          Group page (scoped search; group from querystring)
- back-pain.html          Static stretch page
- workout.html            Workout builder + run timer
- css/styles.css          All styling
- js/data-exercises.js    Single source of truth for groups/tags/exercises
- js/app-home.js          Home page logic (global search/filter/render)
- js/app-category.js      Group page logic (scoped search/filter/render)

## Routing / URLs
- /index.html
- /exercises.html?group=<groupId>
  - If group param is missing/invalid, default to "shoulders"
- /back-pain.html
- /workout.html

## Data Model Contract (Do Not Break Without Migration)
### GROUPS
export const GROUPS = [{ id: string, label: string }, ...]

### TAGS
export const TAGS = [{ id: string, label: string }, ...]
Allowed tag ids: push, pull, lower-body

### EXERCISES
export const EXERCISES = [
  {
    id: string,                 // unique globally
    name: string,
    group: string,              // must match a GROUPS.id
    tags: string[],             // elements must match TAGS.id
    equipment: string[],
    level: "Beginner" | "Intermediate" | "Advanced",
    steps: string[],
    cues?: string[]
  },
  ...
]

## Search & Filtering Rules
### Home (index.html / js/app-home.js)
- Search is global across all exercises.
- Home does not render the full exercise list by default; results appear only after the user types a non-empty search query.
- Filters:
  - group filter: matches exercise.group
  - tag filter: exercise.tags includes selected tag
- Search matching: case-insensitive substring match across:
  - name, level, equipment, tags, steps, cues

### Group Page (exercises.html / js/app-category.js)
- Scope: only exercises where exercise.group === groupId
- Search + tag filter apply after scoping.
- Jump dropdown navigates by changing the group query param.

## Rendering Rules
- Cards and exercise blocks are rendered dynamically from EXERCISES.
- Do not hardcode exercise content in HTML pages.

## Extension Guidelines
- To add an exercise: add an object to EXERCISES in js/data-exercises.js only.
- To add a new group:
  1) Add to GROUPS
  2) Add exercises referencing that group id
  3) No routing changes needed (still uses exercises.html?group=)
- To add a new tag:
  1) Add to TAGS
  2) Add tag id to relevant exercises

## Known Constraints
- No backend. All content is client-side.
- No build tools. Must remain deployable via GitHub Pages / static hosting.


## Workout Builder (workout.html / js/app-workout.js)
### Storage
- Draft workout stored in localStorage key: WORKOUT_BUILDER_V1
- Saved workouts list stored in localStorage key: WORKOUT_SAVED_V1

### Builder model (draft.items[])
Each workout item is independent from the exercise library entry, but references it by id:

{
  uid: string,             // unique per item instance
  exerciseId: string,      // references EXERCISES.id
  name: string,
  group: string,
  sets: number,
  reps: number,            // used if isTimed=false
  isTimed: boolean,
  durationSec: number,     // used if isTimed=true
  restOverrideEnabled: boolean,
  restSec: number          // used if restOverrideEnabled=true, else uses draft.globalRestSec
}

### Run logic
- Timed sets: countdown runs automatically for durationSec; then transitions to rest.
- Rep-based sets: user clicks "Set complete" to transition to rest.
- Rest: uses per-item override if enabled; otherwise uses draft.globalRestSec.
- After rest: advances to next set; after final set, advances to next exercise.


## AI / Codex Context
- See CODEX_CONTEXT.md for pinned constraints and data model notes used for future feature work.
