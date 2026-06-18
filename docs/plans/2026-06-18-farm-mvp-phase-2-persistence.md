# Farm MVP Phase 2 - Persistence Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a backend-ready save boundary and localStorage adapter for the MVP.

**Architecture:** Core gameplay should depend on a repository interface, not direct browser storage calls. The localStorage adapter is the first implementation and can later be replaced by an API adapter.

**Tech Stack:** TypeScript, Vitest, localStorage.

**Parent Plan:** `docs/plans/2026-06-18-farm-progression-mvp-implementation.md`

---

### Task 4: Storage Boundary And localStorage Adapter

**Files:**
- Create: `src/core/storage.ts`
- Test: `src/core/storage.test.ts`

- [ ] **Step 1: Write storage tests**

Create `src/core/storage.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "./state";
import { LocalStorageSaveRepository } from "./storage";

describe("LocalStorageSaveRepository", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and loads game state", () => {
    const repo = new LocalStorageSaveRepository("farm-test-save");
    const state = createInitialGameState(1_000);

    repo.save(state);

    const loaded = repo.load();
    expect(loaded?.schemaVersion).toBe(state.schemaVersion);
    expect(loaded?.player).toEqual(state.player);
    expect(loaded?.farm).toEqual(state.farm);
    expect(loaded?.inventory).toEqual(state.inventory);
    expect(loaded?.progression).toEqual(state.progression);
    expect(loaded?.timestamps.createdAt).toBe(1_000);
    expect(typeof loaded?.timestamps.lastSavedAt).toBe("number");
  });

  it("returns null for missing or invalid save data", () => {
    const repo = new LocalStorageSaveRepository("farm-test-save");
    expect(repo.load()).toBeNull();

    localStorage.setItem("farm-test-save", "{bad json");
    expect(repo.load()).toBeNull();
  });

  it("clears save data", () => {
    const repo = new LocalStorageSaveRepository("farm-test-save");
    repo.save(createInitialGameState(1_000));
    repo.clear();

    expect(repo.load()).toBeNull();
  });
});
```

- [ ] **Step 2: Run failing test**

Run:

```bash
npm test -- src/core/storage.test.ts
```

Expected: FAIL because `src/core/storage.ts` does not exist.

- [ ] **Step 3: Implement storage adapter**

Create `src/core/storage.ts`:

```ts
import { SCHEMA_VERSION } from "./state";
import type { GameState } from "./types";

export type SaveRepository = {
  load(): GameState | null;
  save(state: GameState): void;
  clear(): void;
};

const DEFAULT_SAVE_KEY = "farm-html-save-v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isGameState(value: unknown): value is GameState {
  if (!isRecord(value)) return false;
  if (value.schemaVersion !== SCHEMA_VERSION) return false;
  if (!isRecord(value.player)) return false;
  if (!isRecord(value.farm)) return false;
  if (!isRecord(value.inventory)) return false;
  if (!isRecord(value.progression)) return false;
  if (!isRecord(value.timestamps)) return false;
  return true;
}

export class LocalStorageSaveRepository implements SaveRepository {
  constructor(private readonly key: string = DEFAULT_SAVE_KEY) {}

  load(): GameState | null {
    const raw = localStorage.getItem(this.key);
    if (!raw) return null;

    try {
      const parsed: unknown = JSON.parse(raw);
      return isGameState(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  save(state: GameState): void {
    const nextState: GameState = {
      ...state,
      timestamps: {
        ...state.timestamps,
        lastSavedAt: Date.now()
      }
    };
    localStorage.setItem(this.key, JSON.stringify(nextState));
  }

  clear(): void {
    localStorage.removeItem(this.key);
  }
}
```

- [ ] **Step 4: Verify Task 4**

Run:

```bash
npm test -- src/core/storage.test.ts
npm run build
```

Expected: tests pass and build completes.

---

