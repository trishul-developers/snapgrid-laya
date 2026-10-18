import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const baseDir = path.resolve('.');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const densities = [
  { name: 'mdpi', size: 48, fgSize: 108 },
  { name: 'hdpi', size: 72, fgSize: 162 },
  { name: 'xhdpi', size: 96, fgSize: 216 },
  { name: 'xxhdpi', size: 144, fgSize: 324 },
  { name: 'xxxhdpi', size: 192, fgSize: 432 },
];

const svgStandard = path.join(baseDir, 'store-assets', 'icon-512.svg');
const svgRound = path.join(baseDir, 'store-assets', 'temp_ic_launcher_round.svg');
const svgFg = path.join(baseDir, 'store-assets', 'temp_ic_launcher_foreground.svg');

const roundContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <clipPath id="circle">
      <circle cx="256" cy="256" r="256" />
    </clipPath>
    <linearGradient id="layaBar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F59E0B" />
      <stop offset="50%" stop-color="#EC4899" />
      <stop offset="100%" stop-color="#06B6D4" />
    </linearGradient>

    <g id="neonL">
      <polygon points="0,-98 44,-72 0,-46 -44,-72" fill="#F59E0B" fill-opacity="0.85" stroke="#FEF08A" stroke-width="2" />
      <polygon points="-44,-72 0,-46 0,0 -44,-26" fill="#D97706" fill-opacity="0.75" stroke="#FBBF24" stroke-width="1.5" />
      <polygon points="0,-46 44,-72 44,-26 0,0" fill="#92400E" fill-opacity="0.85" stroke="#F59E0B" stroke-width="1.5" />
    </g>

    <g id="neonS">
      <polygon points="0,-98 44,-72 0,-46 -44,-72" fill="#06B6D4" fill-opacity="0.85" stroke="#CFFAFE" stroke-width="2" />
      <polygon points="-44,-72 0,-46 0,0 -44,-26" fill="#0891B2" fill-opacity="0.75" stroke="#22D3EE" stroke-width="1.5" />
      <polygon points="0,-46 44,-72 44,-26 0,0" fill="#155E75" fill-opacity="0.85" stroke="#06B6D4" stroke-width="1.5" />
    </g>
  </defs>

  <g clip-path="url(#circle)">
    <!-- AMOLED Dark Base -->
    <rect width="512" height="512" fill="#07090E" />

    <!-- Isometric Neon Floor Matrix -->
    <polygon points="256,184 432,288 256,392 80,288" fill="#0B0F19" stroke="#EC4899" stroke-width="2.5" stroke-opacity="0.7" />
    <g stroke="#38BDF8" stroke-width="1.2" stroke-opacity="0.35">
      <line x1="212" y1="210" x2="388" y2="314" />
      <line x1="168" y1="236" x2="344" y2="340" />
      <line x1="124" y1="262" x2="300" y2="366" />
      <line x1="300" y1="210" x2="124" y2="314" />
      <line x1="344" y1="236" x2="168" y2="340" />
      <line x1="388" y1="262" x2="212" y2="366" />
    </g>

    <!-- Standing Neon L-Piece -->
    <use href="#neonL" transform="translate(212, 262)" />
    <use href="#neonL" transform="translate(212, 216)" />
    <use href="#neonL" transform="translate(212, 170)" />
    <use href="#neonL" transform="translate(256, 288)" />

    <!-- Flat Interlocking Neon S-Piece -->
    <use href="#neonS" transform="translate(300, 314)" />
    <use href="#neonS" transform="translate(212, 314)" />
    <use href="#neonS" transform="translate(344, 340)" />
    <use href="#neonS" transform="translate(256, 340)" />

    <!-- Signature "Laya Rhythm Meter" Pill Bar at Bottom -->
    <rect x="136" y="438" width="240" height="12" rx="6" fill="#1E293B" />
    <rect x="136" y="438" width="185" height="12" rx="6" fill="url(#layaBar)" />
  </g>
  <circle cx="256" cy="256" r="254" fill="none" stroke="#1E293B" stroke-width="3" />
</svg>`;

const fgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 432 432" width="432" height="432">
  <defs>
    <linearGradient id="layaBarFg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F59E0B" />
      <stop offset="50%" stop-color="#EC4899" />
      <stop offset="100%" stop-color="#06B6D4" />
    </linearGradient>

    <g id="neonL">
      <polygon points="0,-98 44,-72 0,-46 -44,-72" fill="#F59E0B" fill-opacity="0.85" stroke="#FEF08A" stroke-width="2" />
      <polygon points="-44,-72 0,-46 0,0 -44,-26" fill="#D97706" fill-opacity="0.75" stroke="#FBBF24" stroke-width="1.5" />
      <polygon points="0,-46 44,-72 44,-26 0,0" fill="#92400E" fill-opacity="0.85" stroke="#F59E0B" stroke-width="1.5" />
    </g>

    <g id="neonS">
      <polygon points="0,-98 44,-72 0,-46 -44,-72" fill="#06B6D4" fill-opacity="0.85" stroke="#CFFAFE" stroke-width="2" />
      <polygon points="-44,-72 0,-46 0,0 -44,-26" fill="#0891B2" fill-opacity="0.75" stroke="#22D3EE" stroke-width="1.5" />
      <polygon points="0,-46 44,-72 44,-26 0,0" fill="#155E75" fill-opacity="0.85" stroke="#06B6D4" stroke-width="1.5" />
    </g>
  </defs>

  <!-- Scaled and centered to fit comfortably within Android 72dp (288px) safe zone -->
  <g transform="translate(216, 216) scale(0.66) translate(-256, -280)">
    <!-- Isometric Neon Floor Matrix -->
    <polygon points="256,184 432,288 256,392 80,288" fill="#0B0F19" stroke="#EC4899" stroke-width="2.5" stroke-opacity="0.7" />
    <g stroke="#38BDF8" stroke-width="1.2" stroke-opacity="0.35">
      <line x1="212" y1="210" x2="388" y2="314" />
      <line x1="168" y1="236" x2="344" y2="340" />
      <line x1="124" y1="262" x2="300" y2="366" />
      <line x1="300" y1="210" x2="124" y2="314" />
      <line x1="344" y1="236" x2="168" y2="340" />
      <line x1="388" y1="262" x2="212" y2="366" />
    </g>

    <!-- Standing Neon L-Piece -->
    <use href="#neonL" transform="translate(212, 262)" />
    <use href="#neonL" transform="translate(212, 216)" />
    <use href="#neonL" transform="translate(212, 170)" />
    <use href="#neonL" transform="translate(256, 288)" />

    <!-- Flat Interlocking Neon S-Piece -->
    <use href="#neonS" transform="translate(300, 314)" />
    <use href="#neonS" transform="translate(212, 314)" />
    <use href="#neonS" transform="translate(344, 340)" />
    <use href="#neonS" transform="translate(256, 340)" />

    <!-- Signature "Laya Rhythm Meter" Pill Bar at Bottom -->
    <rect x="136" y="438" width="240" height="12" rx="6" fill="#1E293B" />
    <rect x="136" y="438" width="185" height="12" rx="6" fill="url(#layaBarFg)" />
  </g>
</svg>`;

fs.writeFileSync(svgRound, roundContent, 'utf8');
fs.writeFileSync(svgFg, fgContent, 'utf8');

function render(svgPath, outPath, width, height) {
  const fileUrl = 'file:///' + svgPath.replace(/\\/g, '/');
  execFileSync(chrome, [
    '--headless=new',
    `--screenshot=${outPath}`,
    `--window-size=${width},${height}`,
    '--default-background-color=00000000',
    fileUrl
  ]);
}

for (const d of densities) {
  const targetDir = path.join(baseDir, 'android', 'app', 'src', 'main', 'res', `mipmap-${d.name}`);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // 1. ic_launcher.png
  const outStd = path.join(targetDir, 'ic_launcher.png');
  render(svgStandard, outStd, d.size, d.size);

  // 2. ic_launcher_round.png
  const outRound = path.join(targetDir, 'ic_launcher_round.png');
  render(svgRound, outRound, d.size, d.size);

  // 3. ic_launcher_foreground.png
  const outFg = path.join(targetDir, 'ic_launcher_foreground.png');
  render(svgFg, outFg, d.fgSize, d.fgSize);

  console.log(`Generated mipmap-${d.name}: std=${d.size}x${d.size}, round=${d.size}x${d.size}, fg=${d.fgSize}x${d.fgSize}`);
}

fs.unlinkSync(svgRound);
fs.unlinkSync(svgFg);
console.log('All Android launcher mipmaps successfully updated!');
