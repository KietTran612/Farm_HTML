# Ý tưởng game nông trại HTML/CSS/TypeScript

## 1. Tóm tắt ý tưởng

Dự án là một game nông trại web nhẹ, tập trung vào vòng lặp:

```txt
Gieo hạt → chờ cây lớn → thu hoạch → nhận tiền → mua hạt giống/nâng cấp → mở rộng nông trại
```

Game sẽ được làm bằng:

```txt
HTML = cấu trúc giao diện
CSS = toàn bộ hình ảnh, visual, animation
TypeScript = logic game, state, thời gian, save/load
```

Mục tiêu ban đầu là làm một game nông trại kiểu **idle / management / cozy farming**, không phải game realtime giống Stardew Valley hay Harvest Moon.

---

## 2. Định hướng kỹ thuật

### Stack đề xuất

```txt
Vite + TypeScript
HTML
CSS thuần
LocalStorage
```

Không cần dùng engine game, không cần Canvas/WebGL ở MVP.

### Vai trò từng phần

| Thành phần | Vai trò |
|---|---|
| HTML | Dựng layout, grid đất, shop, inventory, HUD |
| CSS | Vẽ toàn bộ cây, đất, mây, coin, hiệu ứng, animation |
| TypeScript | Quản lý logic game, state cây, tiền, thời gian, save/load |

---

## 3. Định hướng hình ảnh

Game sẽ đi theo hướng **CSS-only visual**, nghĩa là không dùng PNG/JPG/SVG cho MVP.

Visual được tạo bằng:

- `div`
- `border-radius`
- `linear-gradient`
- `radial-gradient`
- `box-shadow`
- `::before`
- `::after`
- CSS variables
- CSS animations

Phong cách nên chọn:

```txt
cozy minimal farming UI
toy-like farm
flat pastel CSS art
interactive farming board
```

Không nên cố làm style quá chi tiết kiểu pixel-art RPG nhiều frame animation.

---

## 4. Nguyên tắc visual CSS-only

Mỗi vật thể nên đơn giản, ít DOM node.

Ví dụ:

| Vật thể | Cách làm |
|---|---|
| Ô đất | 1 `div` với gradient và bo góc |
| Cây non | 1 `div` + `::before` + `::after` |
| Cây trưởng thành | 1 `div` + pseudo-elements |
| Coin | 1 `div` tròn, animation bay lên |
| Mây | 1 `div` + `::before` + `::after` |
| Giọt nước | 1 `div` dạng giọt |

Tránh mỗi object cần quá nhiều `div`, vì sẽ khiến CSS khó maintain.

---

## 5. Crop states chung

Tất cả cây trồng sẽ dùng chung một bộ state từ 4 đến 6 bước.

Bộ state đề xuất cuối cùng:

```ts
type CropGrowthState =
  | "seeded"      // mới gieo
  | "sprout"      // cây con
  | "grown"       // cây trưởng thành
  | "preHarvest"  // sắp thu hoạch / kết hoa / đang chín
  | "harvestable" // có thể thu hoạch
  | "dead";       // cây chết
```

Flow chính:

```txt
seeded → sprout → grown → preHarvest → harvestable
```

State đặc biệt:

```txt
harvestable → dead
grown → dead
preHarvest → dead
```

`dead` có thể được thêm sau MVP nếu muốn game có yếu tố chăm sóc và hậu quả.

---

## 6. Label tiếng Việt cho state

Trong code có thể dùng tên tiếng Anh để dễ quản lý, nhưng UI hiển thị tiếng Việt.

```ts
const cropStateLabels = {
  seeded: "Mới gieo",
  sprout: "Cây con",
  grown: "Đang trưởng thành",
  preHarvest: "Sắp thu hoạch",
  harvestable: "Có thể thu hoạch",
  dead: "Đã chết"
};
```

Lưu ý: `preHarvest` được dùng thay cho `flowering` vì nó trung tính hơn.

Ví dụ:

| Cây | Ý nghĩa của `preHarvest` |
|---|---|
| Dâu | Đang ra hoa |
| Lúa | Đang chín |
| Cà rốt | Củ bắt đầu lớn |
| Rau cải | Lá đã gần đủ lớn |
| Cà chua | Đang kết quả |

---

## 7. Vì sao dùng state chung là hướng tốt?

Dùng state chung giúp tránh “nổ scope”.

Nếu mỗi cây tự có nhiều state riêng, số lượng CSS sẽ tăng rất nhanh.

Ví dụ không nên làm:

```txt
carrot-seed
carrot-sprout
carrot-grown
carrot-flowering
carrot-harvestable
carrot-dead

strawberry-seed
strawberry-sprout
strawberry-grown
...
```

Hướng tốt hơn là dùng class composition:

```html
<div class="crop template-root state-sprout is-watered"></div>
```

Trong đó:

```txt
template-root = kiểu cây
state-sprout = giai đoạn phát triển
is-watered = trạng thái phụ
```

CSS sẽ dễ quản lý hơn rất nhiều.

---

## 8. Crop templates

Thay vì vẽ từng cây hoàn toàn riêng, nên chia cây thành các template visual.

### Template đề xuất

```ts
type CropTemplate =
  | "root"
  | "leaf"
  | "bush"
  | "tall"
  | "vine";
```

### Ý nghĩa

| Template | Phù hợp với |
|---|---|
| `root` | Cà rốt, củ cải, khoai tây, hành |
| `leaf` | Rau cải, xà lách, bạc hà |
| `bush` | Dâu, việt quất, cà chua mini |
| `tall` | Lúa, bắp, mía |
| `vine` | Bí ngô, dưa hấu, dưa leo |

Mỗi template dùng chung CSS structure, chỉ khác màu, kích thước, thời gian lớn và giá trị thu hoạch.

---

## 9. Crop definition

Mỗi loại cây nên được định nghĩa bằng data, không hard-code logic rải rác.

```ts
type CropDefinition = {
  id: string;
  name: string;
  template: CropTemplate;
  growDuration: number; // tổng thời gian lớn, tính bằng giây
  harvestWindow?: number; // thời gian sau khi chín trước khi chết
  seedPrice: number;
  sellPrice: number;
  colors: {
    leaf: string;
    fruit?: string;
    flower?: string;
  };
};
```

Ví dụ:

```ts
const crops: Record<string, CropDefinition> = {
  carrot: {
    id: "carrot",
    name: "Cà rốt",
    template: "root",
    growDuration: 300,
    harvestWindow: 86400,
    seedPrice: 5,
    sellPrice: 12,
    colors: {
      leaf: "#58b947",
      fruit: "#f27a2a"
    }
  },

  strawberry: {
    id: "strawberry",
    name: "Dâu tây",
    template: "bush",
    growDuration: 600,
    harvestWindow: 86400,
    seedPrice: 12,
    sellPrice: 30,
    colors: {
      leaf: "#4caf50",
      fruit: "#d93838",
      flower: "#fff0f5"
    }
  }
};
```

---

## 10. Plot state

Mỗi ô đất chỉ cần lưu thông tin tối thiểu.

```ts
type Plot = {
  id: number;
  cropId: string | null;
  plantedAt: number | null;
};
```

Có thể mở rộng sau:

```ts
type Plot = {
  id: number;
  cropId: string | null;
  plantedAt: number | null;
  wateredAt?: number | null;
  fertilizedUntil?: number | null;
  soilLevel?: number;
};
```

---

## 11. Tính state cây từ thời gian

Không nên để CSS quyết định cây lớn sau bao lâu.

CSS chỉ nên hiển thị state. TypeScript mới là nơi tính logic.

```ts
function getCropState(
  plot: Plot,
  crop: CropDefinition,
  now: number
): CropGrowthState {
  if (!plot.plantedAt) {
    return "dead";
  }

  const elapsed = (now - plot.plantedAt) / 1000;
  const progress = elapsed / crop.growDuration;

  if (
    crop.harvestWindow &&
    elapsed > crop.growDuration + crop.harvestWindow
  ) {
    return "dead";
  }

  if (progress < 0.2) return "seeded";
  if (progress < 0.4) return "sprout";
  if (progress < 0.7) return "grown";
  if (progress < 1) return "preHarvest";

  return "harvestable";
}
```

Cách này giúp hỗ trợ dễ dàng:

- save/load
- offline progress
- pause game
- nâng cấp đất
- phân bón
- tăng tốc
- cây chết sau thời gian dài

---

## 12. Render HTML theo state

TypeScript render class dựa trên state và template.

```html
<div class="plot">
  <div
    class="crop template-root state-sprout"
    style="--leaf:#58b947; --fruit:#f27a2a;"
  ></div>
</div>
```

Ví dụ khi cây đã thu hoạch được:

```html
<div class="plot">
  <div
    class="crop template-root state-harvestable"
    style="--leaf:#58b947; --fruit:#f27a2a;"
  ></div>
</div>
```

---

## 13. CSS state chung

```css
.crop {
  position: relative;
  width: 48px;
  height: 48px;
  transition:
    transform 0.3s ease,
    opacity 0.3s ease,
    filter 0.3s ease;
}

.state-seeded {
  transform: scale(0.35);
  opacity: 0.8;
}

.state-sprout {
  transform: scale(0.5);
}

.state-grown {
  transform: scale(0.75);
}

.state-preHarvest {
  transform: scale(0.9);
}

.state-harvestable {
  transform: scale(1);
  animation: harvest-ready 1.2s ease-in-out infinite;
}

.state-dead {
  filter: grayscale(1) brightness(0.65);
  transform: scale(0.75) rotate(-6deg);
}
```

Animation:

```css
@keyframes harvest-ready {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.08);
  }
}
```

---

## 14. Condition states phụ

Ngoài growth state, có thể có một vài condition state.

MVP có thể chưa cần, nhưng nên thiết kế sẵn.

```ts
type CropCondition =
  | "normal"
  | "watered"
  | "dry"
  | "boosted";
```

Render class:

```html
<div class="crop template-bush state-grown is-watered"></div>
```

CSS:

```css
.is-watered {
  filter: saturate(1.15);
}

.is-dry {
  filter: saturate(0.7) brightness(0.85);
}

.is-boosted {
  box-shadow: 0 0 16px rgba(255, 255, 255, 0.5);
}
```

Không nên tạo quá nhiều condition state riêng cho từng cây.

---

## 15. Game loop

Game nông trại idle không cần loop 60 FPS.

Chỉ cần update theo interval:

```ts
setInterval(() => {
  updateGame();
  render();
}, 1000);
```

Mỗi giây kiểm tra:

- cây nào đổi state
- cây nào đã harvestable
- cây nào chết
- nhiệm vụ nào hoàn thành
- UI cần cập nhật gì

CSS animation sẽ tự chạy riêng trên browser.

---

## 16. Save/load

MVP nên dùng `localStorage`.

Lưu:

```ts
type GameState = {
  coins: number;
  plots: Plot[];
  seeds: Record<string, number>;
  unlockedCrops: string[];
  lastSavedAt: number;
};
```

Khi mở game lại, dùng `lastSavedAt` để tính offline progress.

Ví dụ:

```txt
Người chơi trồng cà rốt lúc 10:00
Cà rốt cần 5 phút để lớn
Người chơi đóng game lúc 10:01
Người chơi mở lại lúc 10:10
Cây đã ở state harvestable
```

Vì state được tính từ `plantedAt`, offline progress sẽ tự nhiên hoạt động.

---

## 17. MVP đề xuất

Bản đầu tiên nên cực kỳ gọn.

### MVP v1

```txt
- Grid đất 3x3
- 3 loại cây: cà rốt, dâu, lúa
- 6 growth states chung
- Gieo hạt
- Cây lớn theo thời gian
- Thu hoạch nhận coin
- Shop mua seed
- Save/load bằng localStorage
- CSS-only visual
- CSS animation khi cây harvestable
```

### Chưa cần ở MVP

```txt
- Thời tiết
- Động vật
- NPC
- Nhiệm vụ phức tạp
- Trang trí nông trại
- Map lớn
- Nhân vật di chuyển
- Hệ thống mùa
```

---

## 18. Lộ trình mở rộng

### Giai đoạn 1: Core farming

```txt
Gieo → lớn → thu hoạch → mua hạt → mở thêm đất
```

### Giai đoạn 2: Chăm sóc cây

```txt
Tưới nước
Đất khô
Phân bón
Boost tốc độ mọc
```

### Giai đoạn 3: Economy

```txt
Shop
Nâng cấp đất
Mở khóa cây mới
Giá bán khác nhau
```

### Giai đoạn 4: Cozy features

```txt
Ngày/đêm
Mây trôi
Mưa nhẹ bằng CSS
Âm thanh đơn giản
Daily quests
```

### Giai đoạn 5: Content

```txt
Thêm cây mới
Thêm template cây
Thêm trang trí
Thêm achievement
```

---

## 19. Rủi ro và cách tránh

### Rủi ro 1: CSS quá phức tạp

Nếu mỗi cây có CSS riêng quá chi tiết, dự án sẽ khó maintain.

Cách tránh:

```txt
Dùng template chung
Dùng CSS variables
Dùng state chung
Không vẽ quá chi tiết
```

### Rủi ro 2: Nổ số lượng state

Không nên có nhiều state phụ cho từng cây.

Cách tránh:

```txt
Growth state dùng chung
Condition state dùng chung
Không tạo class riêng theo tổ hợp
```

Ví dụ nên làm:

```html
<div class="crop template-root state-grown is-watered"></div>
```

Không nên làm:

```html
<div class="carrot-grown-watered-special"></div>
```

### Rủi ro 3: Cây chết gây khó chịu

Nếu game muốn cozy, cây chết có thể làm người chơi thấy áp lực.

Cách xử lý:

```txt
MVP có thể chưa bật cây chết
Hoặc chỉ chết sau khi chín quá lâu
Ví dụ: sau 24 giờ hoặc 48 giờ
```

### Rủi ro 4: DOM quá nhiều

Nếu map quá lớn và nhiều animation cùng lúc, game có thể lag trên mobile.

Cách tránh:

```txt
MVP chỉ 3x3
Mở rộng dần lên 5x5 hoặc 10x10
Không animate mọi object cùng lúc
Chỉ animate object quan trọng
```

---

## 20. Đánh giá tổng thể

| Hạng mục | Đánh giá |
|---|---|
| Khả thi kỹ thuật | 9/10 |
| Phù hợp CSS-only visual | 9/10 |
| Phù hợp solo/2 dev | 9/10 |
| Dễ mở rộng nếu dùng template | 8/10 |
| Rủi ro nổ scope | Thấp nếu giữ state chung |
| Phù hợp game idle/management | Rất tốt |
| Phù hợp game realtime RPG | Không phù hợp |

---

## 21. Quyết định thiết kế hiện tại

Các quyết định chính:

```txt
- Làm game nông trại web idle/management
- Không dùng ảnh trong MVP
- Dùng CSS để vẽ toàn bộ visual
- Dùng TypeScript cho logic
- Cây có 6 state chung
- Dùng crop template để tái sử dụng visual
- State được tính từ thời gian trồng
- CSS chỉ hiển thị state, không xử lý logic
- MVP nhỏ: 3x3 đất, 3 loại cây, shop, coin, save/load
```

---

## 22. Kết luận

Hướng làm này rất ổn nếu giữ đúng phạm vi:

```txt
HTML + CSS + TypeScript
CSS-only visuals
State chung cho cây
Template chung cho nhóm cây
Game idle/management nhẹ
```

Đây là hướng phù hợp cho một game nông trại nhỏ, dễ thương, chạy trực tiếp trên web, không phụ thuộc asset hình ảnh và có thể phát triển dần theo từng vòng lặp nhỏ.

Điểm mấu chốt là không cố làm game quá giống RPG farming phức tạp. Game nên tập trung vào cảm giác:

```txt
dễ hiểu
dễ chơi
dễ thương
nhẹ
mượt
có tiến triển rõ ràng
```
