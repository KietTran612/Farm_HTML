# Task Tracker

| Task | Status | Notes |
|---|---|---|
| **Task 0: Farm MVP Design Spec** | [x] | Created `docs/plans/2026-06-18-farm-progression-mvp-design.md` for the Progression Farming MVP. |
| **Task 1: Project Agent Rules** | [x] | Updated `AGENTS.md` for Farm_HTML paths, web/TypeScript validation, and task tracker format. |
| **Task 2: Planning Workflow Files** | [x] | Created `docs/plans/task.md`, `docs/plans/current-handoff.md`, and `docs/plans/index.md`. |
| **Task 3: Review MVP Design Spec** | [x] | Approved the Progression Farming MVP design for implementation planning. |
| **Task 4: Farm MVP Implementation Plan** | [x] | Created and split the implementation plan into one short index plus four phase files under `docs/plans/`. |
| **Task 5: Execute Phase 0 Scaffold And Data** | [x] | Completed Vite/TypeScript project scaffold, static crop/progression data, and initial state implementation. |
| **Task 6: Execute Phase 1 Core Gameplay** | [x] | Completed derived growth logic, gameplay actions, and XP progression logic with unit tests. |
| **Task 7: Execute Phase 2 Persistence** | [x] | Completed LocalStorageSaveRepository boundary and implementation with unit tests. |
| **Task 8: Execute Phase 3 UI And Wiring** | [x] | Completed view model, DOM renderer, SCSS styles, app event wiring, and verified gameplay loops in the browser. |
| **Task 9: Isometric Farm Board UI Plan** | [x] | Created a focused plan for converting the farm board to 2.5D/isometric DOM + SCSS. |
| **Task 10: Execute Isometric Farm Board UI** | [x] | Converted the farm board to 2.5D/isometric DOM + SCSS and fixed review issues in tile content/readability. |
| **Task 11: Controlled Dev Server Script** | [x] | Added `run_dev.ps1` and routed `npm run dev` through fixed local Vite host/port settings. |
| **Task 12: Move Tile And Shop Controls To Popups** | [x] | Moved plot actions and shop contents into click-opened popup panels to avoid overlap on the 2.5D board. |
| **Task 13: Procedural Carrot Crop Demo** | [x] | Created and iterated the standalone 2.5D SVG carrot crop states demo with smoother connected leaves and half-root presentation. |
| **Task 14: Crop Art System Setup Plan** | [x] | Created the implementation plan for reusable SCSS/native SVG crop art with crop-owned 2.5D soil patches. |
| **Task 15: Add Crop Art Type Boundary** | [x] | Add crop art types, state normalization and sanitizer functions with tests. |
| **Task 16: Add Reusable 2.5D Soil Patch Renderer** | [x] | Add soilPatch.ts and renderSoilPatch function with tests. |
| **Task 17: Add Carrot Crop SVG Renderer With Stable Anchors** | [x] | Add carrotCrop.ts and renderCarrotCrop function with tests. |
| **Task 18: Add Public Crop Art Renderer** | [x] | Add cropArt.ts and renderCropArt function with tests. |
| **Task 19: Replace Placeholder Crop Markup In Board Renderer** | [x] | Modify render.ts and render.test.ts to use renderCropArt. |
| **Task 20: Add SCSS Crop Art Foundation** | [x] | Add base and carrot SCSS partials and import into main.scss. |
| **Task 21: Stabilize Crop Positioning Inside 2.5D Tiles** | [x] | Align crop-art and crop-plant transforms to stable 2.5D board baseline. |
| **Task 22: Add Focused Renderer Regression Coverage** | [x] | Add no-inline-style and dry/pest class integration unit tests. |
| **Task 23: Verify Build And Focused Browser Smoke** | [x] | Verify successful production build and manual/automated browser smoke checks. |
| **Task 24: Implement Corn SVG Renderer And Styles** | [x] | Register corn and add SVG renderer and sway SCSS with tests. |
| **Task 25: Implement Potato SVG Renderer And Styles** | [x] | Register potato and add SVG renderer and tuber SCSS with tests. |
| **Task 26: Implement Pumpkin SVG Renderer And Styles** | [x] | Register pumpkin and add SVG renderer and orange fruit SCSS with tests. |
| **Task 27: Implement Strawberry SVG Renderer And Styles** | [x] | Register strawberry and add SVG renderer and red berries SCSS with tests. |
| **Task 28: Implement Tomato SVG Renderer And Styles** | [x] | Register tomato and add SVG renderer and tall bush SCSS with tests. |
| **Task 29: Implement Wheat SVG Renderer And Styles** | [x] | Register wheat and add SVG renderer and golden ears SCSS with tests. |
| **Task 30: Update Handoff And Commit On Approval** | [x] | Update task tracker, current handoff and ready for user commit. |
| **Task 31: Review And Polish Crop Art Review UI** | [x] | Fixed review page visual spacing, mobile overflow, animation toggling, soil detail, and crop art contracts. |
| **Task 32: Corn VTracer SVG Demo Review** | [x] | Reviewed exported corn SVG weights and created a standalone 2.5D demo using the VTracer outputs. |
| **Task 33: Add Corn VTracer Demo Animation** | [x] | Added visible crop sway, state pop, soil breathing, and active-state progress animation to the standalone corn demo. |
| **Task 34: VTracer CLI Crop Pipeline Plan** | [x] | Created a setup and usage plan for local VTracer CLI conversion, SVG optimization, metrics, and per-part animation preparation. |
| **Task 35: Auto Setup And Verify VTracer CLI** | [x] | Added setup/check scripts, package.json entries, and verified CLI is callable. |
| **Task 36: Add Repeatable VTracer Presets** | [x] | Created presets JSON, added SVG metrics helper, and verified with unit tests. |
| **Task 37: Convert One PNG With Preset, Optimize, And Report** | [x] | Created single-image converter script, generated stage03 corn SVG outputs, and verified SVGO. |
| **Task 38: Batch Convert One Crop Folder** | [x] | Created batch conversion script and ran it successfully on Corn PNG folder. |
| **Task 39: Review Each PNG And Choose The Right Export Preset** | [x] | Generated review.html and documented chosen presets in _preset-review.md. |
| **Task 40: Prepare One Inline SVG Candidate For Per-Part Animation** | [/] | Implement inline prep script, prefix internal IDs, and manually classify corn parts. |
| **Task 41: Demo Per-Part Animation With Inline SVG** | [ ] | Create corn-vtracer-parts-demo.html showing independent CSS-animated crop parts. |
| **Task 42: Decide Whether To Replace The Procedural Corn Renderer** | [ ] | Compare visual quality, path count, and compile a final integration decision. |
| **Task 43: Tune VTracer Presets For Higher Quality** | [x] | Updated vtracer-presets.json with higher color precision, lower speckle filtering, and smoother gradients. |
| **Task 44: Re-run Batch Conversion For Corn** | [x] | Executed batch conversion using all updated presets (gameClean, gameDetailed, animationCandidate, tinyRuntime). |
| **Task 45: Update Review Page And Verify Visual Details** | [x] | Regenerated review.html and confirmed Stage03 has options ranging from tinyRuntime (215KB, 511 paths) up to gameDetailed (962KB, 5482 paths). |
| **Task 46: Integrate Vite Middleware API** | [x] | Add api endpoints for listing crops, running VTracer CLI live, and saving selected SVGs. |
| **Task 47: Create HTML Crop Editor UI Layout** | [x] | Implement crop-editor.html and editor.scss with responsive layout, stages panel, and sliders. |
| **Task 48: Implement Client-side Logic and Validation** | [x] | Write src/editor.ts to handle tracing requests, validation checking, warning display, and save mapping. |
| **Task 49: Verify HTML Crop Editor E2E** | [x] | Test the entire flow from PNG selection, custom parameter tuning, duplicate validation, to saving crop files. |
| **Task 50: Implement Crop Editor Cleanup Drafts Script** | [x] | Created scripts/vtracer/cleanup.mjs and clear_drafts.bat to clear crop generated directories. |
| **Task 51: Crop Animation Editor Plan** | [x] | Created a focused plan for a separate crop-level animation editor with grouped SVG outputs. |
| **Task 52: Implement Crop Animation Editor Navigation And Shell** | [ ] | Add one button from crop editor and create crop-animation-editor.html with crop-level stage selection. |
| **Task 53: Implement SVG Group Classify And Edit Tools** | [ ] | Add classifier, group operations, overlay/solo review, relabel, merge, split, and save workflow. |
| **Task 54: Verify Crop Animation Editor Flow** | [ ] | Run focused unit tests, build, and browser smoke for classify, group editing, preview, and save. |
| **Task 55: Implement Auto Trace Crops Script** | [x] | Created scripts/vtracer/auto-trace-crops.mjs and auto_trace.bat to trace all crops automatically. |
