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
| **Task 40: Prepare One Inline SVG Candidate For Per-Part Animation** | [x] | [Superseded] Superseded by Lasso masked layer tracing (Task 60). |
| **Task 41: Demo Per-Part Animation With Inline SVG** | [x] | [Superseded] Superseded by Lasso masked layer tracing (Task 60). |
| **Task 42: Decide Whether To Replace The Procedural Corn Renderer** | [x] | [Superseded] Superseded by Lasso masked layer tracing (Task 60). |
| **Task 43: Tune VTracer Presets For Higher Quality** | [x] | Updated vtracer-presets.json with higher color precision, lower speckle filtering, and smoother gradients. |
| **Task 44: Re-run Batch Conversion For Corn** | [x] | Executed batch conversion using all updated presets (gameClean, gameDetailed, animationCandidate, tinyRuntime). |
| **Task 45: Update Review Page And Verify Visual Details** | [x] | Regenerated review.html and confirmed Stage03 has options ranging from tinyRuntime (215KB, 511 paths) up to gameDetailed (962KB, 5482 paths). |
| **Task 46: Integrate Vite Middleware API** | [x] | [Superseded by Task 60] Add api endpoints for listing crops, running VTracer CLI live, and saving selected SVGs. |
| **Task 47: Create HTML Crop Editor UI Layout** | [x] | [Superseded by Task 60] Implement crop-editor.html and editor.scss with responsive layout, stages panel, and sliders. |
| **Task 48: Implement Client-side Logic and Validation** | [x] | [Superseded by Task 60] Write src/editor.ts to handle tracing requests, validation checking, warning display, and save mapping. |
| **Task 49: Verify HTML Crop Editor E2E** | [x] | [Superseded by Task 60] Test the entire flow from PNG selection, custom parameter tuning, duplicate validation, to saving crop files. |
| **Task 50: Implement Crop Editor Cleanup Drafts Script** | [x] | Created scripts/vtracer/cleanup.mjs and clear_drafts.bat to clear crop generated directories. |
| **Task 51: Crop Animation Editor Plan** | [x] | Created a focused plan for a separate crop-level animation editor with grouped SVG outputs. |
| **Task 52: Implement Crop Animation Editor Navigation And Shell** | [x] | Added one crop editor button and a separate crop-animation-editor page with crop-level stage selection. |
| **Task 53: Implement SVG Group Classify And Edit Tools** | [x] | Added middleware, classifier, group operations, overlay/solo review, animation presets, preview, and save workflow. |
| **Task 54: Verify Crop Animation Editor Flow** | [x] | Ran focused unit tests, production build, and browser smoke for classify, preview, navigation, and save. |
| **Task 55: Implement Auto Trace Crops Script** | [x] | Created scripts/vtracer/auto-trace-crops.mjs and auto_trace.bat to trace all crops automatically. |
| **Task 56: Add Pivot Review And Editing** | [x] | Added selected-group pivot presets, percent controls, preview marker, transform-origin preview, and saved pivot metadata. |
| **Task 57: Add Crop Switcher To Animation Editor** | [x] | Added a crop dropdown to crop-animation-editor so users can switch crops without returning to crop-editor. |
| **Task 58: Crop Animation Editor Visual Grouping** | [x] | Completed visual drag selection, stable path IDs, CTM transformation, and path removal with legacy restores. Added Photoshop-like Lasso freeform selection tool with Point-in-Polygon checks. Verified via unit tests, build checks, and browser smoke test. |
| **Task 59: Fix Crop Editor Partial Stage Save** | [x] | Fixed crop-editor save so saving one stage merges with existing stage mappings instead of removing older stage SVG references. |
| **Task 60: Replace Crop Editor Full PNG Trace Workflow** | [x] | Replaced full-PNG VTracer candidates with lasso masked layer tracing and one layered SVG save workflow. |
| **Task 61: Compact Crop Editor Source Panel** | [x] | Removed the top PNG image preview and compacted source/parameter controls so the lasso layer workspace has priority. |
| **Task 62: Prioritize Crop Editor Lasso Workspace** | [x] | Reduced the PNG source panel to a dropdown, added collapsible VTracer parameters, and expanded the lasso workspace. |
| **Task 63: Plan Obsolete Planning Cleanup** | [x] | Created a short cleanup plan for archiving or removing stale task and plan entries from the old workflow. |
| **Task 64: Review Layer Trace UX In Browser** | [x] | Reviewed Lasso Layer Trace UX, identified need for layer reordering, and proposed Drag-and-Drop + Buttons. |
| **Task 65: Implement Layer Reordering (Drag-and-Drop + Buttons)** | [x] | Implemented HTML5 drag-and-drop and up/down sort buttons for z-order reordering of layers with live preview updates. |
| **Task 66: Add VTracer Preset Selector to Crop Editor** | [x] | Added preset selector select box to VTracer parameter header, loaded presets, and synchronized with sliders and live trace. |
| **Task 67: Implement Layer Rename Functionality** | [x] | Added inline rename input triggers (double-click and edit icon) for layer names, updating data array, and re-rendering list and preview. |
| **Task 68: Fix Layer Composite Preview Scaling** | [x] | Fixed SVG scaling in composite preview container by adding object-fit contain, width/height 100% styles, and making grid layout columns symmetrical to match canvas constraints. |
| **Task 69: Remove Legacy Auto Trace Workflow** | [x] | Removed the full-PNG auto trace batch file, Node script, and npm script now superseded by lasso layer tracing. |
| **Task 70: Edit Saved Layered Stages** | [x] | Added saved-stage SVG parsing and sidebar loading so old layers can be renamed, reordered, deleted, extended, and saved again. |
| **Task 71: Add Layer Visibility Toggle** | [x] | Added eye toggle controls so layers can be hidden or shown in the composite preview without deleting or omitting them from saved output. |
| **Task 72: Add Layer Duplicate Button** | [x] | Added a duplicate control to layer rows so users can clone an existing SVG layer with a fresh group ID. |
| **Task 73: Remove Layer Sort Buttons** | [x] | Removed manual up/down layer buttons because drag-and-drop now owns layer reordering. |
| **Task 74: Add Source Image Zoom For Lasso** | [x] | Added source-canvas zoom controls for more precise lasso cutting while preserving original image data and coordinates. |
| **Task 75: Fix Lasso Zoom Controls Position** | [x] | Kept zoom controls fixed above the lasso viewport while only the canvas content scrolls. |
| **Task 76: Add hybrid preset UI option and client logic** | [x] | Add Hybrid (Detailed + Animation) option, disable sliders when active, and send preset in payload. |
| **Task 77: Implement hybrid trace backend logic** | [x] | Run VTracer twice for Candidate & Detailed presets, extract/merge paths, and optimize. |
| **Task 78: Verify build and user manual review** | [x] | Verify Vite production build and prepare for user manual smoke test. |
| **Task 79: Fix Hybrid Preset Review Issues** | [x] | Align hybrid server presets with UI trace defaults and restore Custom slider editing after Hybrid. |
| **Task 80: Embedded Controls HTML Cleanup** | [x] | Remove static Animation and Pivot panel sections from crop-animation-editor.html. |
| **Task 81: Embedded Controls SCSS Layout** | [x] | Add SCSS layout for embedded controls inside group rows and visibility toggle based on active class. |
| **Task 82: Embedded Controls TS Logic and Event Wiring** | [x] | Populate dynamic selectors/inputs inside renderGroupList and wire up events dynamically in animation-editor.ts. |
| **Task 83: Verify build and manual review** | [x] | Verify Vite production build and prepare for user manual smoke test. |
| **Task 84: Remove Obsolete Selection and Group Actions from HTML** | [x] | Removed Selection HTML panel and Split/Merge buttons from crop-animation-editor.html. |
| **Task 85: Clean Up SCSS Styles for Selection Tools** | [x] | Removed obsolete SCSS rules for selection, overlay, and pivot-grid styles. |
| **Task 86: Remove Selection, Merge and Split Logic from TS** | [x] | Cleared selection state, pointer/drag logic, split/merge event handlers, and unused variables. |
| **Task 87: Verify build and user review** | [x] | Verified successful production build and ran Vitest suites (77/77 passing). |
| **Task 88: Add Part Preview Button and Logic in TS** | [x] | Added dynamic Stop/Preview (▶/⏹) and Show/Hide (👁) icon-only buttons per layer row in renderGroupList and handled soloPreviewGroupId state. |
| **Task 89: Update Animation SCSS Selectors** | [x] | Modified SCSS to trigger keyframes on .is-animating class and parent is-previewing-animation class. |
| **Task 90: Verify build, tests, and manual preview** | [x] | Compiled production build successfully and confirmed all Vitest suites passed. |
| **Task 91: Fix SVG Path Bounds Regex and Command Loops** | [x] | Improve path bounds parsing regex for dot-decimals and protect against NaN in command loops. |
| **Task 92: Implement Dynamic Pivot Marker Bounds in TS** | [x] | Query getBBox() from DOM groups in renderPivotMarker with static bounds fallback. |
| **Task 93: Verify Build and Tests** | [x] | Compile production bundle and ensure all unit tests pass. |
| **Task 94: Add Collapse Arrow for Layer Rows** | [x] | Added collapse arrow (▼) inside header line of select button and implemented click toggle to close/open. |
| **Task 95: Fix Animation Editor State Preservation on Save and Stage Switch** | [x] | Store animations metadata globally and read from it in selectStage to preserve settings. |
| **Task 96: Add Motion Sliders UI to Card Details** | [x] | Added duration, delay, angle, Y-offset, and scale sliders inside expanded layer cards. |
| **Task 97: Implement Motion Metadata Reading and Writing** | [x] | Load motion config from animations metadata and serialize it into saved stage parts. |
| **Task 98: Apply CSS Variables to Preview Elements Dynamically** | [x] | Apply --anim-* custom properties directly to SVG group elements during preview edits. |
| **Task 99: Update SCSS Animation Keyframes to use CSS Variables** | [x] | Refactored sway, bob, and breathe keyframes to read CSS custom properties with fallbacks. |
| **Task 100: Verify Build and Dynamic Customization visually** | [x] | Verified focused tests, production build, and browser smoke for live motion slider updates. |
| **Task 101: Fix Motion Save Cache Review Issue** | [x] | Ensure first save records the newly created grouped SVG file in the animation metadata cache. |
| **Task 102: Add Selected Layer Bounds Outline** | [x] | Added a padded SVG bounds outline for the selected animation layer in the preview. |
| **Task 103: Temporarily Hide Suggest Candidates Button** | [x] | Hide the Animation Editor Suggest Candidates button without removing its existing logic. |
