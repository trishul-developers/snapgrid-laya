import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const baseDir = path.resolve('.');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const distAssetsDir = path.join(baseDir, 'dist', 'assets');
const cssFile = fs.readdirSync(distAssetsDir).find(f => f.endsWith('.css'));
const cssContent = fs.readFileSync(path.join(distAssetsDir, cssFile), 'utf8');

// Helper to create an HTML page for inner screen capture (at 776x1396)
function generateInnerHtml({
  theme = 'dark',
  palette = 'pastel',
  customStyle = '',
  gridSize = 10,
  score = '2,840',
  best = '12,650',
  combo = null,
  flow = null,
  meterPercent = 60,
  boardCellsHtml = '',
  trayHtml = '',
  extraOverlayHtml = ''
}) {
  const paletteOverrides = {
    pastel: `
      --color-dot: #F43F5E;
      --color-bar: #0EA5E9;
      --color-square: #EAB308;
      --color-corner: #10B981;
      --color-tshape: #8B5CF6;
      --color-zshape: #F97316;
    `,
    neon: `
      --color-dot: #FF007F;
      --color-bar: #00F0FF;
      --color-square: #FFE600;
      --color-corner: #39FF14;
      --color-tshape: #B026FF;
      --color-zshape: #FF5F1F;
    `,
    terracotta: `
      --color-dot: #C85A32;
      --color-bar: #4E786B;
      --color-square: #D4A373;
      --color-corner: #606C38;
      --color-tshape: #8B5D33;
      --color-zshape: #BC6C25;
    `
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    ${cssContent}
    
    :root {
      ${paletteOverrides[palette] || paletteOverrides.pastel}
    }

    html, body {
      width: 776px;
      height: 1396px;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: var(--md-sys-color-bg);
      font-family: system-ui, -apple-system, sans-serif;
    }

    #app-container {
      width: 776px;
      max-width: 776px;
      height: 1396px;
      margin: 0 auto;
      padding: 56px 28px 36px 28px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
      position: relative;
    }

    .brand-title .laya-brand {
      font-size: 1.85rem;
      letter-spacing: 0.14em;
    }
    .brand-title .snapgrid-pill {
      font-size: 1rem;
      padding: 3px 12px;
    }
    .brand-title .version-badge {
      font-size: 0.85rem;
      padding: 3px 8px;
    }
    .brand-title .m3-tag {
      font-size: 0.95rem;
      padding: 3px 10px;
    }
    .mode-subtext {
      font-size: 1.05rem;
      margin-top: 4px;
    }
    .icon-btn {
      width: 52px;
      height: 52px;
    }
    .icon-btn svg {
      width: 26px;
      height: 26px;
    }

    /* Score Card Scaling */
    .score-card {
      border-radius: 24px;
      padding: 16px 24px;
      margin-bottom: 8px;
    }
    .score-label {
      font-size: 0.95rem;
    }
    .score-number {
      font-size: 2.6rem;
    }
    .best-score-number {
      font-size: 1.85rem;
    }
    .badge {
      font-size: 1.05rem;
      padding: 4px 14px;
    }
    .laya-meter-title {
      font-size: 0.9rem;
    }
    .cadence-track {
      height: 8px;
      margin-top: 8px;
    }

    /* Board Container */
    .board-wrapper {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 12px 0;
    }
    .grid-container {
      width: 680px;
      height: 680px;
      max-width: 680px;
      border-radius: 28px;
      padding: 12px;
      gap: 5px;
    }
    .grid-8 {
      grid-template-columns: repeat(8, 1fr);
      grid-template-rows: repeat(8, 1fr);
      gap: 6px;
    }
    .grid-10 {
      grid-template-columns: repeat(10, 1fr);
      grid-template-rows: repeat(10, 1fr);
      gap: 5px;
    }
    .grid-12 {
      grid-template-columns: repeat(12, 1fr);
      grid-template-rows: repeat(12, 1fr);
      gap: 4px;
      padding: 10px;
    }
    .board-cell {
      border-radius: 9px;
    }

    /* Tray Section */
    .tray-container {
      border-radius: 28px;
      padding: 16px 14px;
      min-height: 155px;
      gap: 14px;
    }
    .tray-slot {
      height: 130px;
      border-radius: 20px;
    }

    /* GameOver Banner */
    .gameover-tray-banner {
      border-radius: 26px;
      padding: 18px 22px;
      min-height: 140px;
    }
    .gameover-banner-title {
      font-size: 1.45rem;
    }
    .gameover-banner-sub {
      font-size: 0.95rem;
    }
    .btn-gameover-banner-restart {
      font-size: 1.05rem;
      padding: 12px 24px;
    }
    .btn-gameover-banner-stats {
      font-size: 1.05rem;
      padding: 12px 20px;
    }

    ${customStyle}
  </style>
</head>
<body data-theme="${theme}">
  <div id="app-container">
    <!-- Header -->
    <header class="app-header">
      <div class="brand-group">
        <div class="brand-title">
          <span class="laya-brand">LAYA</span>
          <span class="snapgrid-pill">SNAPGRID</span>
          <span class="version-badge">v0.4.1</span>
          <span class="m3-tag">${gridSize}x${gridSize}</span>
        </div>
        <div class="mode-subtext">
          <span>${gridSize === 8 ? 'Casual (Fast)' : gridSize === 12 ? 'Master (12x12)' : 'Classic (10x10)'}</span>
        </div>
      </div>
      <div class="header-actions">
        <button class="icon-btn" aria-label="Settings">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        </button>
        <button class="icon-btn" aria-label="Restart">
          <svg viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
        </button>
      </div>
    </header>

    <!-- Score Card -->
    <div class="score-card">
      <div class="score-main-row">
        <div class="score-block">
          <span class="score-label">SCORE</span>
          <span class="score-number">${score}</span>
        </div>
        <div class="status-badges">
          ${combo ? `<span class="badge combo-badge active" style="opacity:1; transform:scale(1);">${combo}</span>` : ''}
          ${flow ? `<span class="badge speed-badge active" style="opacity:1; transform:scale(1);">${flow}</span>` : ''}
        </div>
        <div class="score-block best-score-block">
          <span class="score-label">BEST</span>
          <span class="best-score-number">${best}</span>
        </div>
      </div>
      <div class="laya-meter-label-row">
        <span class="laya-meter-title">LAYA CADENCE METER</span>
      </div>
      <div class="cadence-track">
        <div class="cadence-bar" style="width: ${meterPercent}%;"></div>
      </div>
    </div>

    <!-- Board Grid -->
    <div class="board-wrapper">
      <div class="grid-container grid-${gridSize}">
        ${boardCellsHtml}
      </div>
    </div>

    <!-- Tray -->
    ${trayHtml}

    ${extraOverlayHtml}
  </div>
</body>
</html>`;
}

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Helper to wrap inner screen image into 1080x1920 store marketing SVG
function generateMarketingSvg({
  accentColor = '#38BDF8',
  badgeText = '100% OFFLINE • ZERO ADS',
  title = 'MINDFUL 10×10 BLOCK PUZZLE',
  subtitle = 'Relaxing Sanskrit "Laya" Dissolution & Tactile Grid',
  base64Png = ''
}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
  <defs>
    <linearGradient id="bgCanvas" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#070A12" />
      <stop offset="50%" stop-color="#0B0F1C" />
      <stop offset="100%" stop-color="#020408" />
    </linearGradient>
    <radialGradient id="headerGlow" cx="50%" cy="15%" r="45%">
      <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>
    <clipPath id="screenClip">
      <rect x="12" y="12" width="776" height="1396" rx="54" />
    </clipPath>
  </defs>

  <!-- Background Base -->
  <rect width="1080" height="1920" fill="url(#bgCanvas)" />
  <rect width="1080" height="600" fill="url(#headerGlow)" />

  <!-- Top Marketing Header Section -->
  <g transform="translate(0, 110)">
    <!-- Pill Badge -->
    <g transform="translate(540, 0)">
      <rect x="-160" y="0" width="320" height="42" rx="21" fill="rgba(255, 255, 255, 0.08)" stroke="${accentColor}" stroke-width="2" />
      <text x="0" y="27" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="900" fill="${accentColor}" text-anchor="middle" letter-spacing="1.5">${escapeXml(badgeText)}</text>
    </g>

    <!-- Big Headline -->
    <text x="540" y="105" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">
      ${escapeXml(title)}
    </text>

    <!-- Subtitle -->
    <text x="540" y="152" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="700" fill="#94A3B8" text-anchor="middle">
      ${escapeXml(subtitle)}
    </text>
  </g>

  <!-- Centered Phone Showcase Frame -->
  <g transform="translate(140, 360)">
    <!-- Phone Outer Shell -->
    <rect x="0" y="0" width="800" height="1420" rx="64" fill="#020408" stroke="#334155" stroke-width="6" />
    <rect x="12" y="12" width="776" height="1396" rx="54" fill="#090D16" />

    <!-- Embedded Real Game Screen -->
    <image href="data:image/png;base64,${base64Png}" x="12" y="12" width="776" height="1396" clip-path="url(#screenClip)" preserveAspectRatio="xMidYMin slice" />

    <!-- Subtle Screen Glare Border -->
    <rect x="12" y="12" width="776" height="1396" rx="54" fill="none" stroke="rgba(255, 255, 255, 0.08)" stroke-width="2" pointer-events="none" />

    <!-- Dynamic Island / Speaker Notch -->
    <rect x="290" y="24" width="220" height="34" rx="17" fill="#020408" />
    <circle cx="470" cy="41" r="6" fill="#1E293B" />
  </g>
</svg>`;
}

// Generate cell grids
function makeGrid(size, filledMap = {}) {
  let html = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const key = `${r},${c}`;
      const fill = filledMap[key];
      if (fill) {
        const cls = fill.cls ? `board-cell ${fill.cls}` : 'board-cell filled';
        const st = fill.color ? `background: ${fill.color};` : '';
        html += `<div class="${cls}" style="${st}"></div>`;
      } else {
        html += `<div class="board-cell"></div>`;
      }
    }
  }
  return html;
}

// Generate tray piece HTML
function makePiece(matrix, colorVar, tileSize = 24) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  let tiles = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (matrix[r][c]) {
        tiles += `<div class="tray-piece-tile" style="grid-row: ${r+1}; grid-column: ${c+1}; width: ${tileSize}px; height: ${tileSize}px; background: ${colorVar};"></div>`;
      }
    }
  }
  return `<div class="tray-piece" style="display: grid; grid-template-columns: repeat(${cols}, ${tileSize}px); grid-template-rows: repeat(${rows}, ${tileSize}px); gap: 4px;">${tiles}</div>`;
}

console.log('Building real in-game screenshots (1, 2, 3, 5, 6)...');

const tempDir = path.join(baseDir, 'temp-shots');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

function renderScreenToPng(htmlStr, outPng) {
  const tmpHtml = path.join(tempDir, `temp-${Date.now()}.html`);
  fs.writeFileSync(tmpHtml, htmlStr, 'utf8');
  execFileSync(chrome, [
    '--headless=new',
    `--screenshot=${outPng}`,
    '--window-size=776,1396',
    '--hide-scrollbars',
    '--default-background-color=090D16',
    'file:///' + tmpHtml.replace(/\\/g, '/')
  ]);
  fs.unlinkSync(tmpHtml);
}

function renderSvgToPng(svgStr, outSvg, outPng) {
  fs.writeFileSync(outSvg, svgStr, 'utf8');
  execFileSync(chrome, [
    '--headless=new',
    `--screenshot=${outPng}`,
    '--window-size=1080,1920',
    '--hide-scrollbars',
    '--default-background-color=00000000',
    'file:///' + outSvg.replace(/\\/g, '/')
  ]);
}

// ==========================================
// SCREENSHOT 1: Classic Puzzle (10x10)
// ==========================================
console.log('Rendering Screenshot 1: Classic Puzzle...');
const map1 = {};
// Some placed blocks across 10x10
[[7,0],[7,1],[7,2],[7,3],[7,4],[7,5],[7,6],[7,7]].forEach(([r,c]) => map1[`${r},${c}`] = { cls: 'filled', color: 'var(--color-bar)' });
[[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,6],[8,7],[8,8]].forEach(([r,c]) => map1[`${r},${c}`] = { cls: 'filled', color: 'var(--color-square)' });
[[9,0],[9,1],[9,2],[9,3],[9,4],[9,5],[9,6],[9,7],[9,8],[9,9]].forEach(([r,c]) => map1[`${r},${c}`] = { cls: 'filled', color: 'var(--color-dot)' });
[[5,2],[5,3],[6,2],[6,3]].forEach(([r,c]) => map1[`${r},${c}`] = { cls: 'filled', color: 'var(--color-square)' });
[[3,7],[4,7],[5,7],[5,8]].forEach(([r,c]) => map1[`${r},${c}`] = { cls: 'filled', color: 'var(--color-corner)' });
[[2,1],[3,1],[4,1]].forEach(([r,c]) => map1[`${r},${c}`] = { cls: 'filled', color: 'var(--color-tshape)' });
// Active Ghost Preview: an amber 2x2 square dropping at [4,4]
[[4,4],[4,5],[5,4],[5,5]].forEach(([r,c]) => map1[`${r},${c}`] = { cls: 'ghost', color: 'var(--color-zshape)' });

const tray1 = `
<div class="tray-container tray-3">
  <div class="tray-slot">${makePiece([[1,1],[1,1]], 'var(--color-zshape)', 26)}</div>
  <div class="tray-slot">${makePiece([[1,1,1]], 'var(--color-bar)', 26)}</div>
  <div class="tray-slot">${makePiece([[1,0],[1,0],[1,1]], 'var(--color-corner)', 24)}</div>
</div>`;

const innerHtml1 = generateInnerHtml({
  theme: 'dark',
  palette: 'pastel',
  gridSize: 10,
  score: '2,840',
  best: '12,650',
  combo: 'Combo x2',
  flow: '⚡ Laya Flow x1',
  meterPercent: 55,
  boardCellsHtml: makeGrid(10, map1),
  trayHtml: tray1
});

const innerPng1 = path.join(tempDir, 'inner-1.png');
renderScreenToPng(innerHtml1, innerPng1);
const b64_1 = fs.readFileSync(innerPng1).toString('base64');

const svg1 = generateMarketingSvg({
  accentColor: '#38BDF8',
  badgeText: '100% OFFLINE • ZERO ADS',
  title: 'MINDFUL 10×10 BLOCK PUZZLE',
  subtitle: 'Relaxing Sanskrit "Laya" Dissolution & Tactile Grid',
  base64Png: b64_1
});
renderSvgToPng(
  svg1,
  path.join(baseDir, 'store-assets', 'screenshots', 'screenshot-1-classic-puzzle.svg'),
  path.join(baseDir, 'store-assets', 'screenshots', 'screenshot-1-classic-puzzle.png')
);
console.log('✓ Screenshot 1 complete.');

// ==========================================
// SCREENSHOT 2: Speed Flow & Combos
// ==========================================
console.log('Rendering Screenshot 2: Cadence & Combo...');
const map2 = {};
// Row 6 and Row 8 are clearing!
for (let c = 0; c < 10; c++) {
  map2[`6,${c}`] = { cls: 'filled line-preview', color: 'var(--color-bar)' };
  map2[`8,${c}`] = { cls: 'filled clearing', color: 'var(--color-square)' };
}
[[4,0],[5,0],[7,0]].forEach(([r,c]) => map2[`${r},${c}`] = { cls: 'filled', color: 'var(--color-dot)' });
[[3,3],[4,3],[5,3]].forEach(([r,c]) => map2[`${r},${c}`] = { cls: 'filled', color: 'var(--color-tshape)' });
[[2,7],[3,7],[4,7],[5,7]].forEach(([r,c]) => map2[`${r},${c}`] = { cls: 'filled', color: 'var(--color-corner)' });
[[9,2],[9,3],[9,4],[9,5]].forEach(([r,c]) => map2[`${r},${c}`] = { cls: 'filled', color: 'var(--color-zshape)' });

const tray2 = `
<div class="tray-container tray-3">
  <div class="tray-slot">${makePiece([[1,1,1,1]], 'var(--color-bar)', 24)}</div>
  <div class="tray-slot">${makePiece([[0,1],[1,1],[1,0]], 'var(--color-zshape)', 24)}</div>
  <div class="tray-slot">${makePiece([[1,1],[1,1]], 'var(--color-dot)', 26)}</div>
</div>`;

const floatingScoreHtml = `
<div class="floating-scores-layer">
  <div class="floating-score" style="top: 50%; left: 50%; font-size: 1.8rem; color: #F59E0B; text-shadow: 0 4px 12px rgba(245, 158, 11, 0.8);">+720 FLOW COMBO!</div>
</div>`;

const innerHtml2 = generateInnerHtml({
  theme: 'dark',
  palette: 'pastel',
  gridSize: 10,
  score: '6,420',
  best: '12,650',
  combo: 'Combo x4 🔥',
  flow: '⚡ Laya Flow x3',
  meterPercent: 88,
  boardCellsHtml: makeGrid(10, map2),
  trayHtml: tray2,
  extraOverlayHtml: floatingScoreHtml
});

const innerPng2 = path.join(tempDir, 'inner-2.png');
renderScreenToPng(innerHtml2, innerPng2);
const b64_2 = fs.readFileSync(innerPng2).toString('base64');

const svg2 = generateMarketingSvg({
  accentColor: '#F59E0B',
  badgeText: 'FLOW CADENCE & COMBOS',
  title: 'DYNAMIC LAYA CADENCE',
  subtitle: 'Keep Placed Blocks Flowing to Multi-Score',
  base64Png: b64_2
});
renderSvgToPng(
  svg2,
  path.join(baseDir, 'store-assets', 'screenshots', 'screenshot-2-cadence-combo.svg'),
  path.join(baseDir, 'store-assets', 'screenshots', 'screenshot-2-cadence-combo.png')
);
console.log('✓ Screenshot 2 complete.');

// ==========================================
// SCREENSHOT 3: Multi-Grid Adaptability (8x8 & 12x12)
// ==========================================
console.log('Rendering Screenshot 3: Multi-Grid Adaptability...');
const map3 = {};
// 8x8 Compact Board
[[5,0],[5,1],[5,2],[5,3],[5,4],[5,5],[5,6]].forEach(([r,c]) => map3[`${r},${c}`] = { cls: 'filled', color: 'var(--color-bar)' });
[[6,1],[6,2],[6,3],[6,4],[6,5],[6,6],[6,7]].forEach(([r,c]) => map3[`${r},${c}`] = { cls: 'filled', color: 'var(--color-corner)' });
[[7,0],[7,1],[7,2],[7,3],[7,4],[7,5],[7,6],[7,7]].forEach(([r,c]) => map3[`${r},${c}`] = { cls: 'filled', color: 'var(--color-square)' });
[[3,3],[3,4],[4,3],[4,4]].forEach(([r,c]) => map3[`${r},${c}`] = { cls: 'filled', color: 'var(--color-dot)' });
[[2,1],[3,1],[4,1]].forEach(([r,c]) => map3[`${r},${c}`] = { cls: 'filled', color: 'var(--color-tshape)' });

const tray3 = `
<div class="tray-container tray-3">
  <div class="tray-slot">${makePiece([[1,1,1]], 'var(--color-corner)', 28)}</div>
  <div class="tray-slot">${makePiece([[1,1],[1,1]], 'var(--color-square)', 28)}</div>
  <div class="tray-slot">${makePiece([[1],[1]], 'var(--color-dot)', 28)}</div>
</div>`;

const innerHtml3 = generateInnerHtml({
  theme: 'dark',
  palette: 'pastel',
  gridSize: 8,
  score: '3,150',
  best: '9,800',
  combo: 'Combo x2',
  flow: '⚡ Laya Flow x2',
  meterPercent: 70,
  boardCellsHtml: makeGrid(8, map3),
  trayHtml: tray3
});

const innerPng3 = path.join(tempDir, 'inner-3.png');
renderScreenToPng(innerHtml3, innerPng3);
const b64_3 = fs.readFileSync(innerPng3).toString('base64');

const svg3 = generateMarketingSvg({
  accentColor: '#10B981',
  badgeText: '8×8 • 10×10 • 12×12 BOARDS',
  title: 'ADAPTIVE GRID SIZES',
  subtitle: 'Switch Between Compact Quick Play & Grand Masters',
  base64Png: b64_3
});
renderSvgToPng(
  svg3,
  path.join(baseDir, 'store-assets', 'screenshots', 'screenshot-3-multigrid.svg'),
  path.join(baseDir, 'store-assets', 'screenshots', 'screenshot-3-multigrid.png')
);
console.log('✓ Screenshot 3 complete.');

// ==========================================
// SCREENSHOT 5: Curated Color Palettes (Cyber Neon)
// ==========================================
console.log('Rendering Screenshot 5: Color Themes...');
const map5 = {};
// Vibrant Cyber Neon pattern
[[6,0],[6,1],[6,2],[6,3],[6,4],[6,5],[6,6],[6,7],[6,8]].forEach(([r,c]) => map5[`${r},${c}`] = { cls: 'filled', color: 'var(--color-bar)' });
[[7,2],[7,3],[7,4],[7,5],[7,6],[7,7],[7,8],[7,9]].forEach(([r,c]) => map5[`${r},${c}`] = { cls: 'filled', color: 'var(--color-dot)' });
[[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,6],[8,7],[8,8],[8,9]].forEach(([r,c]) => map5[`${r},${c}`] = { cls: 'filled', color: 'var(--color-corner)' });
[[4,4],[4,5],[5,4],[5,5]].forEach(([r,c]) => map5[`${r},${c}`] = { cls: 'filled', color: 'var(--color-square)' });
[[3,1],[4,1],[5,1]].forEach(([r,c]) => map5[`${r},${c}`] = { cls: 'filled', color: 'var(--color-tshape)' });
[[2,8],[3,8],[4,8],[4,9]].forEach(([r,c]) => map5[`${r},${c}`] = { cls: 'filled', color: 'var(--color-zshape)' });

const tray5 = `
<div class="tray-container tray-3">
  <div class="tray-slot">${makePiece([[1,1],[1,1]], 'var(--color-square)', 26)}</div>
  <div class="tray-slot">${makePiece([[0,1,0],[1,1,1]], 'var(--color-tshape)', 24)}</div>
  <div class="tray-slot">${makePiece([[1,1,1]], 'var(--color-bar)', 26)}</div>
</div>`;

const innerHtml5 = generateInnerHtml({
  theme: 'dark',
  palette: 'neon',
  gridSize: 10,
  score: '5,180',
  best: '14,200',
  combo: 'Combo x3',
  flow: '⚡ Laya Flow x2',
  meterPercent: 80,
  boardCellsHtml: makeGrid(10, map5),
  trayHtml: tray5
});

const innerPng5 = path.join(tempDir, 'inner-5.png');
renderScreenToPng(innerHtml5, innerPng5);
const b64_5 = fs.readFileSync(innerPng5).toString('base64');

const svg5 = generateMarketingSvg({
  accentColor: '#EC4899',
  badgeText: 'AMOLED DARK & MATERIAL LIGHT',
  title: 'CURATED COLOR THEMES',
  subtitle: 'Cyber Neon, Earthy Terracotta & Pastel Palettes',
  base64Png: b64_5
});
renderSvgToPng(
  svg5,
  path.join(baseDir, 'store-assets', 'screenshots', 'screenshot-5-themes-palettes.svg'),
  path.join(baseDir, 'store-assets', 'screenshots', 'screenshot-5-themes-palettes.png')
);
console.log('✓ Screenshot 5 complete.');

// ==========================================
// SCREENSHOT 6: End-of-Game Board Review Banner
// ==========================================
console.log('Rendering Screenshot 6: Game Over Review...');
const map6 = {};
// Grid packed with blocks triggering game over
for (let r = 2; r < 10; r++) {
  for (let c = 0; c < 10; c++) {
    if ((r + c) % 5 !== 0) {
      const colors = ['var(--color-dot)', 'var(--color-bar)', 'var(--color-square)', 'var(--color-corner)', 'var(--color-tshape)', 'var(--color-zshape)'];
      map6[`${r},${c}`] = { cls: 'filled', color: colors[(r * 3 + c) % colors.length] };
    }
  }
}

const banner6 = `
<div class="gameover-tray-banner" id="gameover-banner" style="display: flex; position: relative;">
  <div class="gameover-banner-content" style="width: 100%; display: flex; align-items: center; justify-content: space-between;">
    <div class="gameover-banner-text" style="display: flex; flex-direction: column; gap: 4px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="gameover-pulse-dot" style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #EF4444; box-shadow: 0 0 10px #EF4444;"></span>
        <span class="gameover-banner-title" style="font-size: 1.45rem; font-weight: 900; color: #FFFFFF;">Game Over</span>
      </div>
      <span class="gameover-banner-sub" style="font-size: 0.95rem; color: #94A3B8;">Review board • Tap below to play again</span>
    </div>
    <div class="gameover-banner-actions" style="display: flex; align-items: center; gap: 10px;">
      <button class="btn btn-primary btn-gameover-banner-restart" style="display: flex; align-items: center; gap: 8px; font-weight: 800; border-radius: 14px; background: #38BDF8; color: #082F49; border: none;">
        <svg viewBox="0 0 24 24" style="width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2.5;"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
        <span>Play Again</span>
      </button>
      <button class="btn btn-tonal btn-gameover-banner-stats" style="font-weight: 700; border-radius: 14px; background: #1E293B; color: #F1F5F9; border: none;">
        Stats
      </button>
    </div>
  </div>
</div>`;

const innerHtml6 = generateInnerHtml({
  theme: 'dark',
  palette: 'pastel',
  gridSize: 10,
  score: '8,750',
  best: '12,650',
  combo: null,
  flow: null,
  meterPercent: 0,
  boardCellsHtml: makeGrid(10, map6),
  trayHtml: banner6
});

const innerPng6 = path.join(tempDir, 'inner-6.png');
renderScreenToPng(innerHtml6, innerPng6);
const b64_6 = fs.readFileSync(innerPng6).toString('base64');

const svg6 = generateMarketingSvg({
  accentColor: '#8B5CF6',
  badgeText: 'STRATEGY & BOARD REVIEW',
  title: 'END-OF-GAME BOARD REVIEW',
  subtitle: 'Analyze Your Grid & Jump Straight Back Into Play',
  base64Png: b64_6
});
renderSvgToPng(
  svg6,
  path.join(baseDir, 'store-assets', 'screenshots', 'screenshot-6-gameover-review.svg'),
  path.join(baseDir, 'store-assets', 'screenshots', 'screenshot-6-gameover-review.png')
);
console.log('✓ Screenshot 6 complete.');

fs.rmSync(tempDir, { recursive: true, force: true });
console.log('🎉 All in-game screenshots rendered and saved successfully!');
