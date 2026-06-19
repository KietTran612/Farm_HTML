import type { SoilPatchState } from "./cropArtTypes";

export function renderSoilPatch(state: SoilPatchState): string {
  return `
    <g class="crop-soil crop-soil--${state}" aria-hidden="true">
      <ellipse class="crop-soil__shadow" cx="120" cy="150" rx="84" ry="22" />
      <path class="crop-soil__top" d="M24 112 L120 64 L216 112 L120 160 Z" />
      <path class="crop-soil__inner" d="M44 112 L120 74 L196 112 L120 150 Z" />
      <path class="crop-soil__top-highlight" d="M58 111 L120 80 L182 111 L120 142 Z" />
      <path class="crop-soil__front-rim" d="M24 112 L120 160 L216 112 L216 126 L120 176 L24 126 Z" />
      <path class="crop-soil__front-highlight" d="M50 125 L120 162 L190 125 L190 130 L120 168 L50 130 Z" />
      <path class="crop-soil__grain crop-soil__grain--left" d="M76 106 C86 101 96 101 106 106" />
      <path class="crop-soil__grain crop-soil__grain--right" d="M134 117 C146 112 158 113 170 119" />
      <path class="crop-soil__crack crop-soil__crack--left" d="M87 117 L103 126 L94 137" />
      <path class="crop-soil__crack crop-soil__crack--right" d="M139 116 L128 128 L145 139" />
    </g>
  `;
}
