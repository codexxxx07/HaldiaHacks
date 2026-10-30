/**
 * Pure pixel-art helpers. Every tool funnels through these functions so the
 * artwork stays a single flat array of hex colours (or null for transparent).
 */

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function createArt(size, fill = null) {
  return new Array(size * size).fill(fill);
}

export function cloneArt(pixels) {
  return pixels.slice();
}

export function normalizeHex(value) {
  if (typeof value !== "string") return null;
  let hex = value.trim().replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  return `#${hex.toLowerCase()}`;
}

export function countFilled(pixels) {
  let total = 0;
  for (let i = 0; i < pixels.length; i += 1) {
    if (pixels[i]) total += 1;
  }
  return total;
}

/** Bresenham line between two cell coordinates (inclusive). */
export function linePoints(x0, y0, x1, y1) {
  const points = [];
  let x = x0;
  let y = y0;
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let error = dx - dy;

  for (;;) {
    points.push([x, y]);
    if (x === x1 && y === y1) break;
    const double = error * 2;
    if (double > -dy) {
      error -= dy;
      x += sx;
    }
    if (double < dx) {
      error += dx;
      y += sy;
    }
  }
  return points;
}

/** Rectangle outline between two opposite corners. */
export function rectPoints(x0, y0, x1, y1) {
  const left = Math.min(x0, x1);
  const right = Math.max(x0, x1);
  const top = Math.min(y0, y1);
  const bottom = Math.max(y0, y1);
  const points = [];

  for (let x = left; x <= right; x += 1) {
    points.push([x, top]);
    if (bottom !== top) points.push([x, bottom]);
  }
  for (let y = top + 1; y < bottom; y += 1) {
    points.push([left, y]);
    if (right !== left) points.push([right, y]);
  }
  return points;
}

/**
 * Paint cells onto a copy of the artwork. Returns null when nothing changed,
 * which keeps no-op strokes out of the undo history.
 */
export function paintCells(base, size, cells, color) {
  let next = base;
  for (let i = 0; i < cells.length; i += 1) {
    const [x, y] = cells[i];
    if (x < 0 || y < 0 || x >= size || y >= size) continue;
    const index = y * size + x;
    if (next[index] === color) continue;
    if (next === base) next = base.slice();
    next[index] = color;
  }
  return next === base ? null : next;
}

/** Four-way flood fill. Returns null when the clicked area already has that colour. */
export function floodFillPixels(pixels, size, startX, startY, color) {
  if (startX < 0 || startY < 0 || startX >= size || startY >= size) return null;
  const startIndex = startY * size + startX;
  const target = pixels[startIndex];
  if (target === color) return null;

  const next = pixels.slice();
  const stack = [startIndex];

  while (stack.length) {
    const index = stack.pop();
    if (next[index] !== target) continue;
    next[index] = color;

    const x = index % size;
    const y = (index - x) / size;
    if (x > 0) stack.push(index - 1);
    if (x < size - 1) stack.push(index + 1);
    if (y > 0) stack.push(index - size);
    if (y < size - 1) stack.push(index + size);
  }
  return next;
}

/**
 * Compact serialisation: transparent cells become ".", palette colours become
 * single characters. Very colour-rich art falls back to a plain array.
 */
export function encodeArt(size, pixels) {
  const colors = [];
  const lookup = new Map();
  let data = "";
  let simple = true;

  for (let i = 0; i < pixels.length; i += 1) {
    const pixel = pixels[i];
    if (!pixel) {
      data += ".";
      continue;
    }
    if (!lookup.has(pixel)) {
      if (colors.length >= ALPHABET.length) {
        simple = false;
        break;
      }
      lookup.set(pixel, colors.length);
      colors.push(pixel);
    }
    data += ALPHABET[lookup.get(pixel)];
  }

  if (simple) return { v: 1, size, colors, data };
  return { v: 1, size, pixels: pixels.map((pixel) => pixel || null) };
}

/** Safely rebuild artwork from storage data. Returns null for invalid data. */
export function decodeArt(art) {
  if (!art || typeof art !== "object") return null;
  const size = Number(art.size);
  if (![16, 32, 64].includes(size)) return null;
  const total = size * size;

  if (Array.isArray(art.pixels)) {
    if (art.pixels.length !== total) return null;
    return {
      size,
      pixels: art.pixels.map((pixel) => normalizeHex(pixel)),
    };
  }

  if (typeof art.data === "string" && Array.isArray(art.colors)) {
    if (art.data.length !== total) return null;
    const colors = art.colors.map((color) => normalizeHex(color));
    const pixels = new Array(total);
    for (let i = 0; i < total; i += 1) {
      const char = art.data[i];
      if (char === ".") {
        pixels[i] = null;
        continue;
      }
      const index = ALPHABET.indexOf(char);
      if (index < 0 || !colors[index]) return null;
      pixels[i] = colors[index];
    }
    return { size, pixels };
  }

  return null;
}

function safeFileName(name) {
  const base = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "pixel-art";
}

/** Rasterise the artwork at an integer scale and download it as a PNG. */
export function downloadPng({ size, pixels, scale = 8, name = "pixel-art" }) {
  const output = document.createElement("canvas");
  const pixelsPerCell = Math.max(1, Math.round(scale));
  output.width = size * pixelsPerCell;
  output.height = size * pixelsPerCell;
  const ctx = output.getContext("2d");
  if (!ctx) return Promise.resolve(false);

  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const color = pixels[y * size + x];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x * pixelsPerCell, y * pixelsPerCell, pixelsPerCell, pixelsPerCell);
    }
  }

  return new Promise((resolve) => {
    output.toBlob((blob) => {
      if (!blob) {
        resolve(false);
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeFileName(name)}-${size}x${size}@${pixelsPerCell}x.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
      resolve(true);
    }, "image/png");
  });
}
