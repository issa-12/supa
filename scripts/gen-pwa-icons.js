// One-off generator for the ReadTrack PWA icons.
// Draws a full-bleed terracotta tile (brand color, works as a maskable icon)
// with a centered white open-book glyph, supersampled 4x for smooth edges.
// Run: node scripts/gen-pwa-icons.js   (requires pngjs available in node_modules)
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const TERRA = [233, 120, 63]; // #E9783F
const WHITE = [255, 255, 255];
const SS = 4; // supersampling factor
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const OUT_DIR = path.join(__dirname, '..', 'public', 'icons');

// Convex-quad hit test: point is inside if it is on the same side of every edge.
function inQuad(px, py, q) {
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const a = q[i];
    const b = q[(i + 1) % 4];
    const cross = (b[0] - a[0]) * (py - a[1]) - (b[1] - a[1]) * (px - a[0]);
    if (cross !== 0) {
      const s = cross > 0 ? 1 : -1;
      if (sign === 0) sign = s;
      else if (s !== sign) return false;
    }
  }
  return true;
}

function renderHiRes(S) {
  const cx = S / 2;
  const cy = S / 2;
  const PW = S * 0.30;       // outer half-width of the book
  const gap = S * 0.018;     // half-gap at the spine
  const leftQuad = [
    [cx - PW, cy - S * 0.30],   // outer top
    [cx - gap, cy - S * 0.17],  // spine top
    [cx - gap, cy + S * 0.32],  // spine bottom
    [cx - PW, cy + S * 0.19],   // outer bottom
  ];
  const rightQuad = [
    [cx + gap, cy - S * 0.17],
    [cx + PW, cy - S * 0.30],
    [cx + PW, cy + S * 0.19],
    [cx + gap, cy + S * 0.32],
  ];
  const buf = Buffer.alloc(S * S * 3);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const white = inQuad(px, py, leftQuad) || inQuad(px, py, rightQuad);
      const c = white ? WHITE : TERRA;
      const idx = (y * S + x) * 3;
      buf[idx] = c[0];
      buf[idx + 1] = c[1];
      buf[idx + 2] = c[2];
    }
  }
  return buf;
}

function downsample(hi, S, size) {
  const png = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0;
      for (let dy = 0; dy < SS; dy++) {
        for (let dx = 0; dx < SS; dx++) {
          const hx = x * SS + dx;
          const hy = y * SS + dy;
          const hidx = (hy * S + hx) * 3;
          r += hi[hidx];
          g += hi[hidx + 1];
          b += hi[hidx + 2];
        }
      }
      const n = SS * SS;
      const oidx = (y * size + x) << 2;
      png.data[oidx] = Math.round(r / n);
      png.data[oidx + 1] = Math.round(g / n);
      png.data[oidx + 2] = Math.round(b / n);
      png.data[oidx + 3] = 255;
    }
  }
  return png;
}

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const size of SIZES) {
  const S = size * SS;
  const hi = renderHiRes(S);
  const png = downsample(hi, S, size);
  const file = path.join(OUT_DIR, `icon-${size}x${size}.png`);
  fs.writeFileSync(file, PNG.sync.write(png));
  console.log('wrote', file);
}
console.log('done');
