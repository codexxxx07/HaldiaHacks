import { decodeArt, encodeArt, normalizeHex } from "./art";
import { MAX_GALLERY, MAX_PALETTE } from "../constants";

const NAMESPACE = "pixel-forge";
const KEYS = {
  session: `${NAMESPACE}:session:v1`,
  gallery: `${NAMESPACE}:gallery:v1`,
  palette: `${NAMESPACE}:palette:v1`,
  theme: `${NAMESPACE}:theme:v1`,
};

function readValue(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeValue(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

function cleanName(value, fallback = "Untitled") {
  if (typeof value !== "string") return fallback;
  const name = value.trim().slice(0, 40);
  return name || fallback;
}

export function loadSession() {
  const stored = readValue(KEYS.session);
  if (!stored) return null;
  const decoded = decodeArt(stored.art);
  if (!decoded) return null;
  const frames = Array.isArray(stored.frames)
    ? stored.frames
        .map((entry) => decodeArt(entry))
        .filter((frame) => frame && frame.size === decoded.size)
        .map((frame) => ({ pixels: frame.pixels }))
    : [];
  return {
    name: cleanName(stored.name),
    size: decoded.size,
    pixels: decoded.pixels,
    frames,
  };
}

/** Autosave the working canvas. Returns false if storage is unavailable. */
export function saveSession({ name, size, pixels, frames }) {
  const payload = {
    name: cleanName(name),
    size,
    art: encodeArt(size, pixels),
    updatedAt: Date.now(),
  };
  if (Array.isArray(frames) && frames.length) {
    payload.frames = frames.map((frame) => encodeArt(size, frame.pixels));
  }
  return writeValue(KEYS.session, payload).ok;
}

/** Returns the saved theme ("dark" | "light"), or null when unset. */
export function loadTheme() {
  const stored = readValue(KEYS.theme);
  return stored === "light" || stored === "dark" ? stored : null;
}

export function saveTheme(theme) {
  return writeValue(KEYS.theme, theme).ok;
}

export function loadPalette() {
  const stored = readValue(KEYS.palette);
  if (!Array.isArray(stored)) return null;
  const seen = new Set();
  const colors = [];
  for (const entry of stored) {
    const color = normalizeHex(entry);
    if (color && !seen.has(color) && colors.length < MAX_PALETTE) {
      seen.add(color);
      colors.push(color);
    }
  }
  return colors.length ? colors : null;
}

export function savePalette(palette) {
  return writeValue(KEYS.palette, palette).ok;
}

export function loadGallery() {
  const stored = readValue(KEYS.gallery);
  if (!Array.isArray(stored)) return [];
  return stored
    .filter((item) => {
      if (!item || typeof item !== "object") return false;
      if (typeof item.id !== "string" || typeof item.name !== "string") return false;
      const decoded = decodeArt(item.art);
      return Boolean(decoded);
    })
    .slice(0, MAX_GALLERY)
    .map((item) => ({
      id: item.id,
      name: cleanName(item.name),
      size: decodeArt(item.art).size,
      art: item.art,
      createdAt: Number(item.createdAt) || Date.now(),
    }));
}

/** Returns { ok, error } so callers can surface quota failures. */
export function saveGallery(items) {
  return writeValue(KEYS.gallery, items);
}
