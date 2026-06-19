import type { CropArtState } from "./cropArtTypes";

function leaf(className: string, d: string): string {
  return `<path class="${className}" d="${d}" />`;
}

export function renderTomatoCrop(state: CropArtState): string {
  return `
    <g class="crop-plant crop-plant--tomato crop-plant--${state}" data-crop-anchor="120 132">
      <!-- 1. Seed -->
      <g class="tomato-layer tomato-layer--seed">
        <ellipse class="tomato-seed tomato-seed--left" cx="112" cy="132" rx="4" ry="5" />
        <ellipse class="tomato-seed tomato-seed--right" cx="126" cy="132" rx="4" ry="5" />
      </g>

      <!-- 2. Sprout -->
      <g class="tomato-layer tomato-layer--sprout">
        <path class="tomato-stem tomato-stem--sprout" d="M120 136 C119 122 121 110 123 98" />
        ${leaf("tomato-leaf tomato-leaf--sprout-left", "M122 108 C108 102 96 100 86 96 C98 92 112 98 122 106Z")}
        ${leaf("tomato-leaf tomato-leaf--sprout-right", "M123 104 C136 98 148 96 158 92 C148 98 136 104 123 106Z")}
      </g>

      <!-- 3. Mature -->
      <g class="tomato-layer tomato-layer--mature">
        <!-- Thân cây thẳng xum xuê -->
        <path class="tomato-stem tomato-stem--main" d="M120 136 C118 102 118 78 120 48" />
        <path class="tomato-stem tomato-stem--branch-left" d="M120 102 C106 94 92 88 78 84" />
        <path class="tomato-stem tomato-stem--branch-right" d="M120 96 C136 88 152 82 168 78" />

        <!-- Các lá cà chua xum xuê răng cưa nhẹ -->
        ${leaf("tomato-leaf tomato-leaf--back-left", "M78 84 C56 78 38 68 22 56 C44 58 66 70 82 78Z")}
        ${leaf("tomato-leaf tomato-leaf--back-right", "M168 78 C190 72 208 62 224 50 C202 52 180 64 164 72Z")}
        ${leaf("tomato-leaf tomato-leaf--top-left", "M119 72 C98 64 80 50 64 34 C82 40 102 54 119 62Z")}
        ${leaf("tomato-leaf tomato-leaf--top-right", "M121 68 C142 60 160 46 176 30 C158 36 138 50 121 58Z")}

        <!-- Hoa cà chua màu vàng nhỏ -->
        <g class="tomato-flower tomato-flower--1">
          <path class="tomato-flower-petal" d="M96 90 L102 84 L108 90 L102 96 Z" />
          <path class="tomato-flower-petal" d="M102 84 L108 90 L102 96 L96 90 Z" transform="rotate(45 102 90)" />
          <circle class="tomato-flower-center" cx="102" cy="90" r="2.5" />
        </g>
        <g class="tomato-flower tomato-flower--2">
          <path class="tomato-flower-petal" d="M136 84 L142 78 L148 84 L142 90 Z" />
          <path class="tomato-flower-petal" d="M142 78 L148 84 L142 90 L136 84 Z" transform="rotate(45 142 84)" />
          <circle class="tomato-flower-center" cx="142" cy="84" r="2" />
        </g>
      </g>

      <!-- 4. Ready -->
      <g class="tomato-layer tomato-layer--ready">
        <!-- Chùm cà chua chín đỏ trĩu quả -->
        <g class="tomato-fruit-group tomato-fruit-group--left">
          <!-- Cuống quả màu xanh -->
          <path class="tomato-fruit-stem" d="M94 104 C90 110 88 114 86 122" />
          <circle class="tomato-fruit-calyx" cx="86" cy="122" r="3" />
          <!-- Quả cà chua đỏ tròn căng -->
          <circle class="tomato-fruit tomato-fruit--red-1" cx="86" cy="130" r="11" />
          <!-- Điểm sáng bóng loáng -->
          <ellipse class="tomato-fruit-highlight" cx="82" cy="126" rx="4" ry="2" transform="rotate(-30 82 126)" />
        </g>

        <g class="tomato-fruit-group tomato-fruit-group--right">
          <!-- Cuống quả màu xanh -->
          <path class="tomato-fruit-stem" d="M148 100 C152 106 154 110 156 118" />
          <circle class="tomato-fruit-calyx" cx="156" cy="118" r="2.5" />
          <!-- Quả cà chua màu cam hoặc đỏ nhỏ hơn bên phải -->
          <circle class="tomato-fruit tomato-fruit--red-2" cx="156" cy="126" r="9.5" />
          <!-- Điểm sáng bóng loáng -->
          <ellipse class="tomato-fruit-highlight" cx="153" cy="122" rx="3.5" ry="1.8" transform="rotate(-30 153 122)" />
        </g>

        <g class="tomato-fruit-group tomato-fruit-group--center">
          <!-- Một quả cà chua xanh chưa chín hẳn treo ở giữa -->
          <path class="tomato-fruit-stem" d="M118 84 C116 92 114 96 112 104" />
          <circle class="tomato-fruit-calyx" cx="112" cy="104" r="2" />
          <circle class="tomato-fruit tomato-fruit--green" cx="112" cy="110" r="7.5" />
        </g>
      </g>

      <!-- 5. Dead -->
      <g class="tomato-layer tomato-layer--dead">
        <path class="tomato-dead-stem" d="M120 136 C115 116 110 102 102 84" />
        <!-- Quả héo xỉn rụng/rủ xuống -->
        <g class="tomato-dead-fruit-group">
          <path class="tomato-dead-fruit-stem" d="M102 84 C98 90 94 94 92 100" />
          <circle class="tomato-dead-fruit" cx="92" cy="107" r="8.5" />
        </g>
        <!-- Lá héo úa xám màu -->
        <g class="tomato-dead-leaf-group">
          <ellipse class="tomato-dead-leaf" cx="132" cy="100" rx="9" ry="5" transform="rotate(30 132 100)" />
          <ellipse class="tomato-dead-leaf" cx="140" cy="106" rx="9" ry="5" transform="rotate(60 140 106)" />
        </g>
      </g>
    </g>
  `;
}
