import type { CropArtState } from "./cropArtTypes";

function leaf(className: string, d: string): string {
  return `<path class="${className}" d="${d}" />`;
}

export function renderCornCrop(state: CropArtState): string {
  return `
    <g class="crop-plant crop-plant--corn crop-plant--${state}" data-crop-anchor="120 132">
      <!-- 1. Giai đoạn Hạt giống (Seed) -->
      <g class="corn-layer corn-layer--seed">
        <ellipse class="corn-seed corn-seed--left" cx="112" cy="132" rx="4" ry="6" />
        <ellipse class="corn-seed corn-seed--right" cx="128" cy="132" rx="4" ry="6" />
      </g>

      <!-- 2. Giai đoạn Mầm (Sprout) -->
      <g class="corn-layer corn-layer--sprout">
        <path class="corn-stem corn-stem--sprout" d="M120 136 C119 118 122 104 125 92" />
        ${leaf("corn-leaf corn-leaf--sprout-left", "M123 105 C108 94 92 88 80 82 C98 81 113 88 125 99Z")}
        ${leaf("corn-leaf corn-leaf--sprout-right", "M124 100 C138 88 152 82 168 80 C155 92 139 101 125 106Z")}
      </g>

      <!-- 3. Giai đoạn Trưởng thành (Mature - Grown/PreHarvest) -->
      <g class="corn-layer corn-layer--mature">
        <!-- Thân cây thẳng cao đứng -->
        <path class="corn-stem corn-stem--main" d="M120 136 C119 96 118 64 120 30" />
        <!-- Các bẹ lá đâm ngang rộng rủ xuống -->
        ${leaf("corn-leaf corn-leaf--back-left", "M119 92 C88 88 64 74 42 58 C68 64 96 78 119 86Z")}
        ${leaf("corn-leaf corn-leaf--back-right", "M121 86 C152 82 178 70 202 54 C176 60 148 74 121 80Z")}
        ${leaf("corn-leaf corn-leaf--top-left", "M118 56 C90 48 68 34 46 16 C68 24 94 40 118 48Z")}
        ${leaf("corn-leaf corn-leaf--top-right", "M122 52 C148 44 172 32 196 12 C174 22 148 38 122 46Z")}
      </g>

      <!-- 4. Giai đoạn Sẵn sàng Thu hoạch (Ready - Bắp ngô mọc nách) -->
      <g class="corn-layer corn-layer--ready">
        <!-- Bắp ngô bên trái -->
        <g class="corn-ear corn-ear--left">
          <!-- Bẹ ngô bọc ngoài -->
          <path class="corn-ear-husk" d="M102 96 C88 88 78 76 72 64 C86 70 98 82 108 92 Z" />
          <!-- Râu ngô -->
          <path class="corn-ear-silk" d="M72 64 C64 56 58 52 56 46 M72 64 C66 58 64 54 60 50" />
          <!-- Hạt ngô vàng lấp ló -->
          <ellipse class="corn-ear-kernel" cx="80" cy="74" rx="8" ry="5" transform="rotate(-30 80 74)" />
        </g>

        <!-- Bắp ngô bên phải -->
        <g class="corn-ear corn-ear--right">
          <!-- Bẹ ngô bọc ngoài -->
          <path class="corn-ear-husk" d="M138 96 C152 88 162 76 168 64 C154 70 142 82 132 92 Z" />
          <!-- Râu ngô -->
          <path class="corn-ear-silk" d="M168 64 C176 56 182 52 184 46 M168 64 C174 58 176 54 180 50" />
          <!-- Hạt ngô vàng lấp ló -->
          <ellipse class="corn-ear-kernel" cx="160" cy="74" rx="8" ry="5" transform="rotate(30 160 74)" />
        </g>
      </g>

      <!-- 5. Giai đoạn Héo úa (Dead) -->
      <g class="corn-layer corn-layer--dead">
        <path class="corn-dead-stem" d="M120 136 C115 110 108 90 98 64" />
        ${leaf("corn-dead-leaf corn-dead-leaf--left", "M110 98 C82 102 62 108 42 120 C64 114 88 108 108 102Z")}
        ${leaf("corn-dead-leaf corn-dead-leaf--right", "M114 90 C138 96 158 106 178 122 C154 112 132 102 112 94Z")}
      </g>
    </g>
  `;
}
