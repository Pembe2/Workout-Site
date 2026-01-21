// NOTE FOR AI TOOLS:
// This project follows the architecture documented in /ARCHITECTURE.md and /CODEX_CONTEXT.md.
// Keep this file as the single source of truth for mobility areas and drills.

export const MOBILITY_AREAS = [
  { id: "cervical", label: "Neck & Cervical Spine" },
  { id: "thoracic", label: "Upper / Mid Back (Thoracic)" },
  { id: "lumbar", label: "Lower Back (Lumbar) + Core Control" },
  { id: "shoulders", label: "Shoulders & Scapula" },
  { id: "hips", label: "Hips (Flexors / Glutes)" },
  { id: "ankles", label: "Ankles" },
];

export const MOBILITY_DRILLS = [
  // CERVICAL
  {
    id: "chin-tucks",
    name: "Chin Tucks",
    area: "cervical",
    timeSec: 60,
    dosage: "2-3 sets of 8-12 reps (hold 2-3s)",
    steps: [
      "Sit or stand tall; gently lengthen the back of the neck.",
      "Draw your chin straight back (like making a 'double chin') without tilting up/down.",
      "Hold briefly, then relax. Keep shoulders down and relaxed.",
    ],
    cues: ["No pain or pinching", "Small controlled motion"],
  },
  {
    id: "neck-rotation",
    name: "Neck Rotation (Controlled)",
    area: "cervical",
    timeSec: 60,
    dosage: "1-2 minutes total",
    steps: [
      "Sit tall. Slowly turn your head to the right until you feel a mild stretch.",
      "Pause 1-2 seconds, then return to center.",
      "Repeat to the left. Keep motion smooth and pain-free.",
    ],
    cues: ["Avoid forcing end-range", "Stop if dizziness occurs"],
  },
  {
    id: "upper-trap-stretch",
    name: "Upper Trapezius Stretch",
    area: "cervical",
    timeSec: 60,
    dosage: "2 x 30s per side",
    steps: [
      "Sit tall. Hold the chair with your right hand to gently anchor the shoulder.",
      "Tilt your head to the left (ear toward shoulder).",
      "Add gentle pressure with your left hand only if comfortable; breathe slowly.",
    ],
    cues: ["Keep shoulders down", "Mild stretch only"],
  },

  // THORACIC
  {
    id: "cat-cow",
    name: "Cat-Cow",
    area: "thoracic",
    timeSec: 90,
    dosage: "1-2 minutes",
    steps: [
      "Start on hands and knees with a neutral spine.",
      "Exhale: round your upper back gently (cat).",
      "Inhale: extend through upper back and chest (cow). Move smoothly.",
    ],
    cues: ["Move through the whole spine", "No sharp pain"],
  },
  {
    id: "thread-the-needle",
    name: "Thread the Needle",
    area: "thoracic",
    timeSec: 90,
    dosage: "6-10 reps per side (slow)",
    steps: [
      "On hands and knees, slide your right arm under your left arm, rotating your upper back.",
      "Let your right shoulder and head rest lightly if comfortable.",
      "Return and repeat. Switch sides.",
    ],
    cues: ["Rotate from upper back", "Keep hips stable"],
  },
  {
    id: "thoracic-extension-foam",
    name: "Thoracic Extension (Foam Roller)",
    area: "thoracic",
    timeSec: 120,
    dosage: "6-10 slow extensions",
    steps: [
      "Place foam roller across upper back (below shoulder blades).",
      "Support head with hands; gently extend over roller.",
      "Move roller slightly up/down to target stiff segments.",
    ],
    cues: ["Avoid excessive low-back arch", "Breathe"],
  },

  // LUMBAR + CORE CONTROL
  {
    id: "childs-pose-breathe",
    name: "Child's Pose Breathing",
    area: "lumbar",
    timeSec: 120,
    dosage: "1-2 minutes",
    steps: [
      "Kneel and sit back toward heels; reach arms forward.",
      "Breathe into your lower ribs and back body.",
      "Keep it comfortable-use a pillow if needed.",
    ],
    cues: ["Relax shoulders", "Slow nasal breathing"],
  },
  {
    id: "dead-bug-mobility",
    name: "Dead Bug (Core Control)",
    area: "lumbar",
    timeSec: 120,
    dosage: "2-3 sets of 6-10 per side",
    steps: [
      "Lie on back with knees up and arms toward ceiling.",
      "Gently flatten low back (no hard press).",
      "Slowly extend opposite arm/leg; return. Alternate sides.",
    ],
    cues: ["Keep ribs down", "Move slowly"],
  },
  {
    id: "knee-to-chest",
    name: "Single Knee to Chest",
    area: "lumbar",
    timeSec: 90,
    dosage: "2 x 30-45s per side",
    steps: [
      "Lie on back; bring one knee toward chest.",
      "Hold behind thigh or shin; keep other leg relaxed.",
      "Breathe and keep the stretch mild.",
    ],
    cues: ["No pinching in hip", "Relax jaw/neck"],
  },

  // SHOULDERS
  {
    id: "wall-slides",
    name: "Wall Slides",
    area: "shoulders",
    timeSec: 120,
    dosage: "2 sets of 8-12",
    steps: [
      "Stand with back against a wall; ribs down.",
      "Place forearms on wall; slide arms up while keeping contact.",
      "Return slowly; keep shoulders down.",
    ],
    cues: ["Don't shrug", "Smooth tempo"],
  },
  {
    id: "band-dislocates",
    name: "Band Pass-Throughs",
    area: "shoulders",
    timeSec: 120,
    dosage: "2 sets of 8-12",
    steps: [
      "Hold a band wide with straight arms in front.",
      "Bring arms overhead and behind as far as comfortable.",
      "Reverse back to start. Widen grip if tight.",
    ],
    cues: ["Straight elbows", "No pain at front shoulder"],
  },
  {
    id: "scapular-cars",
    name: "Scapular Controlled Rotations",
    area: "shoulders",
    timeSec: 120,
    dosage: "1-2 minutes",
    steps: [
      "Stand tall. Slowly elevate shoulders, retract, depress, and protract in a controlled circle.",
      "Reverse direction after several reps.",
      "Keep neck relaxed and movement smooth.",
    ],
    cues: ["Small-to-moderate range", "No neck tension"],
  },

  // HIPS
  {
    id: "hip-flexor-stretch",
    name: "Half-Kneeling Hip Flexor Stretch",
    area: "hips",
    timeSec: 120,
    dosage: "2 x 30-45s per side",
    steps: [
      "Half-kneel with one knee down, other foot forward.",
      "Tuck pelvis slightly (posterior tilt) and gently shift forward.",
      "Raise same-side arm overhead for deeper stretch if desired.",
    ],
    cues: ["Don't arch low back", "Mild front-hip stretch"],
  },
  {
    id: "90-90-hips",
    name: "90/90 Hip Switches",
    area: "hips",
    timeSec: 150,
    dosage: "1-2 minutes",
    steps: [
      "Sit in 90/90 position (both knees bent).",
      "Rotate knees to switch sides without forcing end range.",
      "Use hands for support as needed; keep it smooth.",
    ],
    cues: ["No pinching", "Slow rotations"],
  },
  {
    id: "glute-bridge-hold",
    name: "Glute Bridge Hold",
    area: "hips",
    timeSec: 120,
    dosage: "3 x 20-40s",
    steps: [
      "Lie on back with knees bent and feet planted.",
      "Lift hips to a comfortable height; squeeze glutes.",
      "Hold while breathing; lower slowly.",
    ],
    cues: ["Ribs down", "Feel glutes more than low back"],
  },

  // ANKLES
  {
    id: "knee-to-wall",
    name: "Knee-to-Wall Ankle Mobilization",
    area: "ankles",
    timeSec: 120,
    dosage: "2 sets of 8-12 per side",
    steps: [
      "Face a wall with foot a few cm away.",
      "Drive knee toward wall while keeping heel down.",
      "Adjust distance so you can touch wall without heel lifting.",
    ],
    cues: ["Heel stays down", "Move slowly"],
  },
  {
    id: "calf-stretch",
    name: "Calf Stretch (Wall)",
    area: "ankles",
    timeSec: 120,
    dosage: "2 x 30-45s per side",
    steps: [
      "Hands on wall; step one foot back.",
      "Keep back heel down and knee straight; lean forward slightly.",
      "Switch sides. For soleus, bend back knee slightly.",
    ],
    cues: ["Keep heel down", "Mild stretch only"],
  },
  {
    id: "ankle-circles",
    name: "Ankle Circles (Controlled)",
    area: "ankles",
    timeSec: 90,
    dosage: "1 minute per side",
    steps: [
      "Seated or standing, lift one foot slightly.",
      "Draw slow circles with the toes; reverse direction.",
      "Keep motion smooth and controlled.",
    ],
    cues: ["Don't rush", "Full comfortable range"],
  },
];
