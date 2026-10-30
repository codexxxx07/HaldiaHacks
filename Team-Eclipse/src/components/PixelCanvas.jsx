import { useEffect, useRef, useState } from "react";
import { floodFillPixels, linePoints, mirrorPoints, paintCells, rectPoints } from "../lib/art";

const CHECKER = {
  dark: { a: "#0d1220", b: "#141a29", grid: "rgba(148, 163, 184, 0.14)", major: "rgba(103, 245, 177, 0.2)" },
  light: { a: "#e7ecf4", b: "#f6f9fd", grid: "rgba(71, 85, 105, 0.18)", major: "rgba(14, 143, 99, 0.3)" },
};

function setupCanvas(canvas, size, zoom) {
  const display = size * zoom;
  // Keep high-DPI rendering crisp without letting huge zooms exhaust memory.
  const dpr = Math.min(window.devicePixelRatio || 1, 3, 2400 / display);
  const backing = Math.max(1, Math.round(display * dpr));
  if (canvas.width !== backing || canvas.height !== backing) {
    canvas.width = backing;
    canvas.height = backing;
  }
  canvas.style.width = `${display}px`;
  canvas.style.height = `${display}px`;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, display, display);
  return { ctx, display };
}

export default function PixelCanvas({
  size,
  pixels,
  zoom,
  tool,
  color,
  brushSize,
  mirror,
  theme,
  onLive,
  onHistory,
  onPickColor,
}) {
  const mainRef = useRef(null);
  const overlayRef = useRef(null);
  const dragRef = useRef(null);
  const [preview, setPreview] = useState(null);

  // Paint the artwork + grid.
  useEffect(() => {
    const canvas = mainRef.current;
    if (!canvas) return;
    const prepared = setupCanvas(canvas, size, zoom);
    if (!prepared) return;
    const { ctx, display } = prepared;
    const shades = CHECKER[theme] ?? CHECKER.dark;

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        ctx.fillStyle = (x + y) % 2 === 0 ? shades.a : shades.b;
        ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
      }
    }

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const pixel = pixels[y * size + x];
        if (!pixel) continue;
        ctx.fillStyle = pixel;
        ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
      }
    }

    if (zoom >= 5) {
      ctx.beginPath();
      for (let i = 1; i < size; i += 1) {
        const point = i * zoom + 0.5;
        ctx.moveTo(point, 0);
        ctx.lineTo(point, display);
        ctx.moveTo(0, point);
        ctx.lineTo(display, point);
      }
      ctx.strokeStyle = shades.grid;
      ctx.lineWidth = 1;
      ctx.stroke();

      if (size > 16) {
        ctx.beginPath();
        for (let i = 8; i < size; i += 8) {
          const point = i * zoom + 0.5;
          ctx.moveTo(point, 0);
          ctx.lineTo(point, display);
          ctx.moveTo(0, point);
          ctx.lineTo(display, point);
        }
        ctx.strokeStyle = shades.major;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }, [size, pixels, zoom, theme]);

  // Live shape preview (line / rectangle).
  useEffect(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const prepared = setupCanvas(canvas, size, zoom);
    if (!prepared) return;
    if (!preview) return;
    const { ctx } = prepared;

    const cells =
      preview.tool === "line"
        ? linePoints(preview.start.x, preview.start.y, preview.end.x, preview.end.y)
        : rectPoints(preview.start.x, preview.start.y, preview.end.x, preview.end.y);

    ctx.globalAlpha = 0.6;
    ctx.fillStyle = color;
    for (const [x, y] of cells) {
      ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
    }
    ctx.globalAlpha = 1;
  }, [preview, size, zoom, color]);

  const cellFromEvent = (event) => {
    const canvas = mainRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * size);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * size);
    if (x < 0 || y < 0 || x >= size || y >= size) return null;
    return { x, y };
  };

  const releasePointer = (pointerId) => {
    const canvas = mainRef.current;
    if (!canvas || pointerId == null) return;
    try {
      if (typeof canvas.hasPointerCapture === "function" && canvas.hasPointerCapture(pointerId)) {
        canvas.releasePointerCapture(pointerId);
      }
    } catch {
      // Pointer capture is best-effort; some browsers reject unknown pointers.
    }
  };

  const paintStroke = (from, to) => {
    const drag = dragRef.current;
    if (!drag || drag.mode !== "paint") return;
    const points = linePoints(from.x, from.y, to.x, to.y);
    const cells = drag.mirror ? points.concat(mirrorPoints(points, size)) : points;
    const next = paintCells(drag.working, size, cells, drag.brush, drag.brushSize);
    if (!next) return;
    drag.working = next;
    if (!drag.changed) {
      drag.changed = true;
      onHistory(drag.base);
    }
    onLive(next);
  };

  const handlePointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (dragRef.current) return;
    const cell = cellFromEvent(event);
    if (!cell) return;
    event.preventDefault();

    if (tool === "picker") {
      onPickColor(pixels[cell.y * size + cell.x] || null);
      return;
    }

    if (tool === "fill") {
      const next = floodFillPixels(pixels, size, cell.x, cell.y, color);
      if (next) {
        onHistory(pixels);
        onLive(next);
      }
      return;
    }

    const canvas = mainRef.current;
    if (canvas && typeof canvas.setPointerCapture === "function") {
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        // Continue without capture rather than losing the stroke.
      }
    }

    if (tool === "line" || tool === "rect") {
      dragRef.current = {
        mode: "shape",
        tool,
        base: pixels,
        start: cell,
        end: cell,
        pointerId: event.pointerId,
      };
      setPreview({ tool, start: cell, end: cell });
      return;
    }

    dragRef.current = {
      mode: "paint",
      base: pixels,
      working: pixels,
      last: cell,
      changed: false,
      brush: tool === "eraser" ? null : color,
      brushSize,
      mirror: Boolean(mirror) && tool === "pencil",
      pointerId: event.pointerId,
    };
    paintStroke(cell, cell);
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const cell = cellFromEvent(event);
    if (!cell) return;
    event.preventDefault();

    if (drag.mode === "paint") {
      paintStroke(drag.last, cell);
      drag.last = cell;
      return;
    }

    drag.end = cell;
    setPreview({ tool: drag.tool, start: drag.start, end: cell });
  };

  const handlePointerUp = (event) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;

    if (drag.mode === "shape") {
      const cells =
        drag.tool === "line"
          ? linePoints(drag.start.x, drag.start.y, drag.end.x, drag.end.y)
          : rectPoints(drag.start.x, drag.start.y, drag.end.x, drag.end.y);
      const next = paintCells(drag.base, size, cells, color);
      if (next) {
        onHistory(drag.base);
        onLive(next);
      }
      setPreview(null);
    }

    releasePointer(drag.pointerId);
    dragRef.current = null;
  };

  const handlePointerCancel = (event) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    setPreview(null);
    dragRef.current = null;
    releasePointer(drag.pointerId);
  };

  const display = size * zoom;

  return (
    <div
      className="relative shrink-0 shadow-[0_0_0_1px_#35415e,0_18px_50px_rgba(0,0,0,0.55)]"
      style={{ width: display, height: display }}
    >
      <canvas
        ref={mainRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onDragStart={(event) => event.preventDefault()}
        className="relative block cursor-crosshair touch-none select-none"
        aria-label={`Pixel drawing canvas, ${size} by ${size}`}
        role="img"
      />
      <canvas
        ref={overlayRef}
        className="pointer-events-none absolute top-0 left-0 block touch-none select-none"
        aria-hidden="true"
      />
    </div>
  );
}
