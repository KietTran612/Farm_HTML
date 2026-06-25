# Task Tracker

| Task | Status | Notes |
|---|---|---|
| **Task 100: Verify Build and Dynamic Customization visually** | [x] | Verified focused tests, production build, and browser smoke for live motion slider updates. |
| **Task 101: Fix Motion Save Cache Review Issue** | [x] | Ensure first save records the newly created grouped SVG file in the animation metadata cache. |
| **Task 102: Add Selected Layer Bounds Outline** | [x] | Added a padded SVG bounds outline for the selected animation layer in the preview. |
| **Task 103: Temporarily Hide Suggest Candidates Button** | [x] | Hide the Animation Editor Suggest Candidates button without removing its existing logic. |
| **Task 104: Compact Planning Context** | [x] | Reduced active task, handoff, and plan index noise while preserving detailed plans as historical references. |
| **Task 105: Compact Crop Editor Trace Step** | [x] | Reduced the Step 3 trace panel height and spacing so the lasso mask workspace fits better in the current window. |
| **Task 106: Add Draggable Pivot Marker** | [x] | Allow dragging the selected layer pivot marker directly on the Animation Editor SVG preview. |
| **Task 107: Prune Missing Animation Layers On Save** | [x] | Remove animation part configs whose group IDs no longer exist in the saved grouped SVG. |
| **Task 108: Sync Existing Animated Crop Data** | [x] | Audited existing animated crop data and refreshed stale Potato Stage 01 grouped SVG from the current Crop Editor source layer SVG. |
| **Task 109: Show Relevant Motion Controls Only** | [x] | Animation Editor now shows only sliders used by the selected animation preset. |
| **Task 110: Reorder Layer Pivot Controls** | [x] | Moved Pivot Point above Animation in each Animation Editor layer card without changing logic. |
| **Task 111: Compact Animation Editor Layer Workflow** | [x] | Replaced stage cards with a stage dropdown, moved layer editing into a dedicated properties panel, and added save validation/dirty-stage guarding. |
| **Task 112: Adjust Animation Editor Columns and Fix Encoding** | [x] | Moved Layer Properties adjacent to Layer Browser, moved SVG preview to the end, replaced mangled UTF-8 text with unicode escapes, and resolved a CSS syntax duplicate. |
| **Task 113: Implement Merge Layers in Crop Editor** | [x] | Added Merge Mode to crop-editor with selection highlight, gradient ID collision handling, and canvas protection. |
| **Task 114: Load Existing Stage SVG on Stage Select** | [x] | Updated Crop Editor stage select event listener to load existing stage SVG data instead of just rendering preview. |
| **Task 115: Add Folder Selection in Crop Editor** | [x] | Added dynamic folder select next to PNG select in Crop Editor, supporting recursive folder scanning and default root selection. |
| **Task 116: Fix Editor Warnings and TypeScript Config for Scripts** | [x] | Configured TypeScript and Node types for the scripts directory and resolved the Buffer type-checking conflict. |
| **Task 117: Fix Sass Color Function Warning** | [x] | Replaced the remaining deprecated `lighten()` call in editor SCSS with `color.adjust()`. |
| **Task 118: Implement Brush Mask Helper and Unit Tests (TDD)** | [x] | Created brushMask helper file, wrote and verified unit tests, and resolved TS compilation errors. |
| **Task 119: Update HTML UI Layout with Floating Toolbar** | [x] | Replaced old zoom controls with the new integrated floating toolbar in HTML. |
| **Task 120: Implement Floating Toolbar Styling (SCSS)** | [x] | Added SCSS styles for the new floating toolbar and brush size slider. |
| **Task 121: Implement Brush and Eraser Drawing Logic (TypeScript)** | [x] | Connected toolbar buttons, handled brush size input, and implemented high-performance drawing strokes on offscreen canvas. |
| **Task 122: Implement Focus Mode and Keyboard Shortcuts** | [x] | Implemented expanded focus mode layout, viewport recalculations via requestAnimationFrame, and keyboard shortcuts. |
| **Task 123: Move Crop Selector to Main Workspace Row** | [x] | Moved the crop selector from the header to the main selector row (crop > folder > image) and enabled first-crop default loading. |
| **Task 124: Install ag-psd Dependency** | [x] | Installed ag-psd client-side library to decode Photoshop documents in the browser. |
| **Task 125: Implement PSD Parser Helpers** | [x] | Implemented src/layer-trace/psdParser.ts with recursive flattening and full-sized coordinate canvas drawing. |
| **Task 126: Add PSD Parser Helper Unit Tests** | [x] | Wrote src/layer-trace/psdParser.test.ts verifying layout flattening and canvas rendering offsets (2/2 passing). |
| **Task 127: Update HTML UI Layout with PSD Controls** | [x] | Integrated Input Mode Switcher and Photoshop PSD workspace inside crop-editor.html. |
| **Task 128: Implement PSD UI and Batch Tracing Logic** | [x] | Implemented PSD file drops, downscaled 48px thumbnails, progress bars, and index-reversed batch VTracer API requests in src/editor.ts. |
| **Task 129: Add PSD Importer CSS Styling** | [x] | Styled switcher tabs, dashed glassmorphic dropzones, layer rows, thumbnail frames, status indicators, and animated progress bars in editor.scss. |
| **Task 130: Verify PSD Importer and Lasso/Brush Regression** | [x] | Verified zero typecheck errors, 5/5 passing layer-trace unit tests, successful production build, and added safety guards. |
| **Task 131: Add Browser Debug Config** | [x] | Added VS Code debug configs that launch Crop Editor and Animation Editor through the Vite dev server instead of running TS files directly in Node. |
| **Task 132: Implement PSD Downscale Ratio Selector** | [x] | Added resolution ratio selector (default 1024x1024) and client-side canvas scaling to optimize SVG output size. |
| **Task 133: Implement PSD Layer Visibility Syncing** | [x] | Map PSD layer visibility to the editor's workspace layer hidden state and preserve it in the compiled SVG markup. |
| **Task 134: Correct PSD Layer Stacking and Rendering Order** | [x] | Render PSD checklist top-to-bottom to match Photoshop, and sort imports bottom-to-top to match SVG DOM order. |
| **Task 135: Add PSD Refresh Button & Refine Reloading** | [x] | Added and refined PSD refresh button with state-preservation, cache-busting, and clipboard-based directory guidance. |





