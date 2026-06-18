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
