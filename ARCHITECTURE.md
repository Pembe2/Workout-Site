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
- css/styles.css          All styling
- js/data-exercises.js    Single source of truth for groups/tags/exercises
- js/app-home.js          Home page logic (global search/filter/render)
- js/app-category.js      Group page logic (scoped search/filter/render)

## Routing / URLs
- /index.html
- /exercises.html?group=<groupId>
  - If group param is missing/invalid, default to "shoulders"
- /back-pain.html

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
### Home (index.html / app-home.js)
- Search is global across all exercises.
- Filters:
  - group filter: matches exercise.group
  - tag filter: exercise.tags includes selected tag
- Search matching: case-insensitive substring match across:
  - name, level, equipment, tags, steps, cues

### Group Page (exercises.html / app-category.js)
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

