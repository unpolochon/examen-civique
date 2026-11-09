# Civique - examen carte de résident

Installable PWA to prepare the French civic exam (carte de résident). No backend. Specs live in `specs/001-examen-civique-cr/` (spec, plan, tasks).

## Commands

- `npm run dev`: dev server.
- `npm run build`: type-check (`tsc -b`) and build to `dist/`.
- `npm run preview`: serve `dist/` on port 4173.
- `npm test`: Vitest unit tests.
- `npm run lint`: ESLint.
- `npm run e2e`: Playwright (iPhone 13 WebKit, Pixel 7 Chromium) against the built app. First run: `npx playwright install chromium webkit`.
- `npm run icons`: regenerate the PNG icons in `public/` from `public/icon.svg`.

## Structure (target, from plan.md)

```text
content/
  questions/<theme>.json        # questions
  lessons/<theme>/<lecon>.md    # lessons
data/official/cr-questions.json # raw official list, reference only
scripts/                        # content validation and checks
src/
  domain/                       # pure logic, unit tested (exam, plan, srs, storage)
  screens/                      # one file per screen
  App.tsx
  styles.css
e2e/                            # Playwright tests
```

## Rules

- UI copy is in French.
- Design tokens are in `specs/001-examen-civique-cr/plan.md` (Palette).
- The app is hosted on GitHub Pages under a sub-path: keep `base: './'` and use a hash router.
- Never use the em dash character.
