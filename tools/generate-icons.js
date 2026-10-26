/* ============================================================
   Bah_ngupi icon generator
   Pure Node (no dependencies) — renders the coffee-bean passport
   mark to PNG with anti-aliasing, then writes standard PWA sizes.
   Run: node tools/generate-icons.js
   ============================================================ */
"use strict";

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const OUT_DIR = path.join(__dirname, "..", "assets", "icons");

/* ── PNG encoder ─────────────────────────────────────────── */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuffer, data]);
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  typeBuffer.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(body), 8 + data.length);
  return out;
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

/* ── Renderer ────────────────────────────────────────────── */

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const mix = (a, b, t) => a + (b - a) * t;

function roundedRectSdf(x, y, radius) {
  const qx = Math.abs(x - 0.5) - (0.5 - radius);
  const qy = Math.abs(y - 0.5) - (0.5 - radius);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
}

function overlay(base, colour, alpha) {
  return [
    mix(base[0], colour[0], alpha),
    mix(base[1], colour[1], alpha),
    mix(base[2], colour[2], alpha)
  ];
}

function renderIcon(size, options) {
  const opts = options || {};
  const maskable = Boolean(opts.maskable);
  const samples = size >= 512 ? 3 : 4;
  const contentScale = maskable ? 0.74 : 0.93;
  const data = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let sumA = 0;

      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const nx = (x + (sx + 0.5) / samples) / size;
          const ny = (y + (sy + 0.5) / samples) / size;

          const inside = maskable || roundedRectSdf(nx, ny, 0.225) <= 0;
          if (!inside) continue;

          // Warm background with a soft glow in the upper-left.
          const glow = Math.exp(
            -(((nx - 0.32) ** 2 + (ny - 0.16) ** 2) / (2 * 0.24 * 0.24))
          );
          let colour = [
            18 + glow * 118,
            12 + glow * 68,
            9 + glow * 34
          ];
          const vignette = clamp((ny - 0.45) / 0.55, 0, 1);
          colour = [colour[0] * (1 - vignette * 0.35), colour[1] * (1 - vignette * 0.35), colour[2] * (1 - vignette * 0.35)];

          // Content coordinates (scaled towards the centre for maskable icons).
          const cx = (nx - 0.5) / contentScale;
          const cy = (ny - 0.5) / contentScale;
          const distance = Math.hypot(cx, cy);
          const angle = Math.atan2(cy, cx);

          // Dashed passport ring.
          if (Math.abs(distance - 0.365) < 0.0085) {
            const dash = (((angle + Math.PI) / (Math.PI * 2)) * 26) % 1;
            if (dash < 0.6) {
              colour = overlay(colour, [224, 170, 109], 0.62);
            }
          }

          // Fine inner ring.
          if (Math.abs(distance - 0.305) < 0.0024) {
            colour = overlay(colour, [247, 239, 227], 0.18);
          }

          // Coffee bean coordinates.
          const theta = -0.62;
          const dx = cx;
          const dy = cy - 0.006;
          const u = dx * Math.cos(theta) + dy * Math.sin(theta);
          const v = -dx * Math.sin(theta) + dy * Math.cos(theta);

          // Soft drop shadow.
          const shadow = (u / 0.122) ** 2 + ((v - 0.012) / 0.188) ** 2;
          if (shadow <= 1) {
            colour = overlay(colour, [0, 0, 0], 0.28);
          }

          const bean = (u / 0.112) ** 2 + (v / 0.178) ** 2;
          if (bean <= 1) {
            const t = clamp((v + 0.178) / 0.356, 0, 1);
            let beanColour = [
              mix(243, 183, t),
              mix(207, 118, t),
              mix(156, 67, t)
            ];
            const highlight = clamp(-u / 0.112, 0, 1) * 0.16;
            beanColour = [
              beanColour[0] + (255 - beanColour[0]) * highlight,
              beanColour[1] + (255 - beanColour[1]) * highlight,
              beanColour[2] + (255 - beanColour[2]) * highlight
            ];

            const crease = 0.03 * Math.sin(v / 0.055);
            if (Math.abs(u - crease) < 0.0105 && Math.abs(v) < 0.158) {
              beanColour = [38, 22, 15];
            }

            colour = beanColour;
          }

          // A small sparkle to the upper right of the bean.
          const sx0 = 0.262;
          const sy0 = -0.255;
          const sparkle = Math.abs(cx - sx0) + Math.abs(cy - sy0);
          if (sparkle < 0.032) {
            colour = overlay(colour, [247, 214, 166], 0.8 * (1 - sparkle / 0.032));
          }

          sumR += colour[0];
          sumG += colour[1];
          sumB += colour[2];
          sumA += 1;
        }
      }

      const total = samples * samples;
      const index = (y * size + x) * 4;
      if (sumA > 0) {
        data[index] = Math.round(clamp(sumR / sumA, 0, 255));
        data[index + 1] = Math.round(clamp(sumG / sumA, 0, 255));
        data[index + 2] = Math.round(clamp(sumB / sumA, 0, 255));
        data[index + 3] = Math.round((sumA / total) * 255);
      }
    }
  }

  return encodePng(size, size, data);
}

/* ── Output ──────────────────────────────────────────────── */

function write(name, size, options) {
  const png = renderIcon(size, options);
  fs.writeFileSync(path.join(OUT_DIR, name), png);
  process.stdout.write("  " + name + " (" + Math.round(png.length / 1024) + " KB)\n");
}

fs.mkdirSync(OUT_DIR, { recursive: true });
process.stdout.write("Rendering Bah_ngupi icons…\n");
write("icon-192.png", 192);
write("icon-512.png", 512);
write("icon-maskable-512.png", 512, { maskable: true });
write("apple-touch-icon-180.png", 180);
write("favicon-32.png", 32);
process.stdout.write("Done.\n");
