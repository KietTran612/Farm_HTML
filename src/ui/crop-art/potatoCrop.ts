import type { CropArtState } from "./cropArtTypes";

function leaf(className: string, d: string): string {
  return `<path class="${className}" d="${d}" />`;
}

export function renderPotatoCrop(state: CropArtState): string {
  return `
    <g class="crop-plant crop-plant--potato crop-plant--${state}" data-crop-anchor="120 132">
      <!-- 1. Seed -->
      <g class="potato-layer potato-layer--seed">
        <ellipse class="potato-seed potato-seed--left" cx="110" cy="132" rx="6" ry="4" />
        <ellipse class="potato-seed potato-seed--right" cx="130" cy="132" rx="4" ry="3" />
      </g>

      <!-- 2. Sprout -->
      <g class="potato-layer potato-layer--sprout">
        <path class="potato-stem potato-stem--sprout" d="M120 136 C118 126 119 116 122 108" />
        ${leaf("potato-leaf potato-leaf--sprout-1", "M122 110 C106 104 94 102 84 98 C98 94 112 100 122 106Z")}
        ${leaf("potato-leaf potato-leaf--sprout-2", "M122 112 C134 104 148 100 158 98 C148 106 134 112 122 114Z")}
      </g>

      <!-- 3. Mature -->
      <g class="potato-layer potato-layer--mature">
        <path class="potato-stem potato-stem--left" d="M120 136 C106 124 92 116 74 110" />
        <path class="potato-stem potato-stem--right" d="M120 136 C134 124 148 116 166 110" />
        ${leaf("potato-leaf potato-leaf--back-1", "M75 110 C50 102 36 94 22 84 C46 82 70 94 88 104Z")}
        ${leaf("potato-leaf potato-leaf--back-2", "M165 110 C190 102 204 94 218 84 C194 82 170 94 152 104Z")}
        ${leaf("potato-leaf potato-leaf--front-1", "M94 124 C72 120 54 124 38 132 C58 134 78 128 92 120Z")}
        ${leaf("potato-leaf potato-leaf--front-2", "M146 124 C168 120 186 124 202 132 C182 134 162 128 148 120Z")}
      </g>

      <!-- 4. Ready -->
      <g class="potato-layer potato-layer--ready">
        <!-- Các củ khoai tây nhô trên mặt đất -->
        <g class="potato-tuber potato-tuber--left">
          <ellipse class="potato-tuber-body" cx="94" cy="136" rx="18" ry="12" transform="rotate(-15 94 136)" />
          <circle class="potato-tuber-eye" cx="84" cy="132" r="1.5" />
          <circle class="potato-tuber-eye" cx="98" cy="140" r="1.5" />
        </g>
        <g class="potato-tuber potato-tuber--right">
          <ellipse class="potato-tuber-body" cx="146" cy="138" rx="16" ry="11" transform="rotate(10 146 138)" />
          <circle class="potato-tuber-eye" cx="152" cy="134" r="1.5" />
          <circle class="potato-tuber-eye" cx="138" cy="142" r="1.5" />
        </g>
      </g>

      <!-- 5. Dead -->
      <g class="potato-layer potato-layer--dead">
        <path class="potato-dead-stem" d="M120 136 C114 128 106 122 96 114" />
        ${leaf("potato-dead-leaf potato-dead-leaf--1", "M96 114 C74 116 58 120 40 128 C58 126 78 120 94 116Z")}
        ${leaf("potato-dead-leaf potato-dead-leaf--2", "M100 120 C118 122 136 126 154 134 C136 132 118 126 102 122Z")}
      </g>
    </g>
  `;
}
