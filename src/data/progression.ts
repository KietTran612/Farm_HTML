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
