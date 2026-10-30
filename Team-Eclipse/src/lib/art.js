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

/** Reflect cells across the vertical centre axis (x → size - 1 - x). */
export function mirrorPoints(cells, size) {
  const mirrored = new Array(cells.length);
  for (let i = 0; i < cells.length; i += 1) {
    const cell = cells[i];
    mirrored[i] = [size - 1 - cell[0], cell[1]];
  }
  return mirrored;
}

/**
 * Paint cells onto a copy of the artwork. Returns null when nothing changed,
 * which keeps no-op strokes out of the undo history.
 */
export function paintCells(base, size, cells, color, brushSize = 1) {
  let next = base;
  const span = Math.max(1, Math.floor(brushSize));
  const offset = Math.floor((span - 1) / 2);
  for (let i = 0; i < cells.length; i += 1) {
    const [x, y] = cells[i];
    for (let dy = 0; dy < span; dy += 1) {
      for (let dx = 0; dx < span; dx += 1) {
        const px = x - offset + dx;
        const py = y - offset + dy;
        if (px < 0 || py < 0 || px >= size || py >= size) continue;
        const index = py * size + px;
        if (next[index] === color) continue;
        if (next === base) next = base.slice();
        next[index] = color;
      }
    }
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

/* ------------------------------- Share links ------------------------------ */
/* Artwork is serialised with encodeArt, optionally gzip-compressed, then
 * base64url-encoded so it fits safely inside a URL hash. */

function bytesToBase64Url(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function gzipBytes(text) {
  if (typeof CompressionStream !== "function") return null;
  try {
    const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
    const buffer = await new Response(stream).arrayBuffer();
    return new Uint8Array(buffer);
  } catch {
    return null;
  }
}

async function gunzipText(bytes) {
  if (typeof DecompressionStream !== "function") return null;
  try {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return await new Response(stream).text();
  } catch {
    return null;
  }
}

/** Encode artwork into a compact, URL-safe token for sharing. */
export async function encodeShare(size, pixels) {
  const json = JSON.stringify(encodeArt(size, pixels));
  const packed = await gzipBytes(json);
  if (packed) return `g${bytesToBase64Url(packed)}`;
  return `j${bytesToBase64Url(new TextEncoder().encode(json))}`;
}

/** Decode a share token back into artwork. Returns null for invalid data. */
export async function decodeShare(token) {
  if (typeof token !== "string" || token.length < 2) return null;
  const kind = token[0];
  if (kind !== "g" && kind !== "j") return null;

  let bytes;
  try {
    bytes = base64UrlToBytes(token.slice(1));
  } catch {
    return null;
  }

  try {
    const json = kind === "g" ? await gunzipText(bytes) : new TextDecoder().decode(bytes);
    if (!json) return null;
    return decodeArt(JSON.parse(json));
  } catch {
    return null;
  }
}

/* ------------------------------ Image import ------------------------------ */

function rgbToHex(r, g, b) {
  const value = (1 << 24) | (r << 16) | (g << 8) | b;
  return `#${value.toString(16).slice(1)}`;
}

/**
 * Convert a loaded image into a size×size pixel-art grid. The image is scaled
 * to fit while keeping its aspect ratio (letterboxed with transparency) and
 * sampled in `block`-sized chunks so callers can trade detail for a chunkier
 * look. Runs entirely in the browser — nothing is uploaded anywhere.
 */
export function pixelateImage(image, size, block = 4) {
  const width = image?.naturalWidth || image?.width || 0;
  const height = image?.naturalHeight || image?.height || 0;
  if (!width || !height) return null;

  const span = Math.max(1, Math.floor(block));
  const scale = Math.min(size / width, size / height);
  const drawW = Math.max(1, Math.round(width * scale));
  const drawH = Math.max(1, Math.round(height * scale));
  const offsetX = Math.floor((size - drawW) / 2);
  const offsetY = Math.floor((size - drawH) / 2);

  const sampleW = Math.max(1, Math.round(drawW / span));
  const sampleH = Math.max(1, Math.round(drawH / span));

  const sampler = document.createElement("canvas");
  sampler.width = sampleW;
  sampler.height = sampleH;
  const samplerCtx = sampler.getContext("2d");
  if (!samplerCtx) return null;
  samplerCtx.imageSmoothingEnabled = true;
  samplerCtx.imageSmoothingQuality = "high";
  samplerCtx.drawImage(image, 0, 0, sampleW, sampleH);

  let data;
  try {
    data = samplerCtx.getImageData(0, 0, sampleW, sampleH).data;
  } catch {
    return null;
  }

  const pixels = createArt(size);
  for (let y = 0; y < drawH; y += 1) {
    const gridY = offsetY + y;
    if (gridY < 0 || gridY >= size) continue;
    const sampleY = Math.min(sampleH - 1, Math.floor((y * sampleH) / drawH));
    for (let x = 0; x < drawW; x += 1) {
      const gridX = offsetX + x;
      if (gridX < 0 || gridX >= size) continue;
      const sampleX = Math.min(sampleW - 1, Math.floor((x * sampleW) / drawW));
      const offset = (sampleY * sampleW + sampleX) * 4;
      if (data[offset + 3] < 8) continue;
      pixels[gridY * size + gridX] = rgbToHex(
        data[offset],
        data[offset + 1],
        data[offset + 2],
      );
    }
  }
  return pixels;
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
