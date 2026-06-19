import type { CropArtState } from "./cropArtTypes";

function leaf(className: string, d: string): string {
  return `<path class="${className}" d="${d}" />`;
}

export function renderPumpkinCrop(state: CropArtState): string {
  return `
    <g class="crop-plant crop-plant--pumpkin crop-plant--${state}" data-crop-anchor="120 132">
      <!-- 1. Seed -->
      <g class="pumpkin-layer pumpkin-layer--seed">
        <ellipse class="pumpkin-seed pumpkin-seed--left" cx="110" cy="132" rx="5" ry="5" />
        <ellipse class="pumpkin-seed pumpkin-seed--right" cx="130" cy="132" rx="4" ry="4" />
      </g>

      <!-- 2. Sprout -->
      <g class="pumpkin-layer pumpkin-layer--sprout">
        <path class="pumpkin-stem pumpkin-stem--sprout" d="M120 136 C118 126 120 116 123 108" />
        ${leaf("pumpkin-leaf pumpkin-leaf--sprout-1", "M123 108 C106 102 94 102 84 98 C98 94 112 100 123 108Z")}
        ${leaf("pumpkin-leaf pumpkin-leaf--sprout-2", "M123 110 C134 104 146 104 156 98 C146 106 134 112 123 110Z")}
      </g>

      <!-- 3. Mature -->
      <g class="pumpkin-layer pumpkin-layer--mature">
        <!-- Dây leo bò thấp hai bên -->
        <path class="pumpkin-stem pumpkin-stem--left" d="M120 136 C105 130 90 128 70 128" />
        <path class="pumpkin-stem pumpkin-stem--right" d="M120 136 C135 130 150 128 170 128" />
        
        <!-- Lá to, xẻ rộng đặc trưng bầu bí -->
        ${leaf("pumpkin-leaf pumpkin-leaf--back-1", "M70 128 C45 120 27 110 11 94 C37 94 61 108 79 120Z")}
        ${leaf("pumpkin-leaf pumpkin-leaf--back-2", "M170 128 C195 120 213 110 229 94 C203 94 179 108 161 120Z")}
        ${leaf("pumpkin-leaf pumpkin-leaf--front-1", "M89 132 C63 126 43 132 25 142 C49 146 71 138 87 128Z")}
        ${leaf("pumpkin-leaf pumpkin-leaf--front-2", "M151 132 C177 126 197 132 215 142 C191 146 169 138 153 128Z")}
      </g>

      <!-- 4. Ready -->
      <g class="pumpkin-layer pumpkin-layer--ready">
        <!-- Quả bí ngô màu cam, phân múi xếp đè lên nhau -->
        <g class="pumpkin-fruit">
          <!-- Múi ngoài cùng (rộng nhất làm nền) -->
          <ellipse class="pumpkin-rib pumpkin-rib--outer" cx="120" cy="138" rx="40" ry="30" />
          <!-- Múi trung bình -->
          <ellipse class="pumpkin-rib pumpkin-rib--middle" cx="120" cy="138" rx="28" ry="30" />
          <!-- Múi trong cùng (gần nhất) -->
          <ellipse class="pumpkin-rib pumpkin-rib--inner" cx="120" cy="138" rx="14" ry="30" />
          <!-- Cuống quả bí ngô mọc cong lên -->
          <path class="pumpkin-stem-fruit" d="M120 108 C116 100 122 92 128 86 C130 92 126 100 122 108Z" />
        </g>
      </g>

      <!-- 5. Dead -->
      <g class="pumpkin-layer pumpkin-layer--dead">
        <path class="pumpkin-dead-stem" d="M120 136 C105 132 95 128 85 126" />
        ${leaf("pumpkin-dead-leaf pumpkin-dead-leaf--1", "M85 126 C65 128 48 132 32 142 C52 140 70 134 85 126Z")}
        ${leaf("pumpkin-dead-leaf pumpkin-dead-leaf--2", "M120 136 C135 138 150 142 165 150 C150 148 135 142 120 136Z")}
      </g>
    </g>
  `;
}
