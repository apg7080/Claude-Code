import { RECIPES, RECIPE_IDS, PROTEIN_PREP } from "./recipes.js";

// ----- Planner -----
// Strategy:
// 1. Each week has a "Sunday prep" that cooks 3 proteins for the week.
// 2. Dinners that depend on those proteins are scheduled Mon-Fri.
// 3. Sundays cook a fresh from-scratch dinner (no leftover protein).
// 4. Saturdays use a flexible recipe (often seafood — best fresh).
// 5. Each week's prep proteins rotate so menus don't repeat verbatim.

const DINNER_IDS = RECIPE_IDS.filter((id) => RECIPES[id].meal === "dinner");
const LUNCH_IDS = RECIPE_IDS.filter((id) => RECIPES[id].meal === "lunch");
const BREAKFAST_IDS = RECIPE_IDS.filter((id) => RECIPES[id].meal === "breakfast");

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

// Lunch & breakfast rotate — heavily reuse prep
function lunchForDay(weekIdx, dayIdx) {
  const rotation = [
    "greek_chicken_lunch_bowl",
    "tuna_salad_wraps",
    "mediterranean_chicken_wrap",
    "greek_chicken_lunch_bowl",
    "tuna_salad_wraps",
    "mediterranean_chicken_wrap",
    "greek_chicken_lunch_bowl",
  ];
  return rotation[(dayIdx + weekIdx) % rotation.length];
}

function breakfastForDay(weekIdx, dayIdx) {
  const rotation = [
    "greek_yogurt_bowl",
    "veggie_scramble",
    "egg_muffins",
    "smoothie_breakfast",
    "cottage_cheese_bowl",
    "egg_muffins",
    "veggie_scramble",
  ];
  return rotation[(dayIdx + weekIdx) % rotation.length];
}

// ----- Rendering -----
function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2).toLowerCase(), v);
    else node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}

function recipeCard(id, dayLabel) {
  const r = RECIPES[id];
  if (!r) return el("div", { class: "missing" }, `Missing: ${id}`);
  const card = el(
    "details",
    { class: "recipe-card" },
    el(
      "summary",
      {},
      el("span", { class: "day" }, dayLabel),
      el("span", { class: "name" }, r.name),
      el("span", { class: "time" }, `${r.totalTime} min`),
      r.proteinKey ? el("span", { class: "tag prep" }, "uses prep") : null,
      el("span", { class: "tag" }, r.meal),
    ),
    el(
      "div",
      { class: "card-body" },
      el(
        "div",
        { class: "meta" },
        el("strong", {}, "Total: "), `${r.totalTime} min`,
        el("span", { class: "sep" }, " · "),
        el("strong", {}, "Active: "), `${r.activeTime} min`,
        el("span", { class: "sep" }, " · "),
        el("strong", {}, "Serves: "), r.servings,
      ),
      el("p", { class: "diet" }, "Diet: " + r.diet.join(", ")),
      el("p", { class: "tools" }, "Tools: " + r.tools.join(", ")),
      el("h4", {}, "Ingredients"),
      el("ul", { class: "ingredients" }, ...r.ingredients.map((i) => el("li", {}, i))),
      el("h4", {}, "Steps"),
      el("ol", { class: "steps" }, ...r.steps.map((s) => el("li", {}, s))),
      el("div", { class: "baby-box" },
        el("strong", {}, "👶 Baby (10 mo) notes: "),
        document.createTextNode(r.babyNotes),
      ),
    ),
  );
  return card;
}

function prepBlock(week) {
  const items = week.prepProteins.map((key) => {
    const p = PROTEIN_PREP[key];
    return el(
      "div",
      { class: "prep-item" },
      el("h4", {}, p.label),
      el("p", { class: "method" }, p.method),
      el("p", { class: "yield" }, "Yield: " + p.yield),
    );
  });
  return el(
    "section",
    { class: "prep-block" },
    el("h3", {}, "🥘 Sunday Protein Prep (≈90 min total, parallel)"),
    el(
      "p",
      { class: "prep-intro" },
      "Cook these three proteins on Sunday afternoon. Working in parallel " +
        "(oven + sous vide + stovetop), total active time is ~90 min and saves 3-4 hrs " +
        "of weeknight cooking.",
    ),
    ...items,
  );
}

function shoppingList(week) {
  const ids = new Set([
    ...Object.values(week.dinners),
    ...Array(7).fill(0).map((_, d) => lunchForDay(0, d)),
    ...Array(7).fill(0).map((_, d) => breakfastForDay(0, d)),
  ]);
  const lines = [];
  for (const id of ids) {
    const r = RECIPES[id];
    if (!r) continue;
    lines.push(`# ${r.name}`);
    for (const ing of r.ingredients) lines.push(`  - ${ing}`);
  }
  return lines.join("\n");
}

function renderWeek(week, weekIdx) {
  const section = el("section", { class: "week" });
  section.appendChild(el("h2", {}, week.label));

  section.appendChild(prepBlock(week));

  const days = el("div", { class: "days" });
  for (let i = 0; i < DAYS.length; i++) {
    const day = DAYS[i];
    const dinnerId = week.dinners[day];
    const lunchId = lunchForDay(weekIdx, i);
    const breakfastId = breakfastForDay(weekIdx, i);

    const dayBox = el(
      "div",
      { class: "day-block" },
      el("h3", {}, day),
      recipeCard(breakfastId, "Breakfast"),
      recipeCard(lunchId, "Lunch"),
      recipeCard(dinnerId, "Dinner"),
    );
    days.appendChild(dayBox);
  }
  section.appendChild(days);

  // Shopping list
  const shopBtn = el("button", { class: "shop-btn", type: "button" }, "Show shopping list");
  const shopBox = el("pre", { class: "shopping hidden" });
  shopBtn.addEventListener("click", () => {
    if (shopBox.classList.contains("hidden")) {
      shopBox.textContent = shoppingList(week);
      shopBox.classList.remove("hidden");
      shopBtn.textContent = "Hide shopping list";
    } else {
      shopBox.classList.add("hidden");
      shopBtn.textContent = "Show shopping list";
    }
  });
  section.appendChild(shopBtn);
  section.appendChild(shopBox);

  return section;
}

function renderProfile() {
  return el(
    "section",
    { class: "profile" },
    el("h2", {}, "Your Profile"),
    el(
      "ul",
      {},
      el("li", {}, "Household: 2 adults + 1 10-month-old"),
      el("li", {}, "Allergies: none"),
      el("li", {}, "Diet emphasis: Mediterranean · high-protein/low-carb · baby-led-weaning friendly"),
      el("li", {}, "Cooking experience: Intermediate"),
      el("li", {}, "Tools available: sous vide, immersion blender, stand mixer (plus standard stovetop/oven)"),
      el("li", {}, "Cap: every recipe ≤ 60 minutes"),
    ),
    el(
      "div",
      { class: "ground-rules" },
      el("h3", {}, "Standing rules for the baby's portion"),
      el(
        "ul",
        {},
        el("li", {}, "No added salt — season adult portions after plating."),
        el("li", {}, "No honey under 12 months."),
        el("li", {}, "Avoid choking shapes (whole grapes, nuts, hard raw veg, round meatballs)."),
        el("li", {}, "Cut food into pinch-size or finger-length strips for self-feeding."),
        el("li", {}, "Limit high-mercury fish (tuna ≤ 1×/week, prefer salmon/cod)."),
      ),
    ),
  );
}

function render() {
  const root = document.getElementById("app");
  root.innerHTML = "";
  root.appendChild(renderProfile());

  const tabs = el("div", { class: "tabs" });
  const panels = el("div", { class: "panels" });
  WEEK_PLANS.forEach((week, idx) => {
    const tab = el("button", { class: "tab", type: "button" }, `Week ${idx + 1}`);
    const panel = renderWeek(week, idx);
    panel.classList.add("panel");
    if (idx !== 0) panel.classList.add("hidden");
    else tab.classList.add("active");
    tab.addEventListener("click", () => {
      tabs.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      panels.querySelectorAll(".panel").forEach((p) => p.classList.add("hidden"));
      tab.classList.add("active");
      panel.classList.remove("hidden");
    });
    tabs.appendChild(tab);
    panels.appendChild(panel);
  });
  root.appendChild(tabs);
  root.appendChild(panels);
}

render();
