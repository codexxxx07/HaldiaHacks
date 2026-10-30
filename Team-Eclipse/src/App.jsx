import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import CanvasStage from "./components/CanvasStage";
import FramesPanel from "./components/FramesPanel";
import GalleryPanel from "./components/GalleryPanel";
import Header from "./components/Header";
import ImportPanel from "./components/ImportPanel";
import PalettePanel from "./components/PalettePanel";
import SidePanel from "./components/SidePanel";
import Toast from "./components/Toast";
import ToolPanel from "./components/ToolPanel";
import {
  DEFAULT_BRUSH_SIZE,
  DEFAULT_PALETTE,
  DEFAULT_SIZE,
  MAX_GALLERY,
  MAX_HISTORY,
  MAX_PALETTE,
  TOOLS,
  ZOOM_MAX,
  ZOOM_MIN,
  fitZoom,
} from "./constants";
import {
  countFilled,
  createArt,
  decodeArt,
  decodeShare,
  downloadPng,
  encodeArt,
  encodeShare,
  normalizeHex,
} from "./lib/art";
import {
  loadGallery,
  loadPalette,
  loadSession,
  loadTheme,
  saveGallery,
  savePalette,
  saveSession,
  saveTheme,
} from "./lib/storage";

function documentReducer(state, action) {
  switch (action.type) {
    case "live":
      if (state.pixels === action.pixels) return state;
      return { ...state, pixels: action.pixels };
    case "push":
      return {
        ...state,
        past: [...state.past, action.snapshot].slice(-MAX_HISTORY),
        future: [],
      };
    case "undo": {
      if (!state.past.length) return state;
      const previous = state.past[state.past.length - 1];
      return {
        pixels: previous,
        past: state.past.slice(0, -1),
        future: [state.pixels, ...state.future].slice(0, MAX_HISTORY),
      };
    }
    case "redo": {
      if (!state.future.length) return state;
      const [next, ...rest] = state.future;
      return {
        pixels: next,
        past: [...state.past, state.pixels].slice(-MAX_HISTORY),
        future: rest,
      };
    }
    case "reset":
      return { pixels: action.pixels, past: [], future: [] };
    default:
      return state;
  }
}

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const SHARE_HASH_KEY = "art";

/** Copy text to the clipboard, falling back to a hidden textarea. */
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy path below.
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

export default function App() {
  const [boot] = useState(() => {
    const saved = loadSession();
    const size = saved?.size ?? DEFAULT_SIZE;
    const frames =
      saved?.frames?.length
        ? saved.frames.map((frame) => ({ id: makeId(), pixels: frame.pixels }))
        : [{ id: makeId(), pixels: saved?.pixels ?? createArt(DEFAULT_SIZE) }];
    return {
      name: saved?.name ?? "Untitled",
      size,
      frames,
      activeFrameId: frames[0].id,
      pixels: frames[0].pixels,
    };
  });

  const [doc, dispatch] = useReducer(documentReducer, {
    pixels: boot.pixels,
    past: [],
    future: [],
  });
  const [size, setSize] = useState(boot.size);
  const [name, setName] = useState(boot.name);
  const [frames, setFrames] = useState(boot.frames);
  const [activeFrameId, setActiveFrameId] = useState(boot.activeFrameId);
  const [playing, setPlaying] = useState(false);
  const [fps, setFps] = useState(8);
  const [playIndex, setPlayIndex] = useState(0);
  const [palette, setPalette] = useState(
    () => loadPalette() ?? DEFAULT_PALETTE.slice(),
  );
  const [color, setColor] = useState(
    () => palette[8] ?? palette[0] ?? "#67f5b1",
  );
  const [gallery, setGallery] = useState(() => loadGallery());
  const [tool, setTool] = useState("pencil");
  const [mirror, setMirror] = useState(false);
  const [brushSizes, setBrushSizes] = useState({
    pencil: DEFAULT_BRUSH_SIZE,
    eraser: DEFAULT_BRUSH_SIZE,
  });
  const [zoom, setZoom] = useState(() => fitZoom(boot.size));
  const [exportScale, setExportScale] = useState(8);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState(null);
  const [theme, setTheme] = useState(() => loadTheme() ?? "dark");

  const noticeTimer = useRef(null);
  const storageWarned = useRef(false);

  const notify = useCallback((message, tone = "info") => {
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    setNotice({ message, tone, key: Date.now() });
    noticeTimer.current = window.setTimeout(() => setNotice(null), 2800);
  }, []);

  useEffect(
    () => () => {
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    },
    [],
  );

  // Keep the working canvas safe across refreshes.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const ok = saveSession({ name, size, pixels: doc.pixels, frames });
      if (!ok && !storageWarned.current) {
        storageWarned.current = true;
        notify("Autosave is off — local storage is unavailable.", "warn");
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [name, size, doc.pixels, frames, notify]);

  // Mirror the live drawing back into the selected frame so thumbnails update.
  useEffect(() => {
    setFrames((current) => {
      let changed = false;
      const next = current.map((frame) => {
        if (frame.id === activeFrameId && frame.pixels !== doc.pixels) {
          changed = true;
          return { ...frame, pixels: doc.pixels };
        }
        return frame;
      });
      return changed ? next : current;
    });
  }, [doc.pixels, activeFrameId]);

  // Step through frames while the preview is playing.
  useEffect(() => {
    if (!playing || frames.length < 2) return undefined;
    const interval = window.setInterval(() => {
      setPlayIndex((index) => (index + 1) % frames.length);
    }, Math.round(1000 / fps));
    return () => window.clearInterval(interval);
  }, [playing, fps, frames.length]);

  useEffect(() => {
    savePalette(palette);
  }, [palette]);

  // Reflect the selected theme on <html> and remember it for next visit.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    saveTheme(theme);
  }, [theme]);

  // Restore artwork shared through the URL hash when the app opens.
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const token = new URLSearchParams(hash).get(SHARE_HASH_KEY);
    if (!token) return;

    let cancelled = false;
    decodeShare(token).then((decoded) => {
      if (cancelled) return;
      if (!decoded) {
        notify("That share link is invalid or corrupted.", "error");
        return;
      }
      dispatch({ type: "reset", pixels: decoded.pixels });
      const frame = { id: makeId(), pixels: decoded.pixels };
      setFrames([frame]);
      setActiveFrameId(frame.id);
      setSize(decoded.size);
      setZoom(fitZoom(decoded.size));
      notify("Shared artwork loaded.", "success");
    });
    return () => {
      cancelled = true;
    };
  }, [notify]);

  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);
  const handleLive = useCallback(
    (pixels) => dispatch({ type: "live", pixels }),
    [],
  );
  const handleHistory = useCallback(
    (snapshot) => dispatch({ type: "push", snapshot }),
    [],
  );

  /* ------------------------------- Animation ------------------------------- */

  const selectFrame = (id) => {
    if (id === activeFrameId) return;
    const frame = frames.find((entry) => entry.id === id);
    if (!frame) return;
    setActiveFrameId(id);
    dispatch({ type: "reset", pixels: frame.pixels });
  };

  const addFrame = () => {
    const pixels = createArt(size);
    const frame = { id: makeId(), pixels };
    setFrames((current) => [...current, frame]);
    setActiveFrameId(frame.id);
    dispatch({ type: "reset", pixels });
    notify(`Frame ${frames.length + 1} added.`, "info");
  };

  const duplicateFrame = () => {
    const index = frames.findIndex((frame) => frame.id === activeFrameId);
    if (index < 0) return;
    const pixels = frames[index].pixels.slice();
    const frame = { id: makeId(), pixels };
    setFrames((current) => [
      ...current.slice(0, index + 1),
      frame,
      ...current.slice(index + 1),
    ]);
    setActiveFrameId(frame.id);
    dispatch({ type: "reset", pixels });
    notify("Frame duplicated.", "success");
  };

  const deleteFrame = () => {
    if (frames.length <= 1) {
      notify("Keep at least one frame.", "warn");
      return;
    }
    const index = frames.findIndex((frame) => frame.id === activeFrameId);
    if (index < 0) return;
    if (
      countFilled(frames[index].pixels) > 0 &&
      !window.confirm("Delete this frame?")
    ) {
      return;
    }
    const next = frames.filter((frame) => frame.id !== activeFrameId);
    const fallback = next[Math.min(index, next.length - 1)];
    setFrames(next);
    setActiveFrameId(fallback.id);
    dispatch({ type: "reset", pixels: fallback.pixels });
    notify("Frame deleted.", "info");
  };

  const startPlayback = () => {
    const index = frames.findIndex((frame) => frame.id === activeFrameId);
    setPlayIndex(index < 0 ? 0 : index);
    setPlaying(true);
  };

  const stopPlayback = () => setPlaying(false);

  const handleApplyImport = (pixels) => {
    if (!pixels) return;
    dispatch({ type: "push", snapshot: doc.pixels });
    dispatch({ type: "live", pixels });
    notify("Pixelated image applied to the canvas.", "success");
  };

  // Keyboard shortcuts for tools, history and zoom.
  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest('input, textarea, select, [contenteditable="true"]')
      ) {
        return;
      }

      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.key.toLowerCase() === "z") {
        event.preventDefault();
        dispatch({ type: event.shiftKey ? "redo" : "undo" });
        return;
      }
      if (modifier && event.key.toLowerCase() === "y") {
        event.preventDefault();
        dispatch({ type: "redo" });
        return;
      }
      if (modifier || event.altKey) return;

      const shortcut = event.key.toLowerCase();
      const nextTool = TOOLS.find((item) => item.shortcut.toLowerCase() === shortcut);
      if (nextTool) {
        event.preventDefault();
        setTool(nextTool.id);
        return;
      }
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        setZoom((value) => Math.min(ZOOM_MAX, value + 1));
        return;
      }
      if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        setZoom((value) => Math.max(ZOOM_MIN, value - 1));
        return;
      }
      if (event.key === "0") {
        event.preventDefault();
        setZoom(fitZoom(size));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [size]);

  const handleColorChange = (hex) => {
    const next = normalizeHex(hex);
    if (next) setColor(next);
  };

  const handleAddColor = () => {
    if (palette.includes(color)) {
      notify("That colour is already in the palette.", "warn");
      return;
    }
    if (palette.length >= MAX_PALETTE) {
      notify(`Palette is full (${MAX_PALETTE} colours).`, "warn");
      return;
    }
    setPalette((current) => [...current, color]);
    notify("Colour added to the palette.", "success");
  };

  const handleRemoveColor = () => {
    if (palette.length <= 1) {
      notify("Keep at least one palette colour.", "warn");
      return;
    }
    if (!palette.includes(color)) {
      notify("Pick a palette swatch before removing it.", "warn");
      return;
    }
    const next = palette.filter((entry) => entry !== color);
    setPalette(next);
    setColor(next[0]);
    notify("Colour removed from the palette.", "info");
  };

  const handlePickColor = (hex) => {
    if (hex) setColor(hex);
    else notify("That pixel is transparent.", "warn");
  };

  // Pencil and eraser keep independent brush sizes (default 1px).
  const handleBrushSizeChange = (nextSize) => {
    setBrushSizes((current) => ({ ...current, [tool]: nextSize }));
  };

  const handleSizeChange = (nextSize) => {
    if (nextSize === size) return;
    if (
      frames.some((frame) => countFilled(frame.pixels) > 0) &&
      !window.confirm(`Switch to a ${nextSize}×${nextSize} canvas? This clears all frames.`)
    ) {
      return;
    }
    const pixels = createArt(nextSize);
    const frame = { id: makeId(), pixels };
    setFrames([frame]);
    setActiveFrameId(frame.id);
    dispatch({ type: "reset", pixels });
    setSize(nextSize);
    setZoom(fitZoom(nextSize));
    notify(`Canvas set to ${nextSize} × ${nextSize}.`, "info");
  };

  const handleZoomChange = (nextZoom) => {
    setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, nextZoom)));
  };

  const handleSave = () => {
    const artName = name.trim() || "Untitled";
    if (countFilled(doc.pixels) === 0) {
      notify("Canvas is empty — draw something before saving.", "warn");
      return;
    }
    if (gallery.length >= MAX_GALLERY) {
      notify(`Gallery is full (${MAX_GALLERY}). Delete an artwork first.`, "warn");
      return;
    }

    const item = {
      id: makeId(),
      name: artName,
      size,
      art: encodeArt(size, doc.pixels),
      createdAt: Date.now(),
    };
    const next = [item, ...gallery];
    const result = saveGallery(next);
    if (!result.ok) {
      notify("Storage is full — delete a saved artwork and try again.", "error");
      return;
    }
    setGallery(next);
    setName(artName);
    notify(`"${artName}" saved to the gallery.`, "success");
  };

  const handleOpen = (item) => {
    const decoded = decodeArt(item.art);
    if (!decoded) {
      notify("That artwork could not be opened.", "error");
      return;
    }
    dispatch({ type: "reset", pixels: decoded.pixels });
    const frame = { id: makeId(), pixels: decoded.pixels };
    setFrames([frame]);
    setActiveFrameId(frame.id);
    setSize(decoded.size);
    setName(item.name);
    setZoom(fitZoom(decoded.size));
    notify(`Opened "${item.name}".`, "success");
  };

  const handleDelete = (item) => {
    const next = gallery.filter((entry) => entry.id !== item.id);
    const result = saveGallery(next);
    if (!result.ok) {
      notify("Could not update the gallery storage.", "error");
      return;
    }
    setGallery(next);
    notify(`Deleted "${item.name}".`, "info");
  };

  const handleExport = async () => {
    if (countFilled(doc.pixels) === 0) {
      notify("Canvas is empty — nothing to export.", "warn");
      return;
    }
    setExporting(true);
    const ok = await downloadPng({
      size,
      pixels: doc.pixels,
      scale: exportScale,
      name: name || "pixel-art",
    });
    setExporting(false);
    if (ok) notify(`PNG exported at ${exportScale}× scale.`, "success");
    else notify("Could not export the PNG. Try again.", "error");
  };

  const handleShare = async () => {
    if (countFilled(doc.pixels) === 0) {
      notify("Canvas is empty — draw something before sharing.", "warn");
      return;
    }
    let token;
    try {
      token = await encodeShare(size, doc.pixels);
    } catch {
      notify("Could not create a share link.", "error");
      return;
    }
    const base = window.location.href.split("#")[0];
    const url = `${base}#${SHARE_HASH_KEY}=${token}`;
    try {
      window.history.replaceState(null, "", `#${SHARE_HASH_KEY}=${token}`);
    } catch {
      // Some contexts block history updates; the link itself still works.
    }
    const copied = await copyToClipboard(url);
    if (copied) notify("Share link copied to clipboard.", "success");
    else notify("Share link is ready in the address bar.", "info");
  };

  const previewFrame = playing && frames.length ? frames[playIndex % frames.length] : null;
  const canvasPixels = previewFrame ? previewFrame.pixels : doc.pixels;

  return (
    <div className="flex min-h-screen flex-col lg:h-screen lg:overflow-hidden">
      <Header
        name={name}
        canUndo={doc.past.length > 0}
        canRedo={doc.future.length > 0}
        onUndo={undo}
        onRedo={redo}
        onSave={handleSave}
        onShare={handleShare}
        onExport={handleExport}
        exporting={exporting}
        theme={theme}
        onToggleTheme={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
      />

      <main className="min-h-0 flex-1 px-3 py-3 sm:px-4 lg:px-5 lg:py-4">
        <div className="grid min-h-0 gap-3 lg:h-full lg:grid-cols-[236px_minmax(0,1fr)_300px]">
          <div className="order-2 flex min-w-0 flex-col gap-3 lg:order-1 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
            <ToolPanel
              tool={tool}
              onToolChange={setTool}
              brushSize={brushSizes[tool] ?? DEFAULT_BRUSH_SIZE}
              onBrushSizeChange={handleBrushSizeChange}
              mirror={mirror}
              onMirrorToggle={() => setMirror((value) => !value)}
            />
            <PalettePanel
              color={color}
              palette={palette}
              onColorChange={handleColorChange}
              onAdd={handleAddColor}
              onRemove={handleRemoveColor}
            />
            <FramesPanel
              frames={frames}
              activeFrameId={activeFrameId}
              playing={playing}
              playIndex={playIndex}
              fps={fps}
              size={size}
              onAdd={addFrame}
              onDuplicate={duplicateFrame}
              onDelete={deleteFrame}
              onSelect={selectFrame}
              onPlay={startPlayback}
              onPause={stopPlayback}
              onFpsChange={setFps}
            />
          </div>

          <div className="order-1 min-w-0 lg:order-2 lg:min-h-0">
            <CanvasStage
              size={size}
              pixels={canvasPixels}
              zoom={zoom}
              tool={tool}
              color={color}
              brushSize={brushSizes[tool] ?? DEFAULT_BRUSH_SIZE}
              mirror={mirror}
              theme={theme}
              readOnly={playing}
              onLive={handleLive}
              onHistory={handleHistory}
              onPickColor={handlePickColor}
              onZoomChange={handleZoomChange}
              onFit={() => setZoom(fitZoom(size))}
            />
          </div>

          <div className="order-3 flex min-w-0 flex-col gap-3 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
            <SidePanel
              size={size}
              onSizeChange={handleSizeChange}
              exportScale={exportScale}
              onScaleChange={setExportScale}
              onExport={handleExport}
              exporting={exporting}
              pixelCount={countFilled(doc.pixels)}
            />
            <ImportPanel size={size} onApply={handleApplyImport} onNotify={notify} />
            <GalleryPanel
              gallery={gallery}
              name={name}
              onNameChange={setName}
              onSave={handleSave}
              onOpen={handleOpen}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </main>

      <Toast notice={notice} />
    </div>
  );
}
