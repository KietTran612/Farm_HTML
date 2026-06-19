import type { CropArtState } from "./cropArtTypes";

export type CarrotCropIds = {
  rootGradientId: string;
};

function leaf(className: string, d: string): string {
  return `<path class="${className}" d="${d}" />`;
}

export function renderCarrotCrop(state: CropArtState, ids: CarrotCropIds): string {
  return `
    <g class="crop-plant crop-plant--carrot crop-plant--${state}" data-crop-anchor="120 132">
      <g class="carrot-layer carrot-layer--seed">
        <ellipse class="carrot-seed carrot-seed--left" cx="108" cy="132" rx="5" ry="8" />
        <ellipse class="carrot-seed carrot-seed--right" cx="128" cy="132" rx="5" ry="8" />
      </g>

      <g class="carrot-layer carrot-layer--sprout">
        <path class="carrot-stem carrot-stem--sprout" d="M120 136 C118 116 122 100 128 88" />
        ${leaf("carrot-leaf carrot-leaf--sprout-left", "M126 103 C100 92 86 84 72 74 C96 72 116 80 130 98Z")}
        ${leaf("carrot-leaf carrot-leaf--sprout-right", "M128 96 C146 76 164 68 188 66 C176 86 154 99 130 107Z")}
      </g>

      <g class="carrot-layer carrot-layer--mature">
        <path class="carrot-stem carrot-stem--center" d="M120 136 C116 108 116 82 119 54" />
        <path class="carrot-stem carrot-stem--left" d="M120 136 C101 112 82 96 48 82" />
        <path class="carrot-stem carrot-stem--right" d="M120 136 C140 110 164 92 198 78" />
        ${leaf("carrot-leaf carrot-leaf--back-left", "M63 87 C36 84 23 76 12 62 C38 55 64 62 82 84 C73 87 69 88 63 87Z")}
        ${leaf("carrot-leaf carrot-leaf--top", "M119 62 C105 40 108 20 122 4 C141 26 140 48 124 70Z")}
        ${leaf("carrot-leaf carrot-leaf--back-right", "M178 84 C198 62 224 56 246 64 C232 80 207 91 177 91Z")}
        ${leaf("carrot-leaf carrot-leaf--front-left", "M86 116 C58 118 42 128 28 144 C55 148 82 138 101 119Z")}
        ${leaf("carrot-leaf carrot-leaf--front-right", "M142 117 C166 126 184 140 198 156 C171 156 148 143 132 120Z")}
      </g>

      <g class="carrot-layer carrot-layer--ready">
        <path class="carrot-root-cap" fill="url(#${ids.rootGradientId})" d="M82 136 C84 107 100 92 120 92 C141 92 157 108 159 136 C151 152 133 158 120 158 C105 158 90 152 82 136Z" />
        <ellipse class="carrot-root-highlight" cx="105" cy="121" rx="16" ry="6" />
        <path class="carrot-root-line carrot-root-line--left" d="M91 142 C101 148 113 151 126 151" />
        <path class="carrot-root-line carrot-root-line--right" d="M144 130 C137 137 130 141 121 143" />
      </g>

      <g class="carrot-layer carrot-layer--dead">
        <path class="carrot-dead-stem carrot-dead-stem--center" d="M120 138 C116 116 114 96 112 74" />
        <path class="carrot-dead-stem carrot-dead-stem--left" d="M118 137 C99 121 78 116 50 118" />
        <path class="carrot-dead-stem carrot-dead-stem--right" d="M122 137 C142 122 164 118 190 122" />
        ${leaf("carrot-dead-leaf carrot-dead-leaf--left", "M62 120 C40 124 29 133 18 148 C42 151 66 140 82 124Z")}
        ${leaf("carrot-dead-leaf carrot-dead-leaf--top", "M112 76 C101 61 102 45 116 30 C130 48 130 64 117 82Z")}
        ${leaf("carrot-dead-leaf carrot-dead-leaf--right", "M174 122 C194 127 208 138 219 154 C195 156 172 144 158 126Z")}
      </g>
    </g>
  `;
}
