export const APP_NAME = "SpriteLab";

export const DEFAULT_PALETTE = [
  "#0b0f19",
  "#ffffff",
  "#94a3b8",
  "#5a6b8c",
  "#ff6187",
  "#ff8a5c",
  "#ffc95c",
  "#f7ff70",
  "#67f5b1",
  "#2bd9a0",
  "#5ad8ff",
  "#3d8bff",
  "#a98bff",
  "#e07bff",
  "#8b5a3c",
  "#c98a5c",
];

export const TOOLS = [
  { id: "pencil", label: "Pencil", shortcut: "B", icon: "pencil", hint: "Draw single pixels" },
  { id: "eraser", label: "Eraser", shortcut: "E", icon: "eraser", hint: "Erase to transparency" },
  { id: "fill", label: "Fill", shortcut: "G", icon: "fill", hint: "Flood fill an area" },
  { id: "picker", label: "Picker", shortcut: "I", icon: "picker", hint: "Pick a colour" },
  { id: "line", label: "Line", shortcut: "L", icon: "line", hint: "Drag to draw a line" },
  { id: "rect", label: "Rect", shortcut: "R", icon: "rect", hint: "Drag to draw a rectangle" },
];

export const SIZES = [16, 32, 64];
export const EXPORT_SCALES = [1, 2, 4, 8, 16, 32];
export const TOOL_COLORS = {
  pencil: "text-mint",
  eraser: "text-amber",
  fill: "text-cyan",
  picker: "text-violet",
  line: "text-rose",
  rect: "text-amber",
};

export const MAX_HISTORY = 80;
export const MAX_PALETTE = 40;
export const MAX_GALLERY = 40;
export const ZOOM_MIN = 2;
export const ZOOM_MAX = 32;
export const DEFAULT_SIZE = 32;
export const DEFAULT_BRUSH_SIZE = 1;
export const BRUSH_SIZE_MIN = 1;
export const BRUSH_SIZE_MAX = 16;

/** Pick a zoom level that makes the board fit comfortably on this screen. */
export function fitZoom(size) {
  if (typeof window === "undefined") return 16;
  const desktop = window.innerWidth >= 1024;
  const availW = desktop
    ? Math.max(280, window.innerWidth - 620)
    : Math.max(220, window.innerWidth - 64);
  const availH = Math.max(
    220,
    window.innerHeight - (desktop ? 250 : 340),
  );
  const target = Math.min(availW, availH, 720);
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.floor(target / size)));
}
