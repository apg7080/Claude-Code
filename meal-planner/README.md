# Chef Marco — 4-Week Family Meal Planner

A self-contained static web app that acts as a "professional chef" planning meals
for **2 adults + 1 10-month-old**, four weeks ahead.

## Profile this app was built for

- **Household**: 2 adults + 1 10-month-old
- **Allergies**: none
- **Diet emphasis**: Mediterranean · high-protein/low-carb · baby-led-weaning friendly
- **Cooking experience**: Intermediate
- **Tools**: sous vide / immersion blender / stand mixer (plus standard stovetop & oven)
- **Constraint**: every recipe ≤ 60 minutes total
- **Recipe source**: curated built-in library (no external API or API key required)

## What it gives you

1. **4 weekly meal plans** (Sunday → Saturday) with breakfast, lunch, and dinner.
2. **Sunday "protein prep" schedule** — three proteins cooked in ~90 min of parallel
   active time. Weeknight dinners reference these prepped proteins so 4 of 7
   dinners take 15–25 min.
3. **Baby (10 mo) notes** on every recipe with safe modifications:
   no added salt, no honey, BLW-appropriate shapes, choking-hazard guidance,
   mercury limits.
4. **Shopping list** generated per week.
5. Tools used by each recipe are surfaced (sous vide, immersion blender, stand
   mixer recipes are featured).

## Run it

It's a static site with no build step:

```sh
cd meal-planner
python3 -m http.server 8080
# open http://localhost:8080
```

Or just open `index.html` directly in your browser if your browser allows
local-file ES module loading. (Chrome blocks this — use the local server.)

## Files

- `index.html` — page shell
- `styles.css` — layout + theme
- `recipes.js` — curated recipe library + protein-prep definitions
- `app.js` — 4-week schedule, rendering, shopping list

## Why a curated library and not an API?

You chose "curated built-in library" when prompted. Each recipe is hand-picked
to satisfy three constraints simultaneously: Mediterranean +
high-protein/low-carb-leaning + safe for a 10-month-old doing baby-led weaning.
Recipe APIs (Spoonacular, Edamam) don't tag for BLW, so the curation is the
value here. To extend, add entries to `recipes.js` following the existing
schema — `babyNotes` is required.

## Standing rules for the baby's portion

These are baked into every recipe's notes:

- Season adult portions **after** plating; baby's portion gets none.
- **Never** honey under 12 months.
- Avoid choking shapes (whole grapes, nuts, hard raw veg, round meatballs).
  Cut into pinch-size or finger-length strips.
- Limit high-mercury fish — tuna ≤ 1×/week; prefer salmon/cod.
