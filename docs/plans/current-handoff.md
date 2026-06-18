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

## Verification

- Run focused core tests: `npm test -- src/core/actions.test.ts src/core/growth.test.ts` (Passed 21/21 tests across 2 test suites).
- Run full unit tests: `npm test` (Passed 29/29 tests across 6 test suites).
- Run production build: `npm run build` (Build completed successfully with zero compilation errors).
- Local HTTP check: `http://127.0.0.1:3000` returned status 200.
- Dev script check: `powershell -ExecutionPolicy Bypass -File ./run_dev.ps1 -Check` (Passed; no server started).
- NPM dev script check: `npm run dev -- -Check` (Passed; no server started).
- Dev script argument guard: unknown extra argument was rejected by the script parameter binding.
- Popup renderer regression test: `npm test -- src/ui/render.test.ts` (Passed 4/4 tests after RED/GREEN cycle).
- Production build after popup changes: `npm run build` (Completed successfully with zero compilation errors).
- Browser smoke review through Chrome headless/CDP: captured and inspected initial board, plot popup, and shop popup states; verified no action buttons render inside `.iso-tile` or `.sidebar` by default.

## Known Warnings Or Blockers

- Last commit: `dc08f79 feat: implement farm progression MVP`.
- Codex in-app browser plugin failed to initialize in this environment due `EPERM` while accessing `C:\Users\Hoang.H\AppData`; Chrome headless/CDP was used instead for browser smoke testing.

## Current Uncommitted Scope

- `docs/plans/2026-06-18-isometric-farm-board-ui-implementation.md`
- `docs/plans/task.md`
- `docs/plans/current-handoff.md`
- `docs/plans/index.md`
- `package.json`
- `run_dev.ps1`
- `src/main.ts`
- `src/styles/main.scss`
- `src/ui/render.ts`
- `src/ui/render.test.ts`
- `src/ui/viewModel.ts`
- `src/ui/viewModel.test.ts`

## Recommended Next Task

- Review the popup interaction in the regular browser session and commit the current UI/dev-script changes if approved.
