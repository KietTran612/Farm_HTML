# Farm Progression MVP Design

## Context

Project hiện tại là một game nông trại web nhẹ dùng HTML, SCSS, TypeScript và localStorage. Ý tưởng gốc tập trung vào vòng lặp:

```txt
Gieo hạt -> chăm sóc -> cây lớn -> thu hoạch -> nhận coin/XP -> mở rộng nông trại
```

MVP được chọn theo hướng **Progression Farming**: tập trung vào gieo trồng, chăm sóc, thu hoạch, mở ô đất, mở cây mới và nâng cấp đất. Máy móc, công trình, trang trí, ngày/đêm, mưa, âm thanh và daily quest được giữ lại cho roadmap sau MVP.

## Goals

- Tạo core gameplay loop rõ ràng, dễ hiểu, chơi được ngay.
- Có chăm sóc cây cơ bản: tưới nước và bắt sâu.
- Có hậu quả nếu bỏ mặc cây quá lâu: cây chết sau timeout.
- Có progression nhẹ qua coin, XP, farm level, unlock cây và unlock ô đất.
- Dùng SCSS/CSS class-based visual cho MVP, không dùng PNG/JPG/SVG.
- Dùng localStorage tạm thời nhưng data model phải sẵn sàng chuyển sang backend sau này.
- Board MVP là 3x3, nhưng kiến trúc không hard-code 3x3 để sau này có thể mở rộng thành XxX.

## Non-Goals For MVP

- Không có máy móc, crafting, công trình sản xuất.
- Không có NPC, động vật, map lớn, nhân vật di chuyển.
- Không có mùa vụ hoặc thời tiết ảnh hưởng gameplay.
- Không có daily quest, achievement, âm thanh, trang trí farm.
- Không cân bằng economy cuối cùng ở giai đoạn này; 3 level đầu chỉ là cấu hình test core loop.

## Gameplay Loop

Loop chính:

```txt
1. Người chơi chọn hạt giống.
2. Bấm ô đất trống để gieo.
3. Cây lớn theo thời gian.
4. Nếu đất khô, người chơi bấm tưới.
5. Nếu có sâu, người chơi bấm bắt sâu.
6. Khi cây chín, người chơi bấm thu hoạch.
7. Thu hoạch cho coin + XP.
8. XP giúp lên farm level.
9. Farm level mở quyền mua cây mới và quyền mở thêm ô đất.
10. Coin dùng để mua hạt, mở ô đất và nâng cấp đất.
```

Quy tắc chăm sóc:

- Cây không chết ngay khi khô hoặc có sâu.
- Khi thiếu nước, cây lớn chậm lại hoặc tạm dừng lớn cho đến khi được tưới.
- Khi có sâu, cây lớn chậm lại hoặc tạm dừng lớn cho đến khi sâu được bắt.
- Nếu không tưới quá `waterTimeout`, cây chết.
- Nếu có sâu quá `pestTimeout` mà không bắt, cây chết.
- Sâu xuất hiện theo kiểu ngẫu nhiên nhẹ.
- Cây chết có thể dọn khỏi ô đất miễn phí.
- MVP chưa dùng chất lượng nông sản hoặc giảm giá bán khi cây từng bị khô/có sâu.

## MVP Progression

MVP tạm setup 3 level để test gameplay:

```txt
Level 1
- Board 3x3.
- Một số ô mở sẵn, phần còn lại khóa.
- Mở cà rốt.
- Đất level 1.

Level 2
- Mở quyền mua dâu.
- Mở quyền mở thêm các ô khóa trong 3x3.
- Bắt đầu cho nâng cấp đất. MVP chỉ cần đất level 1-2.

Level 3
- Mở quyền mua lúa.
- Hoàn thiện 3x3 nếu chưa mở hết.
- Chuẩn bị tiền đề cho mở rộng board XxX sau MVP.
```

Sau khi core loop ổn, gameplay/economy sẽ được review lại:

- Thời gian cây lớn.
- Coin/XP reward.
- Giá hạt giống.
- Giá mở ô đất.
- Giá nâng cấp đất.
- Hiệu ứng chính xác của đất level 2.
- Số level và số cây.
- Kích thước board.

## Initial Crops

Vai trò crop trong MVP:

```txt
Cà rốt
- Unlock level 1.
- Cây tutorial, lớn nhanh.
- Lãi thấp.
- Pest chance thấp.

Dâu
- Unlock level 2.
- Cây trung cấp.
- Lớn lâu hơn cà rốt.
- Lãi tốt hơn.
- Pest chance trung bình.

Lúa
- Unlock level 3.
- Cây lâu hơn.
- Lãi ổn định.
- Pest chance thấp-trung bình.
```

Thông số cụ thể chỉ là test balance ban đầu, không phải final balance.

## Board Layout

MVP render board 3x3, nhưng data model phải hỗ trợ layout động:

```ts
type FarmLayout = {
  rows: number;
  columns: number;
};
```

Rule:

```txt
plots.length = farmLayout.rows * farmLayout.columns
```

Không module nào được giả định board luôn có đúng 9 ô. Sau MVP có thể đổi thành 3x4, 4x4, 5x5 hoặc XxX tùy UI/progression.

## UI Direction

Desktop layout:

```txt
Top: HUD
Left/center: farm board
Right: sidebar
```

HUD hiển thị:

- Coin.
- XP và farm level.
- Hạt giống hiện có.
- Trạng thái save/load ngắn nếu cần.

Farm board:

- Ô khóa: locked state và giá mở nếu đủ level.
- Ô trống: bấm để gieo hạt đang chọn.
- Ô có cây: CSS visual theo crop template và derived growth state.
- Ô khô: indicator khô, bấm để tưới.
- Ô có sâu: bug indicator, bấm để bắt sâu.
- Ô harvestable: animation nhẹ, bấm để thu hoạch.
- Ô dead: màu xám/héo, bấm để dọn ô.

Sidebar:

- Hạt giống: chọn hạt, mua hạt.
- Nâng cấp: mở ô đất, nâng cấp đất.
- Thông tin: cây/ô đang chọn, thời gian còn lại, trạng thái.

Mobile UI sẽ review lại sau khi có bản desktop playable. Hướng ban đầu là board phía trên, panel hành động phía dưới hoặc dạng tab.

## Styling Rules

- Dùng SCSS để tổ chức style, không viết CSS trực tiếp bằng inline `style` trên HTML tag.
- Layout, spacing, visual, animation, crop state, plot state và responsive behavior phải đi qua class.
- Renderer chỉ được gắn class theo state, ví dụ `crop crop--carrot crop--root state-sprout is-dry`.
- MVP dùng crop-specific class như `crop--carrot`, `crop--strawberry`, `crop--rice` để set màu/shape trong SCSS.
- CSS custom properties chỉ dùng khi có lý do runtime thật sự rõ ràng; mặc định tránh inline style để markup sạch và dễ review.
- SCSS nên được chia nhỏ dưới `src/styles/`, ví dụ `_tokens.scss`, `_layout.scss`, `_farm-board.scss`, `_plot.scss`, `_crop.scss`, `_sidebar.scss`, `_animations.scss`, và `main.scss`.

## Data Model Principles

localStorage chỉ là storage implementation tạm thời. Core gameplay không được phụ thuộc trực tiếp vào localStorage để sau này có thể chuyển sang backend API/database.

Tách 3 lớp dữ liệu:

```txt
1. Static definitions
- CropDefinition
- LevelDefinition
- PlotUpgradeDefinition
- Unlock rules

2. Player save state
- Player/farm/inventory/progression/timestamps.
- Đây là dữ liệu sẽ lưu localStorage hoặc backend sau này.

3. Runtime/UI state
- selectedSeed
- active panel
- hover/focus/temporary animations
- Không lưu vào save chính, trừ khi có lý do rõ ràng.
```

Không lưu các giá trị dẫn xuất nếu có thể tính lại từ data gốc + config + thời gian hiện tại:

- `growthState`
- `isDry`
- `isHarvestable`
- `remainingTime`
- `hasPest`

Lưu các mốc/sự kiện gốc:

- `cropId`
- `plantedAt`
- `wateredAt`
- `pestAppearedAt`
- `deadAt`
- `soilLevel`
- plot locked/unlocked
- coins/xp/farm level/inventory

Riêng `deadAt` được lưu để trạng thái chết ổn định. Khi cây đã chết thì không bị "sống lại" do load lại hoặc do thay đổi balance/config ở phiên bản sau.

## Proposed Types

```ts
type CropGrowthState =
  | "seeded"
  | "sprout"
  | "grown"
  | "preHarvest"
  | "harvestable"
  | "dead";

type CropTemplate =
  | "root"
  | "leaf"
  | "bush"
  | "tall"
  | "vine";

type CropDefinition = {
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

type FarmLayout = {
  rows: number;
  columns: number;
};

type PlantedCrop = {
  cropId: string;
  plantedAt: number;
  wateredAt: number;
  pestAppearedAt: number | null;
  deadAt: number | null;
};

type Plot = {
  id: string;
  row: number;
  column: number;
  unlocked: boolean;
  soilLevel: number;
  crop: PlantedCrop | null;
};

type PlayerState = {
  id: string;
  coins: number;
  xp: number;
  farmLevel: number;
};

type InventoryState = {
  seeds: Record<string, number>;
};

type FarmState = {
  layout: FarmLayout;
  plots: Plot[];
};

type ProgressionState = {
  unlockedCrops: string[];
};

type GameState = {
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

## Storage Boundary

Save/load đi qua repository interface:

```ts
type SaveRepository = {
  load(): GameState | null;
  save(state: GameState): void;
  clear(): void;
};
```

MVP implementation:

```txt
LocalStorageSaveRepository
```

Future implementation:

```txt
ApiSaveRepository
```

Core gameplay module chỉ gọi repository interface, không gọi trực tiếp `localStorage`.

## Suggested Module Split

```txt
src/data/crops.ts         Static crop definitions.
src/data/progression.ts   Level unlocks, plot unlock rules, upgrade rules.
src/core/state.ts         Types and initial state.
src/core/growth.ts        Derived crop state, dry state, pest/death checks.
src/core/actions.ts       Plant, water, remove pest, harvest, unlock plot, upgrade plot.
src/core/storage.ts       SaveRepository and localStorage adapter.
src/ui/render.ts          Render DOM from GameState and derived view model.
src/main.ts               Init app, event binding, interval tick.
```

## Derived State Rules

Examples:

```txt
growthState = plantedAt + growDuration + now
isDry = wateredAt + waterTimeout + now
isHarvestable = plantedAt + growDuration + now
remainingTime = plantedAt + growDuration + now
hasPest = pestAppearedAt !== null
isDead = deadAt !== null, or timeout exceeded then set deadAt
```

Random pest generation must only happen during controlled tick/action logic. Once pest appears, `pestAppearedAt` is saved so reload does not reroll that result.

## Testing Focus

Test core logic first:

- Growth state from timestamps.
- Dry state from `wateredAt`.
- Death from water timeout.
- Death from pest timeout.
- Pest appearance persists after save/load via `pestAppearedAt`.
- Dead crop remains dead through `deadAt`.
- Plant action consumes seed and sets crop timestamps.
- Water action updates `wateredAt`.
- Remove pest action clears `pestAppearedAt`.
- Harvest action adds coin/XP and clears plot crop.
- Farm level unlocks crops/plot permissions.
- Save/load preserves player, farm, inventory and timestamps.

CSS visual should be manually reviewed rather than heavily unit-tested in MVP.

## Post-MVP Roadmap Notes

Keep these out of MVP, but preserve them for later planning:

- Máy móc/công trình.
- Crafting/sản xuất nâng cao.
- Cozy layer: ngày/đêm, mây trôi, mưa nhẹ, âm thanh.
- Daily bonus/quest.
- Achievement.
- Trang trí farm.
- More crops and crop templates.
- Larger board layouts.
- Backend save/account sync.
