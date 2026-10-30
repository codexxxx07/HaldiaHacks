import { TOOLS, ZOOM_MAX, ZOOM_MIN } from "../constants";
import Icon from "./Icon";
import PixelCanvas from "./PixelCanvas";

export default function CanvasStage({
  size,
  pixels,
  zoom,
  tool,
  color,
  onLive,
  onHistory,
  onPickColor,
  onZoomChange,
  onFit,
}) {
  const active = TOOLS.find((item) => item.id === tool) ?? TOOLS[0];

  return (
    <section className="panel flex h-full min-h-[430px] flex-col lg:min-h-0">
      <div className="panel-head shrink-0">
        <h2 className="panel-title">Canvas</h2>
        <div className="flex items-center gap-2">
          <span className="chip text-slate-400">
            {size} × {size}
          </span>
          <span className="chip hidden text-cyan/80 sm:inline-flex">
            {active.label}
          </span>
        </div>
      </div>

      <div className="stage flex min-h-0 flex-1 items-center justify-center overflow-auto p-4 sm:p-6">
        <div className="m-auto">
          <PixelCanvas
            size={size}
            pixels={pixels}
            zoom={zoom}
            tool={tool}
            color={color}
            onLive={onLive}
            onHistory={onHistory}
            onPickColor={onPickColor}
          />
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-line bg-panel px-3 py-2">
        <p className="min-w-0 truncate text-[10px] text-slate-500">
          <span className="font-pixel text-[8px] tracking-[0.1em] text-slate-300">
            {active.label}
          </span>
          <span className="mx-1.5 text-line-2">/</span>
          {active.hint}
        </p>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="icon-btn h-7 w-7"
            onClick={() => onZoomChange(zoom - 1)}
            disabled={zoom <= ZOOM_MIN}
            title="Zoom out (−)"
            aria-label="Zoom out"
          >
            <Icon name="minus" className="h-3 w-3" />
          </button>
          <span
            className="min-w-[54px] text-center font-pixel text-[9px] tracking-[0.08em] text-mint"
            aria-live="polite"
          >
            ×{zoom}
          </span>
          <button
            type="button"
            className="icon-btn h-7 w-7"
            onClick={() => onZoomChange(zoom + 1)}
            disabled={zoom >= ZOOM_MAX}
            title="Zoom in (+)"
            aria-label="Zoom in"
          >
            <Icon name="plus" className="h-3 w-3" />
          </button>
          <button
            type="button"
            className="btn btn-sm ml-1 py-1.5"
            onClick={onFit}
            title="Fit canvas to screen (0)"
          >
            <Icon name="fit" className="h-3 w-3" />
            Fit
          </button>
        </div>
      </div>
    </section>
  );
}
