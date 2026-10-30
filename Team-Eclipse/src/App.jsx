import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import CanvasStage from "./components/CanvasStage";
import GalleryPanel from "./components/GalleryPanel";
import Header from "./components/Header";
import PalettePanel from "./components/PalettePanel";
import SidePanel from "./components/SidePanel";
import Toast from "./components/Toast";
import ToolPanel from "./components/ToolPanel";
import {
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
  downloadPng,
  encodeArt,
  normalizeHex,
} from "./lib/art";
import {
  loadGallery,
  loadPalette,
  loadSession,
  saveGallery,
  savePalette,
  saveSession,
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

export default function App() {
  const [boot] = useState(
    () =>
      loadSession() ?? {
        name: "Untitled",
        size: DEFAULT_SIZE,
        pixels: createArt(DEFAULT_SIZE),
      },
  );

  const [doc, dispatch] = useReducer(documentReducer, {
    pixels: boot.pixels,
    past: [],
    future: [],
  });
  const [size, setSize] = useState(boot.size);
  const [name, setName] = useState(boot.name);
  const [palette, setPalette] = useState(
    () => loadPalette() ?? DEFAULT_PALETTE.slice(),
  );
  const [color, setColor] = useState(
    () => palette[8] ?? palette[0] ?? "#67f5b1",
  );
  const [gallery, setGallery] = useState(() => loadGallery());
  const [tool, setTool] = useState("pencil");
  const [zoom, setZoom] = useState(() => fitZoom(boot.size));
  const [exportScale, setExportScale] = useState(8);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState(null);

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
      const ok = saveSession({ name, size, pixels: doc.pixels });
      if (!ok && !storageWarned.current) {
        storageWarned.current = true;
        notify("Autosave is off — local storage is unavailable.", "warn");
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [name, size, doc.pixels, notify]);

  useEffect(() => {
    savePalette(palette);
  }, [palette]);

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

  const handleSizeChange = (nextSize) => {
    if (nextSize === size) return;
    if (
      countFilled(doc.pixels) > 0 &&
      !window.confirm(`Switch to a ${nextSize}×${nextSize} canvas? This clears the current artwork.`)
    ) {
      return;
    }
    dispatch({ type: "reset", pixels: createArt(nextSize) });
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

  return (
    <div className="flex min-h-screen flex-col lg:h-screen lg:overflow-hidden">
      <Header
        name={name}
        canUndo={doc.past.length > 0}
        canRedo={doc.future.length > 0}
        onUndo={undo}
        onRedo={redo}
        onSave={handleSave}
        onExport={handleExport}
        exporting={exporting}
      />

      <main className="min-h-0 flex-1 px-3 py-3 sm:px-4 lg:px-5 lg:py-4">
        <div className="grid min-h-0 gap-3 lg:h-full lg:grid-cols-[236px_minmax(0,1fr)_300px]">
          <div className="order-2 flex min-w-0 flex-col gap-3 lg:order-1 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
            <ToolPanel tool={tool} onToolChange={setTool} />
            <PalettePanel
              color={color}
              palette={palette}
              onColorChange={handleColorChange}
              onAdd={handleAddColor}
              onRemove={handleRemoveColor}
            />
          </div>

          <div className="order-1 min-w-0 lg:order-2 lg:min-h-0">
            <CanvasStage
              size={size}
              pixels={doc.pixels}
              zoom={zoom}
              tool={tool}
              color={color}
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
