import type { CropArtState } from "./cropArtTypes";

export function renderWheatCrop(state: CropArtState): string {
  return `
    <g class="crop-plant crop-plant--wheat crop-plant--${state}" data-crop-anchor="120 132">
      <!-- 1. Seed -->
      <g class="wheat-layer wheat-layer--seed">
        <ellipse class="wheat-seed wheat-seed--left" cx="114" cy="132" rx="3" ry="5" transform="rotate(-15 114 132)" />
        <ellipse class="wheat-seed wheat-seed--right" cx="126" cy="132" rx="3" ry="5" transform="rotate(15 126 132)" />
      </g>

      <!-- 2. Sprout -->
      <g class="wheat-layer wheat-layer--sprout">
        <!-- Các dải lá cỏ mọc thẳng đứng nhọn hoắt -->
        <path class="wheat-stalk wheat-stalk--sprout-1" d="M112 136 C110 120 114 108 116 96" />
        <path class="wheat-stalk wheat-stalk--sprout-2" d="M120 136 C120 118 122 104 125 90" />
        <path class="wheat-stalk wheat-stalk--sprout-3" d="M128 136 C130 122 128 112 126 100" />
      </g>

      <!-- 3. Mature -->
      <g class="wheat-layer wheat-layer--mature">
        <!-- Cụm lá lúa mì đứng thẳng hơi tẽ nhẹ sang hai bên -->
        <path class="wheat-stalk wheat-stalk--mature-left" d="M120 136 C110 102 96 82 86 64" />
        <path class="wheat-stalk wheat-stalk--mature-center" d="M120 136 C120 96 118 72 120 50" />
        <path class="wheat-stalk wheat-stalk--mature-right" d="M120 136 C130 102 144 82 154 64" />

        <!-- Các đầu bông xanh lục nhạt bắt đầu hình thành -->
        <g class="wheat-head wheat-head--mature-left" transform="translate(86, 64) rotate(-20)">
          <ellipse class="wheat-kernel" cx="-4" cy="-6" rx="4" ry="2.5" />
          <ellipse class="wheat-kernel" cx="4" cy="-11" rx="4" ry="2.5" />
          <ellipse class="wheat-kernel" cx="-4" cy="-16" rx="4" ry="2.5" />
          <ellipse class="wheat-kernel" cx="4" cy="-21" rx="4" ry="2.5" />
          <path class="wheat-beard" d="M-4 -6 L-10 -12 M4 -11 L10 -17 M-4 -16 L-10 -22 M4 -21 L10 -27" />
        </g>
        <g class="wheat-head wheat-head--mature-center" transform="translate(120, 50)">
          <ellipse class="wheat-kernel" cx="-4" cy="-6" rx="4" ry="2.5" />
          <ellipse class="wheat-kernel" cx="4" cy="-11" rx="4" ry="2.5" />
          <ellipse class="wheat-kernel" cx="-4" cy="-16" rx="4" ry="2.5" />
          <ellipse class="wheat-kernel" cx="4" cy="-21" rx="4" ry="2.5" />
          <path class="wheat-beard" d="M-4 -6 L-10 -12 M4 -11 L10 -17 M-4 -16 L-10 -22 M4 -21 L10 -27" />
        </g>
        <g class="wheat-head wheat-head--mature-right" transform="translate(154, 64) rotate(20)">
          <ellipse class="wheat-kernel" cx="-4" cy="-6" rx="4" ry="2.5" />
          <ellipse class="wheat-kernel" cx="4" cy="-11" rx="4" ry="2.5" />
          <ellipse class="wheat-kernel" cx="-4" cy="-16" rx="4" ry="2.5" />
          <ellipse class="wheat-kernel" cx="4" cy="-21" rx="4" ry="2.5" />
          <path class="wheat-beard" d="M-4 -6 L-10 -12 M4 -11 L10 -17 M-4 -16 L-10 -22 M4 -21 L10 -27" />
        </g>
      </g>

      <!-- 4. Ready -->
      <g class="wheat-layer wheat-layer--ready">
        <!-- Khóm lúa chín vàng trĩu bông nhẹ -->
        <!-- Thân cây -->
        <path class="wheat-stalk wheat-stalk--ready-1" d="M120 136 C106 98 84 76 68 56" />
        <path class="wheat-stalk wheat-stalk--ready-2" d="M120 136 C112 94 102 70 94 44" />
        <path class="wheat-stalk wheat-stalk--ready-3" d="M120 136 C120 92 120 64 120 36" />
        <path class="wheat-stalk wheat-stalk--ready-4" d="M120 136 C128 94 138 70 146 44" />
        <path class="wheat-stalk wheat-stalk--ready-5" d="M120 136 C134 98 156 76 172 56" />

        <!-- Các bông lúa vàng trĩu chéo hạt -->
        <g class="wheat-head wheat-head--ready-1" transform="translate(68, 56) rotate(-35)">
          <ellipse class="wheat-kernel" cx="-5" cy="-7" rx="5.5" ry="3.5" />
          <ellipse class="wheat-kernel" cx="5" cy="-13" rx="5.5" ry="3.5" />
          <ellipse class="wheat-kernel" cx="-5" cy="-19" rx="5.5" ry="3.5" />
          <ellipse class="wheat-kernel" cx="5" cy="-25" rx="5.5" ry="3.5" />
          <ellipse class="wheat-kernel" cx="0" cy="-31" rx="5" ry="3.5" />
          <path class="wheat-beard" d="M-5 -7 L-14 -15 M5 -13 L14 -21 M-5 -19 L-14 -27 M5 -25 L14 -33 M0 -31 L0 -42" />
        </g>
        <g class="wheat-head wheat-head--ready-2" transform="translate(94, 44) rotate(-15)">
          <ellipse class="wheat-kernel" cx="-5" cy="-7" rx="5.5" ry="3.5" />
          <ellipse class="wheat-kernel" cx="5" cy="-13" rx="5.5" ry="3.5" />
          <ellipse class="wheat-kernel" cx="-5" cy="-19" rx="5.5" ry="3.5" />
          <ellipse class="wheat-kernel" cx="5" cy="-25" rx="5.5" ry="3.5" />
          <ellipse class="wheat-kernel" cx="0" cy="-31" rx="5" ry="3.5" />
          <path class="wheat-beard" d="M-5 -7 L-14 -15 M5 -13 L14 -21 M-5 -19 L-14 -27 M5 -25 L14 -33 M0 -31 L0 -42" />
        </g>
        <g class="wheat-head wheat-head--ready-3" transform="translate(120, 36)">
          <ellipse class="wheat-kernel" cx="-5" cy="-7" rx="5.5" ry="3.5" />
          <ellipse class="wheat-kernel" cx="5" cy="-13" rx="5.5" ry="3.5" />
          <ellipse class="wheat-kernel" cx="-5" cy="-19" rx="5.5" ry="3.5" />
          <ellipse class="wheat-kernel" cx="5" cy="-25" rx="5.5" ry="3.5" />
          <ellipse class="wheat-kernel" cx="0" cy="-31" rx="5" ry="3.5" />
          <path class="wheat-beard" d="M-5 -7 L-14 -15 M5 -13 L14 -21 M-5 -19 L-14 -27 M5 -25 L14 -33 M0 -31 L0 -42" />
        </g>
        <g class="wheat-head wheat-head--ready-4" transform="translate(146, 44) rotate(15)">
          <ellipse class="wheat-kernel" cx="-5" cy="-7" rx="5.5" ry="3.5" />
          <ellipse class="wheat-kernel" cx="5" cy="-13" rx="5.5" ry="3.5" />
          <ellipse class="wheat-kernel" cx="-5" cy="-19" rx="5.5" ry="3.5" />
          <ellipse class="wheat-kernel" cx="5" cy="-25" rx="5.5" ry="3.5" />
          <ellipse class="wheat-kernel" cx="0" cy="-31" rx="5" ry="3.5" />
          <path class="wheat-beard" d="M-5 -7 L-14 -15 M5 -13 L14 -21 M-5 -19 L-14 -27 M5 -25 L14 -33 M0 -31 L0 -42" />
        </g>
        <g class="wheat-head wheat-head--ready-5" transform="translate(172, 56) rotate(35)">
          <ellipse class="wheat-kernel" cx="-5" cy="-7" rx="5.5" ry="3.5" />
          <ellipse class="wheat-kernel" cx="5" cy="-13" rx="5.5" ry="3.5" />
          <ellipse class="wheat-kernel" cx="-5" cy="-19" rx="5.5" ry="3.5" />
          <ellipse class="wheat-kernel" cx="5" cy="-25" rx="5.5" ry="3.5" />
          <ellipse class="wheat-kernel" cx="0" cy="-31" rx="5" ry="3.5" />
          <path class="wheat-beard" d="M-5 -7 L-14 -15 M5 -13 L14 -21 M-5 -19 L-14 -27 M5 -25 L14 -33 M0 -31 L0 -42" />
        </g>
      </g>

      <!-- 5. Dead -->
      <g class="wheat-layer wheat-layer--dead">
        <!-- Thân lúa khô héo ngã rạp -->
        <path class="wheat-dead-stalk" d="M120 136 C105 130 84 132 60 134" />
        <path class="wheat-dead-stalk" d="M120 136 C124 122 138 124 165 132" />
        <!-- Bông héo rạp đất -->
        <g class="wheat-head wheat-head--dead-left" transform="translate(60, 134) rotate(-85)">
          <ellipse class="wheat-kernel" cx="-4" cy="-5" rx="4.5" ry="3" />
          <ellipse class="wheat-kernel" cx="4" cy="-10" rx="4.5" ry="3" />
          <path class="wheat-beard" d="M-4 -5 L-11 -12 M4 -10 L11 -17" />
        </g>
        <g class="wheat-head wheat-head--dead-right" transform="translate(165, 132) rotate(80)">
          <ellipse class="wheat-kernel" cx="-4" cy="-5" rx="4.5" ry="3" />
          <ellipse class="wheat-kernel" cx="4" cy="-10" rx="4.5" ry="3" />
          <path class="wheat-beard" d="M-4 -5 L-11 -12 M4 -10 L11 -17" />
        </g>
      </g>
    </g>
  `;
}
