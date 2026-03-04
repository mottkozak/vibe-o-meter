# Codex build prompt

Use this prompt as the single instruction set for building the app.

---

You are an expert frontend engineer. Build a complete, working Vite + React + TypeScript app for this repo.

**CRITICAL:** The repo already contains specifications in `/docs/*.md` and data in `/public/data/*.json`. Treat those as the single source of truth. Do NOT invent alternate scoring logic, axis names, quadrant names, or data formats. If something is missing, implement the app in a way that fails gracefully with a clear UI error message.

**READ FIRST** (in this order; must follow):

1. docs/README.md  
2. docs/product-brief.md  
3. docs/data-contracts.md  
4. docs/scoring.md  
5. docs/ui-spec.md  
6. docs/deploy.md  
7. docs/TODO.md  

**DATA REQUIREMENTS:**

- Load all quiz content at runtime via fetch from:
  - `${import.meta.env.BASE_URL}data/compasses.json`
  - `${import.meta.env.BASE_URL}data/questions.json`
  - `${import.meta.env.BASE_URL}data/type-titles.json`
  - `${import.meta.env.BASE_URL}data/quadrant_writeups.json`
- If present, load `${import.meta.env.BASE_URL}data/results-content.json` for disclaimer and results-page copy; use sensible defaults if missing.
- Do not hardcode questions, compass definitions, type titles, or quadrant writeups in components.

**HOSTING REQUIREMENTS (GitHub Pages):**

- Repo name is **vibe-o-meter**.
- Configure Vite base path in vite.config.ts as: `base: "/vibe-o-meter/"`
- Ensure all asset and fetch paths work under that base path.

**APP ROUTES (React Router):**

- `/` — Landing page with disclaimer + Start button  
- `/quiz` — Multi-step quiz flow (5 sections × 6 questions = 30 total)  
- `/results` — Results page  

**QUIZ UX REQUIREMENTS:**

- Show current compass section name and question progress (e.g., "Order Compass — 2 of 6").
- Show global progress (e.g., "8 / 30").
- Each question has 4 answer buttons.
- Users can go back to previous questions and change answers.
- Persist answers in app state while navigating routes.
- Provide a Restart button (clears state and returns to landing).

**SCORING & RESULTS** (must match docs/scoring.md):

- Maintain scores for all 10 axes in state (VW, HG, KP, RJ, SC, ST, PT, QR, GP, MA).
- Each selected answer applies its `delta` to axis scores.
- Determine 5 compass quadrants using sign of x/y axes as defined in docs/scoring.md.
- Generate the 6-letter type code using the 6 axes: VW, HG, KP, RJ, SC, MA  
  - positive ⇒ first letter, negative ⇒ second letter.
- Determine the 64-type title using:
  - `familyKey` = first two letters of the type code (VH/WH/VG/WG)
  - index from the remaining four letters using bit order KP, RJ, SC, MA  
  - `index = bit(KP) + 2*bit(RJ) + 4*bit(SC) + 8*bit(MA)`
  - `title = families[familyKey].titles16[index]`

**RESULT WRITE-UP GENERATION:**

- Implement a template generator in `src/lib/resultGenerator.ts` that composes the results from the 20 quadrant writeups:
  - Use Power compass writeup as the main narrative anchor.
  - Merge strengths and pitfalls from the 5 quadrant writeups, de-dupe (case-insensitive), cap list sizes (strengths ≤ 9, watchouts ≤ 8).
  - Merge celebs from all 5 quadrant writeups, de-dupe, cap ≤ 10.
  - Show the Power quadrant one-liner prominently.
  - Compute a confidence score per compass: abs(x)+abs(y) normalized to 0..100 (treat 24 as 100% unless docs specify otherwise).

**RESULTS PAGE UI REQUIREMENTS:**

- Show:
  - Archetype Title  
  - 6-letter Type Code  
  - One-liner  
  - 5 compass quadrant labels (Power/Order/Discipline/Social/Risk)  
  - Strengths bullets  
  - Watchouts bullets  
  - Famous vibe matches list  
  - 5 mini 2D compass charts, each with axis labels and a dot at the x,y score position  
- Add a small disclaimer; source the text from `results-content.json` (or equivalent copy data), or use a default if missing.

**CODE QUALITY REQUIREMENTS:**

- Put scoring logic in `src/lib/scoring.ts`.
- Put data loading in `src/lib/loadData.ts` (with caching in memory).
- Use strong TypeScript types for axes, compasses, questions, deltas, and results.
- Handle missing/invalid JSON with a user-friendly error screen.
- Keep styling simple but clean; no heavy UI frameworks required (plain CSS or minimal utility classes is fine). Do not add extra dependencies unless necessary.

**DEPLOYMENT REQUIREMENTS:**

- Add `.github/workflows/deploy.yml` that builds and deploys `/dist` to GitHub Pages on push to main.
- Ensure `npm run build` works and output is in `dist/`.

**DELIVERABLES:**

- All required files created/updated.
- App runs with `npm install` and `npm run dev`.
- App builds with `npm run build`.
- GitHub Pages deploy workflow present.
- No backend services.

After implementing, provide a short summary of what you built and where key logic files live (loadData, scoring, resultGenerator).
