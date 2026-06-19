# Current Handoff

## Latest Completed Work

- Reviewed the completed Farm Progression MVP implementation for logic and workflow issues.
- Fixed crop care edge cases where watering or pest removal could revive crops that were already dead by timeout.
- Added `growthPausedMs` so active dry/pest conditions pause growth instead of letting crops grow normally until death.
- Added soil level gameplay effects: level 2 soil grows crops faster and extends water tolerance.
- Prevented already-unlocked plots from charging coins through the core `unlockPlot` action.
- Created `docs/plans/2026-06-18-isometric-farm-board-ui-implementation.md` for the next 2.5D/isometric UI pass.
- Converted the farm board to a 2.5D/isometric layout using DOM structure and SCSS classes.
- Added a shared readable tile content layer for locked, empty, and planted plots.
- Added renderer coverage for isometric board markup and the no-inline-style styling rule.
- Adjusted mobile isometric board sizing and removed global button hover transform that could conflict with transformed UI elements.
- Added `run_dev.ps1` to start Vite with fixed local host/port settings and reject arbitrary extra script arguments.
- Routed `npm run dev` through `run_dev.ps1` so the default dev command uses the controlled server path.
- Implemented `AppViewModel` and `createViewModel` mapping logic in `src/ui/viewModel.ts`.
- Implemented `renderApp` and `plotContent` DOM generator in `src/ui/render.ts`.
- Implemented CSS grid layouts, HSL gradient designs, and CSS keyframe animations for crop growth cycles in `src/styles/main.scss`.
- Wired game logic actions, browser event listener delegation, local storage auto-saving, and real-time tick cycles in `src/main.ts`.
- Completed an end-to-end automated browser smoke test covering seed purchase, planting, watering, growth phase updates, and harvesting.
- Moved plot action controls into a click-opened plot popup so the 2.5D board no longer has overlapping buttons on tiles.
- Moved seed shop and upgrade details into a click-opened shop popup, leaving the sidebar as a compact shop entry point.
- Added renderer regression coverage proving tile/sidebar controls stay out of the default board layout and only render inside popups.
- Created standalone crop art demos for CSS/SVG exploration, including `crop-svg-demo.html` and `crop-carrot-states-demo.html`.
- Installed and configured SVGO for SVG source-to-optimized asset workflow.
- Iterated the carrot states demo with smoother generated SVG leaf curves, explicit curved stems from a shared crown, a half-root carrot cap, and a separate brown dead-state stem style.
- Created `docs/plans/2026-06-19-crop-art-system-setup.md` for a reusable SCSS/native SVG crop art renderer with crop-owned 2.5D soil patches and stable state anchors.
- Reviewed and fixed the crop art setup plan for executable details: unique inline SVG gradient ids, nullable planted-plot fields, `noUnusedLocals` cleanup, Sass `@use` ordering, and removal of an unbacked `wet` soil state.
- Incorporated crop art polish constraints into the plan: shared `viewBox="0 0 240 180"` and `data-crop-anchor="120 132"` for future crops, non-scaling cartoon strokes, and `paint-order: stroke fill` on the carrot root cap.
- **Implemented Task 15 (Crop Art Type Boundary):** Created `src/ui/crop-art/cropArtTypes.ts` defining normalized crop art states, sanitizers, and crop interfaces.
- **Implemented Task 16 (Reusable 2.5D Soil Patch Renderer):** Created `src/ui/crop-art/soilPatch.ts` to render semantic 2.5D soil patch vector layers.
- **Implemented Task 17 (Carrot Crop SVG Renderer):** Created `src/ui/crop-art/carrotCrop.ts` rendering multi-state carrot SVG layers.
- **Implemented Task 18 (Public Crop Art Renderer):** Created `src/ui/crop-art/cropArt.ts` combining soil patches and plant layers under randomized gradient IDs.
- **Implemented Task 19 (Replace Placeholder Crop Markup):** Refactored `src/ui/render.ts` and `src/ui/render.test.ts` to replace old crop wrapper divs with the SVG `renderCropArt` helper.
- **Implemented Task 20 (Add SCSS Crop Art Foundation):** Created `src/styles/crop-art/_base.scss` and `src/styles/crop-art/_carrot.scss`, imported them at the top of `src/styles/main.scss`, and cleaned up the old CSS crop placeholders and keyframes.
- **Implemented Task 21 (Stabilize Crop Positioning):** Updated `.iso-tile__crop` positioning and transform in `src/styles/main.scss`, changed `.crop-plant` and `.crop-soil` SCSS to align transforms with SVG's `view-box` coordinate system and the stable `(120, 132)` anchor.
- **Implemented Task 22 (Add Focused Renderer Regression Coverage):** Wrote unit tests in `src/ui/crop-art/cropArt.test.ts` to verify no inline `style` attributes are emitted. Wrote integration tests in `src/ui/render.test.ts` verifying `soil-dry` and `has-pest` classes are correctly rendered on the SVG element.
- **Implemented Task 23 (Verify Build):** Verified successfully compiled production builds and local dev checks.

## Verification

- Run focused crop art unit tests: `npm test -- src/ui/crop-art/cropArt.test.ts` (Passed 8/8 tests across 4 test suites).
- Run focused board renderer tests: `npm test -- src/ui/render.test.ts` (Passed 6/6 tests).
- Run full unit tests: `npm test` (Passed 41/41 tests across 7 test suites).
- Run production build: `npm run build` (Sass and TypeScript compiled successfully with zero compiler warnings or errors).
- Local HTTP check: `http://127.0.0.1:3000` returned status 200.
- Dev script check: `powershell -ExecutionPolicy Bypass -File ./run_dev.ps1 -Check` (Passed; check finished without errors).

## Known Warnings Or Blockers

- Last commit: `2984354 fix: move farm controls into popups`.
- Codex in-app browser plugin failed to initialize in this environment due `EPERM` while accessing `C:\Users\Hoang.H\AppData`; Chrome headless/CDP was used instead for browser smoke testing.

## Current Uncommitted Scope

- `package.json` and `package-lock.json` include SVGO setup.
- `crop-carrot-states-demo.html`, `crop-svg-demo.html`, `crop-style-companion.html`, preview PNGs, and `demo-review/` contain local visual demo artifacts.
- `src/assets/crops/source/carrot.svg`, `src/assets/crops/optimized/carrot.svg`, and `svgo.config.mjs` contain the demo SVG optimization workflow.
- `docs/Crops/` and `.superpowers/` are untracked local exploration artifacts.
- `docs/plans/task.md` and `docs/plans/current-handoff.md` were updated for the crop art implementation.
- `docs/plans/2026-06-19-crop-art-system-setup.md` and `docs/plans/index.md` were added/updated for the crop art plan extension.
- `src/ui/crop-art/` contains the new crop art types (`cropArtTypes.ts`), soil patch renderer (`soilPatch.ts`), carrot SVG renderer (`carrotCrop.ts`), public API (`cropArt.ts`), and unit tests (`cropArt.test.ts`).
- `src/ui/render.ts` and `src/ui/render.test.ts` contain board-renderer integration changes.
- `src/styles/main.scss` and `src/styles/crop-art/` contain SCSS styles for the new crop art layers.

## Recommended Next Task

- Start implementing Task 24 (Implement Corn SVG Renderer And Styles) and Tasks 25-29 for the remaining crops (Potato, Pumpkin, Strawberry, Tomato, Wheat) to fully complete the new vector visual upgrade.
