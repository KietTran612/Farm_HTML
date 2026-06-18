# Farm MVP Phase 0 - Scaffold And Data Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the web project scaffold, test setup, static data, and initial 3x3 dynamic farm state.

**Architecture:** Establish the base Vite/TypeScript app and the first core data boundaries. This phase should leave the project buildable and testable before gameplay logic is added.

**Tech Stack:** Vite, TypeScript, Vitest, HTML, SCSS.

**Parent Plan:** `docs/plans/2026-06-18-farm-progression-mvp-implementation.md`

---

### Task 0: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `src/main.ts`
- Create: `src/styles/main.scss`

- [ ] **Step 1: Create npm/Vite config**

Create `package.json`:

```json
{
  "name": "farm-html",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc && vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@vitest/ui": "^3.2.4",
    "jsdom": "^26.1.0",
    "sass": "^1.89.2",
    "typescript": "^5.8.3",
    "vite": "^7.0.0",
    "vitest": "^3.2.4"
  }
}
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vitest/globals"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

Create `vite.config.ts`:

```ts
import { defineConfig } from "vite";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true
  }
});
```

- [ ] **Step 2: Create app shell**

Create `index.html`:

```html
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Farm Progression MVP</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

Create `src/main.ts`:

```ts
import "./styles/main.scss";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing #app root element");
}

app.innerHTML = `
  <main class="app-shell">
    <section class="farm-stage">
      <h1>Farm Progression MVP</h1>
      <p>Project scaffold is ready.</p>
    </section>
  </main>
`;
```

Create `src/styles/main.scss`:

```scss
:root {
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  color: #26412c;
  background: #f5f0df;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

button {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
  padding: 24px;
}

.farm-stage {
  max-width: 1120px;
  margin: 0 auto;
}
```

- [ ] **Step 3: Install dependencies**

Run:

```bash
npm install
```

Expected: `node_modules/` and `package-lock.json` are created.

- [ ] **Step 4: Verify scaffold**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite build complete without errors.

---

### Task 1: Core Types, Static Data, And Initial State

**Files:**
- Create: `src/core/types.ts`
- Create: `src/data/crops.ts`
- Create: `src/data/progression.ts`
- Create: `src/core/state.ts`
- Test: `src/core/state.test.ts`

- [ ] **Step 1: Write initial state tests**

Create `src/core/state.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createInitialGameState } from "./state";

describe("createInitialGameState", () => {
  it("creates a 3x3 farm layout without hard-coding logic to 9 elsewhere", () => {
    const state = createInitialGameState(1_700_000_000_000);

    expect(state.farm.layout).toEqual({ rows: 3, columns: 3 });
    expect(state.farm.plots).toHaveLength(9);
    expect(state.farm.plots[0]).toMatchObject({
      id: "plot-0-0",
      row: 0,
      column: 0,
      unlocked: true,
      soilLevel: 1,
      crop: null
    });
  });

  it("starts with carrot unlocked and later crops locked behind farm level", () => {
    const state = createInitialGameState(1_700_000_000_000);

    expect(state.player.farmLevel).toBe(1);
    expect(state.progression.unlockedCrops).toEqual(["carrot"]);
    expect(state.inventory.seeds).toEqual({ carrot: 3 });
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
npm test -- src/core/state.test.ts
```

Expected: FAIL because `src/core/state.ts` does not exist.

- [ ] **Step 3: Add shared types**

Create `src/core/types.ts`:

```ts
export type CropGrowthState =
  | "seeded"
  | "sprout"
  | "grown"
  | "preHarvest"
  | "harvestable"
  | "dead";

export type CropTemplate = "root" | "leaf" | "bush" | "tall" | "vine";

export type CropDefinition = {
  id: string;
  name: string;
  template: CropTemplate;
  unlockLevel: number;
  growDuration: number;
  seedPrice: number;
  sellPrice: number;
  xpReward: number;
  waterTimeout: number;
  pestTimeout: number;
  pestChance: number;
  colors: {
    leaf: string;
    fruit?: string;
    flower?: string;
  };
};

export type FarmLayout = {
  rows: number;
  columns: number;
};

export type PlantedCrop = {
  cropId: string;
  plantedAt: number;
  wateredAt: number;
  pestAppearedAt: number | null;
  deadAt: number | null;
};

export type Plot = {
  id: string;
  row: number;
  column: number;
  unlocked: boolean;
  soilLevel: number;
  crop: PlantedCrop | null;
};

export type PlayerState = {
  id: string;
  coins: number;
  xp: number;
  farmLevel: number;
};

export type InventoryState = {
  seeds: Record<string, number>;
};

export type FarmState = {
  layout: FarmLayout;
  plots: Plot[];
};

export type ProgressionState = {
  unlockedCrops: string[];
};

export type GameState = {
  schemaVersion: number;
  player: PlayerState;
  farm: FarmState;
  inventory: InventoryState;
  progression: ProgressionState;
  timestamps: {
    createdAt: number;
    updatedAt: number;
    lastSavedAt: number;
  };
};
```

- [ ] **Step 4: Add crop and progression data**

Create `src/data/crops.ts`:

```ts
import type { CropDefinition } from "../core/types";

export const crops: Record<string, CropDefinition> = {
  carrot: {
    id: "carrot",
    name: "Cà rốt",
    template: "root",
    unlockLevel: 1,
    growDuration: 60,
    seedPrice: 5,
    sellPrice: 12,
    xpReward: 8,
    waterTimeout: 180,
    pestTimeout: 180,
    pestChance: 0.03,
    colors: {
      leaf: "#58b947",
      fruit: "#f27a2a"
    }
  },
  strawberry: {
    id: "strawberry",
    name: "Dâu",
    template: "bush",
    unlockLevel: 2,
    growDuration: 240,
    seedPrice: 12,
    sellPrice: 30,
    xpReward: 18,
    waterTimeout: 480,
    pestTimeout: 420,
    pestChance: 0.05,
    colors: {
      leaf: "#4caf50",
      fruit: "#d93838",
      flower: "#fff0f5"
    }
  },
  rice: {
    id: "rice",
    name: "Lúa",
    template: "tall",
    unlockLevel: 3,
    growDuration: 600,
    seedPrice: 20,
    sellPrice: 48,
    xpReward: 30,
    waterTimeout: 900,
    pestTimeout: 720,
    pestChance: 0.04,
    colors: {
      leaf: "#7aa342",
      fruit: "#e8c85a"
    }
  }
};
```

Create `src/data/progression.ts`:

```ts
export type LevelDefinition = {
  level: number;
  requiredXp: number;
  unlockedCrops: string[];
  maxUnlockedPlots: number;
  maxSoilLevel: number;
};

export const levelDefinitions: LevelDefinition[] = [
  {
    level: 1,
    requiredXp: 0,
    unlockedCrops: ["carrot"],
    maxUnlockedPlots: 4,
    maxSoilLevel: 1
  },
  {
    level: 2,
    requiredXp: 40,
    unlockedCrops: ["carrot", "strawberry"],
    maxUnlockedPlots: 7,
    maxSoilLevel: 2
  },
  {
    level: 3,
    requiredXp: 120,
    unlockedCrops: ["carrot", "strawberry", "rice"],
    maxUnlockedPlots: 9,
    maxSoilLevel: 2
  }
];

export const plotUnlockCost = 25;
export const soilUpgradeCost = 40;

export function getLevelForXp(xp: number): LevelDefinition {
  return levelDefinitions.reduce((current, definition) => {
    return xp >= definition.requiredXp ? definition : current;
  }, levelDefinitions[0]);
}
```

- [ ] **Step 5: Add initial state factory**

Create `src/core/state.ts`:

```ts
import { getLevelForXp } from "../data/progression";
import type { FarmLayout, GameState, Plot } from "./types";

export const SCHEMA_VERSION = 1;

export function createPlots(layout: FarmLayout, unlockedCount: number): Plot[] {
  const plots: Plot[] = [];

  for (let row = 0; row < layout.rows; row += 1) {
    for (let column = 0; column < layout.columns; column += 1) {
      const index = row * layout.columns + column;
      plots.push({
        id: `plot-${row}-${column}`,
        row,
        column,
        unlocked: index < unlockedCount,
        soilLevel: 1,
        crop: null
      });
    }
  }

  return plots;
}

export function createInitialGameState(now: number = Date.now()): GameState {
  const level = getLevelForXp(0);
  const layout: FarmLayout = { rows: 3, columns: 3 };

  return {
    schemaVersion: SCHEMA_VERSION,
    player: {
      id: "local-player",
      coins: 25,
      xp: 0,
      farmLevel: level.level
    },
    farm: {
      layout,
      plots: createPlots(layout, level.maxUnlockedPlots)
    },
    inventory: {
      seeds: {
        carrot: 3
      }
    },
    progression: {
      unlockedCrops: [...level.unlockedCrops]
    },
    timestamps: {
      createdAt: now,
      updatedAt: now,
      lastSavedAt: now
    }
  };
}
```

- [ ] **Step 6: Verify Task 1**

Run:

```bash
npm test -- src/core/state.test.ts
npm run build
```

Expected: tests pass and build completes.

---

