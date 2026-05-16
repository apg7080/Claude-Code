// Build Obsidian-vault markdown files from the recipe library.
// Output: ./vault/Chef Marco/  (drop into your Obsidian projects/ folder)

import { RECIPES, PROTEIN_PREP } from "./recipes.js";
import fs from "node:fs";
import path from "node:path";

const OUT = "./vault/Chef Marco";

const WEEK_PLANS = [
  {
    label: "Week 1 — Chicken & Salmon Focus",
    prepProteins: ["chicken_thighs", "ground_turkey", "hard_boiled_eggs"],
    dinners: {
      Sunday: "pesto_salmon_bowls",
      Monday: "greek_lemon_chicken",
      Tuesday: "turkey_zucchini_skillet",
      Wednesday: "chicken_souvlaki_bowls",
      Thursday: "shakshuka",
      Friday: "baked_cod_olives",
      Saturday: "shrimp_cauliflower_rice",
    },
  },
  {
    label: "Week 2 — Meatball & Lentil Focus",
    prepProteins: ["meatballs", "lentils", "hard_boiled_eggs"],
    dinners: {
      Sunday: "pork_tenderloin_apples",
      Monday: "sheet_pan_greek_meatballs",
      Tuesday: "lentil_soup",
      Wednesday: "italian_wedding_soup",
      Thursday: "mediterranean_lentil_bowl",
      Friday: "meatball_marinara",
      Saturday: "zoodle_shrimp_scampi",
    },
  },
  {
    label: "Week 3 — Sous Vide & Mediterranean Comfort",
    prepProteins: ["sous_vide_chicken_breast", "ground_turkey", "lentils"],
    dinners: {
      Sunday: "beef_eggplant_bake",
      Monday: "sous_vide_chicken_plate",
      Tuesday: "turkey_stuffed_peppers",
      Wednesday: "mediterranean_lentil_bowl",
      Thursday: "frittata_spinach_feta",
      Friday: "salmon_cakes",
      Saturday: "cod_lemon_herb",
    },
  },
  {
    label: "Week 4 — Fresh & Light",
    prepProteins: ["chicken_thighs", "meatballs", "hard_boiled_eggs"],
    dinners: {
      Sunday: "tuscan_white_bean_stew",
      Monday: "greek_chicken_salad",
      Tuesday: "italian_wedding_soup",
      Wednesday: "chicken_orzo_skillet",
      Thursday: "sheet_pan_greek_meatballs",
      Friday: "pesto_salmon_bowls",
      Saturday: "shrimp_cauliflower_rice",
    },
  },
];

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const LUNCH_ROTATION = [
  "greek_chicken_lunch_bowl",
  "tuna_salad_wraps",
  "mediterranean_chicken_wrap",
  "greek_chicken_lunch_bowl",
  "tuna_salad_wraps",
  "mediterranean_chicken_wrap",
  "greek_chicken_lunch_bowl",
];

const BREAKFAST_ROTATION = [
  "greek_yogurt_bowl",
  "veggie_scramble",
  "egg_muffins",
  "smoothie_breakfast",
  "cottage_cheese_bowl",
  "egg_muffins",
  "veggie_scramble",
];

const lunchForDay = (w, d) => LUNCH_ROTATION[(d + w) % LUNCH_ROTATION.length];
const breakfastForDay = (w, d) => BREAKFAST_ROTATION[(d + w) % BREAKFAST_ROTATION.length];

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeFile(p, content) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, content);
}

function recipeFileName(id) {
  return `${RECIPES[id].name.replace(/[\\/:*?"<>|]/g, "")}.md`;
}

function prepFileName(key) {
  return `${PROTEIN_PREP[key].label.replace(/[\\/:*?"<>|]/g, "")}.md`;
}

// ----- MOC -----
function buildMOC() {
  const lines = [
    "---",
    "type: moc",
    "tags: [meal-plan, family, mediterranean, blw]",
    "---",
    "",
    "# Chef Marco — 4-Week Family Meal Plan",
    "",
    "**Household**: 2 adults + 1 10-month-old · **Allergies**: none · **Diet**: Mediterranean + high-protein/low-carb + baby-led-weaning friendly · **Cap**: every recipe ≤ 60 min",
    "",
    "## Weeks",
    "",
    ...WEEK_PLANS.map((w, i) => `- [[Weeks/Week ${i + 1}|${w.label}]]`),
    "",
    "## Sundays cook 3 proteins in parallel (~90 min active)",
    "",
    ...Object.keys(PROTEIN_PREP).map((k) => `- [[Protein Prep/${prepFileName(k).replace(/\.md$/, "")}]]`),
    "",
    "## Standing baby (10 mo) rules",
    "",
    "See [[Baby Safety Notes]].",
    "",
    "## All recipes",
    "",
    ...Object.keys(RECIPES).map((id) => `- [[Recipes/${recipeFileName(id).replace(/\.md$/, "")}]] · ${RECIPES[id].totalTime} min · ${RECIPES[id].meal}`),
  ];
  return lines.join("\n") + "\n";
}

// ----- Week notes -----
function buildWeek(week, weekIdx) {
  const lines = [
    "---",
    `week: ${weekIdx + 1}`,
    "tags: [meal-plan, week]",
    "---",
    "",
    `# ${week.label}`,
    "",
    "Up: [[Chef Marco - Meal Plan]]",
    "",
    "## Sunday Protein Prep",
    "",
    "Cook these three in parallel (oven + sous vide + stovetop). ~90 min active.",
    "",
    ...week.prepProteins.map((k) => `- [[Protein Prep/${prepFileName(k).replace(/\.md$/, "")}]]`),
    "",
    "## Schedule",
    "",
    "| Day | Breakfast | Lunch | Dinner |",
    "| --- | --- | --- | --- |",
  ];
  for (let i = 0; i < DAYS.length; i++) {
    const day = DAYS[i];
    const b = RECIPES[breakfastForDay(weekIdx, i)].name;
    const l = RECIPES[lunchForDay(weekIdx, i)].name;
    const d = RECIPES[week.dinners[day]].name;
    lines.push(`| ${day} | [[Recipes/${b}\\|${b}]] | [[Recipes/${l}\\|${l}]] | [[Recipes/${d}\\|${d}]] |`);
  }
  lines.push("");
  lines.push("## Shopping list");
  lines.push("");
  const seen = new Set();
  const ids = new Set([
    ...Object.values(week.dinners),
    ...DAYS.map((_, d) => lunchForDay(weekIdx, d)),
    ...DAYS.map((_, d) => breakfastForDay(weekIdx, d)),
  ]);
  for (const id of ids) {
    const r = RECIPES[id];
    lines.push(`### ${r.name}`);
    for (const ing of r.ingredients) {
      if (seen.has(ing)) continue;
      seen.add(ing);
      lines.push(`- [ ] ${ing}`);
    }
    lines.push("");
  }
  return lines.join("\n") + "\n";
}

// ----- Recipe note -----
function buildRecipe(id) {
  const r = RECIPES[id];
  const lines = [
    "---",
    `meal: ${r.meal}`,
    `total_time_min: ${r.totalTime}`,
    `active_time_min: ${r.activeTime}`,
    `diet: [${r.diet.join(", ")}]`,
    `tools: [${r.tools.join(", ")}]`,
    `baby_friendly: ${r.babyFriendly}`,
    `uses_prep: ${r.proteinKey ? `"${r.proteinKey}"` : "null"}`,
    "tags: [recipe, mediterranean, family]",
    "---",
    "",
    `# ${r.name}`,
    "",
    "Up: [[Chef Marco - Meal Plan]]",
    "",
    `**Total**: ${r.totalTime} min · **Active**: ${r.activeTime} min · **Serves**: ${r.servings}`,
    `**Diet**: ${r.diet.join(", ")} · **Tools**: ${r.tools.join(", ")}`,
  ];
  if (r.proteinKey) {
    lines.push("");
    lines.push(`**Uses prepped**: [[Protein Prep/${prepFileName(r.proteinKey).replace(/\.md$/, "")}]]`);
  }
  lines.push("");
  lines.push("## Ingredients");
  lines.push("");
  for (const ing of r.ingredients) lines.push(`- ${ing}`);
  lines.push("");
  lines.push("## Steps");
  lines.push("");
  r.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  lines.push("");
  lines.push("## 👶 Baby (10 mo) notes");
  lines.push("");
  lines.push("> [!warning] Baby modifications");
  lines.push(`> ${r.babyNotes}`);
  return lines.join("\n") + "\n";
}

// ----- Prep note -----
function buildPrep(key) {
  const p = PROTEIN_PREP[key];
  const lines = [
    "---",
    "type: prep",
    "tags: [protein-prep]",
    "---",
    "",
    `# ${p.label}`,
    "",
    "Up: [[Chef Marco - Meal Plan]]",
    "",
    `**Yield**: ${p.yield}`,
    "",
    "## Method",
    "",
    p.method,
    "",
    "## Used in",
    "",
    ...p.uses.map((id) => RECIPES[id] ? `- [[Recipes/${recipeFileName(id).replace(/\.md$/, "")}]]` : `- ${id} (no recipe yet)`),
  ];
  return lines.join("\n") + "\n";
}

function buildBabyNotes() {
  return `---
type: reference
tags: [baby, safety, blw]
---

# Baby Safety Notes (10-month-old)

Up: [[Chef Marco - Meal Plan]]

Standing rules applied to **every** baby portion in this vault:

- **No added salt.** Season the adult plates after the baby's portion is set aside.
- **No honey under 12 months** (botulism risk).
- **Avoid choking shapes**: whole grapes, nuts, hard raw veg, round meatballs, hot-dog rounds. Cut into pinch-size pieces or finger-length strips.
- **High-mercury fish**: limit tuna to ≤ 1×/week. Prefer salmon, cod, sardines.
- **Texture**: soft enough to squish between thumb and finger. Use [[Protein Prep/Cooked French lentils]] or mash if firmer.
- **New foods**: introduce one at a time, watch for reactions (you've said no known allergies — still applies for new exposures).
- **Open-cup practice** with assistance for smoothies and soups rather than bottle/pouch.
`;
}

// ----- Generate -----
fs.rmSync(OUT, { recursive: true, force: true });
ensureDir(OUT);

writeFile(path.join(OUT, "Chef Marco - Meal Plan.md"), buildMOC());
writeFile(path.join(OUT, "Baby Safety Notes.md"), buildBabyNotes());

WEEK_PLANS.forEach((w, i) => {
  writeFile(path.join(OUT, "Weeks", `Week ${i + 1}.md`), buildWeek(w, i));
});

for (const id of Object.keys(RECIPES)) {
  writeFile(path.join(OUT, "Recipes", recipeFileName(id)), buildRecipe(id));
}

for (const key of Object.keys(PROTEIN_PREP)) {
  writeFile(path.join(OUT, "Protein Prep", prepFileName(key)), buildPrep(key));
}

console.log("Wrote vault to", OUT);
