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
  growthPausedMs: number;
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
