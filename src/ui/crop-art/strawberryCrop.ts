import type { CropArtState } from "./cropArtTypes";

export function renderStrawberryCrop(state: CropArtState): string {
  return `
    <g class="crop-plant crop-plant--strawberry crop-plant--${state}" data-crop-anchor="120 132">
      <!-- 1. Seed -->
      <g class="strawberry-layer strawberry-layer--seed">
        <ellipse class="strawberry-seed strawberry-seed--left" cx="112" cy="132" rx="4" ry="4" />
        <ellipse class="strawberry-seed strawberry-seed--right" cx="126" cy="132" rx="3" ry="3" />
      </g>

      <!-- 2. Sprout -->
      <g class="strawberry-layer strawberry-layer--sprout">
        <path class="strawberry-stem strawberry-stem--sprout" d="M120 136 C119 124 121 114 124 106" />
        <!-- Lá 3 thùy nhỏ -->
        <g class="strawberry-leaf-group strawberry-leaf-group--sprout">
          <ellipse class="strawberry-leaf-lobe strawberry-leaf-lobe--left" cx="116" cy="102" rx="6" ry="4" transform="rotate(-30 116 102)" />
          <ellipse class="strawberry-leaf-lobe strawberry-leaf-lobe--center" cx="124" cy="98" rx="6" ry="4" transform="rotate(-90 124 98)" />
          <ellipse class="strawberry-leaf-lobe strawberry-leaf-lobe--right" cx="132" cy="102" rx="6" ry="4" transform="rotate(30 132 102)" />
        </g>
      </g>

      <!-- 3. Mature -->
      <g class="strawberry-layer strawberry-layer--mature">
        <!-- Các nhánh lá mọc thấp tỏa ra -->
        <path class="strawberry-stem strawberry-stem--left" d="M120 136 C106 128 92 122 76 122" />
        <path class="strawberry-stem strawberry-stem--right" d="M120 136 C134 128 148 122 164 122" />
        <path class="strawberry-stem strawberry-stem--center" d="M120 136 C120 120 120 112 120 100" />

        <!-- Cụm lá 3 thùy bên trái -->
        <g class="strawberry-leaf-group strawberry-leaf-group--left">
          <ellipse class="strawberry-leaf-lobe" cx="68" cy="120" rx="10" ry="7" transform="rotate(-40 68 120)" />
          <ellipse class="strawberry-leaf-lobe" cx="74" cy="112" rx="10" ry="7" transform="rotate(-90 74 112)" />
          <ellipse class="strawberry-leaf-lobe" cx="82" cy="120" rx="10" ry="7" transform="rotate(20 82 120)" />
        </g>

        <!-- Cụm lá 3 thùy bên phải -->
        <g class="strawberry-leaf-group strawberry-leaf-group--right">
          <ellipse class="strawberry-leaf-lobe" cx="158" cy="120" rx="10" ry="7" transform="rotate(-20 158 120)" />
          <ellipse class="strawberry-leaf-lobe" cx="166" cy="112" rx="10" ry="7" transform="rotate(-90 166 112)" />
          <ellipse class="strawberry-leaf-lobe" cx="172" cy="120" rx="10" ry="7" transform="rotate(40 172 120)" />
        </g>

        <!-- Cụm lá 3 thùy ở giữa -->
        <g class="strawberry-leaf-group strawberry-leaf-group--center">
          <ellipse class="strawberry-leaf-lobe" cx="110" cy="96" rx="11" ry="8" transform="rotate(-30 110 96)" />
          <ellipse class="strawberry-leaf-lobe" cx="120" cy="88" rx="11" ry="8" transform="rotate(-90 120 88)" />
          <ellipse class="strawberry-leaf-lobe" cx="130" cy="96" rx="11" ry="8" transform="rotate(30 130 96)" />
        </g>

        <!-- Các bông hoa dâu tây nhỏ màu trắng nhụy vàng -->
        <g class="strawberry-flower strawberry-flower--1">
          <circle class="strawberry-flower-petal" cx="92" cy="112" r="6" />
          <circle class="strawberry-flower-petal" cx="102" cy="106" r="6" />
          <circle class="strawberry-flower-petal" cx="102" cy="118" r="6" />
          <circle class="strawberry-flower-petal" cx="92" cy="124" r="6" />
          <circle class="strawberry-flower-petal" cx="84" cy="118" r="6" />
          <circle class="strawberry-flower-center" cx="94" cy="115" r="3.5" />
        </g>
        <g class="strawberry-flower strawberry-flower--2">
          <circle class="strawberry-flower-petal" cx="140" cy="112" r="5" />
          <circle class="strawberry-flower-petal" cx="148" cy="107" r="5" />
          <circle class="strawberry-flower-petal" cx="148" cy="117" r="5" />
          <circle class="strawberry-flower-petal" cx="140" cy="122" r="5" />
          <circle class="strawberry-flower-petal" cx="132" cy="117" r="5" />
          <circle class="strawberry-flower-center" cx="141" cy="115" r="3" />
        </g>
      </g>

      <!-- 4. Ready -->
      <g class="strawberry-layer strawberry-layer--ready">
        <!-- Quả dâu tây bên trái -->
        <g class="strawberry-berry strawberry-berry--left">
          <!-- Cuống quả xanh (calyx) -->
          <path class="strawberry-calyx" d="M92 126 C88 122 84 122 80 124 C82 128 86 130 92 126Z" />
          <!-- Quả dâu tây màu đỏ hình tim ngược -->
          <path class="strawberry-fruit" d="M80 126 C72 126 66 136 78 148 C80 150 82 150 84 148 C96 136 90 126 82 126 Z" />
          <!-- Các hạt vàng nhỏ hạt dâu tây -->
          <circle class="strawberry-seed-dot" cx="76" cy="132" r="1" />
          <circle class="strawberry-seed-dot" cx="84" cy="132" r="1" />
          <circle class="strawberry-seed-dot" cx="80" cy="138" r="1" />
          <circle class="strawberry-seed-dot" cx="82" cy="144" r="0.8" />
        </g>

        <!-- Quả dâu tây bên phải -->
        <g class="strawberry-berry strawberry-berry--right">
          <!-- Cuống quả xanh (calyx) -->
          <path class="strawberry-calyx" d="M148 126 C152 122 156 122 160 124 C158 128 154 130 148 126Z" />
          <!-- Quả dâu tây màu đỏ hình tim ngược -->
          <path class="strawberry-fruit" d="M148 126 C140 126 134 136 146 148 C148 150 150 150 152 148 C164 136 158 126 150 126 Z" />
          <!-- Các hạt vàng nhỏ hạt dâu tây -->
          <circle class="strawberry-seed-dot" cx="144" cy="132" r="1" />
          <circle class="strawberry-seed-dot" cx="152" cy="132" r="1" />
          <circle class="strawberry-seed-dot" cx="148" cy="138" r="1" />
          <circle class="strawberry-seed-dot" cx="150" cy="144" r="0.8" />
        </g>
      </g>

      <!-- 5. Dead -->
      <g class="strawberry-layer strawberry-layer--dead">
        <path class="strawberry-dead-stem" d="M120 136 C112 128 102 124 90 122" />
        <!-- Quả dâu héo bên trái -->
        <path class="strawberry-dead-fruit" d="M90 122 C84 122 80 128 88 136 C89 137 90 137 91 136 C99 128 95 122 89 122 Z" />
        <!-- Lá héo úa xụ xuống -->
        <g class="strawberry-dead-leaf-group">
          <ellipse class="strawberry-dead-leaf" cx="132" cy="120" rx="8" ry="5" transform="rotate(30 132 120)" />
          <ellipse class="strawberry-dead-leaf" cx="142" cy="124" rx="8" ry="5" transform="rotate(60 142 124)" />
        </g>
      </g>
    </g>
  `;
}
