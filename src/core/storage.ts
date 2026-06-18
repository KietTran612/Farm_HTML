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
