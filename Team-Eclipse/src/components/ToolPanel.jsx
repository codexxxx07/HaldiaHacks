import { BRUSH_SIZE_MAX, BRUSH_SIZE_MIN, TOOLS } from "../constants";
import Icon from "./Icon";

export default function ToolPanel({
  tool,
  onToolChange,
  brushSize,
  onBrushSizeChange,
  mirror,
  onMirrorToggle,
}) {
  const active = TOOLS.find((item) => item.id === tool) ?? TOOLS[0];
  const showBrush = tool === "pencil" || tool === "eraser";

  return (
    <section className="panel">
      <div className="panel-head">
        <h2 className="panel-title">Tools</h2>
        <span className="chip text-mint/80">{active.label}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 p-3">
        {TOOLS.map((item) => {
          const selected = item.id === tool;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToolChange(item.id)}
              aria-pressed={selected}
              title={`${item.label} (${item.shortcut})`}
              className={`group relative flex cursor-pointer flex-col items-center gap-2 border px-2 py-3 transition-all duration-100 ${
                selected
                  ? "border-mint bg-mint/10 text-mint shadow-[inset_0_0_0_1px_rgba(103,245,177,0.22)]"
                  : "border-line bg-panel-2/60 text-slate-400 hover:border-line-2 hover:bg-panel-2 hover:text-slate-100"
              }`}
            >
              <Icon name={item.icon} className="h-5 w-5" />
              <span className="font-pixel text-[7px] uppercase tracking-[0.1em]">
                {item.label}
              </span>
              <span
                className={`absolute top-1.5 right-2 font-pixel text-[6px] ${
                  selected ? "text-mint/60" : "text-slate-600 group-hover:text-slate-400"
                }`}
              >
                {item.shortcut}
              </span>
            </button>
          );
        })}
      </div>

      {showBrush && (
        <div className="border-t border-line px-3 py-2.5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="font-pixel text-[7px] uppercase tracking-[0.14em] text-slate-500">
              Size
            </span>
            <span className="chip text-mint/80">{brushSize}px</span>
          </div>
          <input
            type="range"
            min={BRUSH_SIZE_MIN}
            max={BRUSH_SIZE_MAX}
            step={1}
            value={brushSize}
            onChange={(event) => onBrushSizeChange(Number(event.target.value))}
            aria-label={`${active.label} size`}
            className="brush-slider w-full"
          />
        </div>
      )}

      <div className="border-t border-line px-3 py-2.5">
        <button
          type="button"
          onClick={onMirrorToggle}
          aria-pressed={mirror}
          title="Mirror pencil strokes across the vertical centre"
          className={`flex w-full cursor-pointer items-center justify-between gap-2 border px-2.5 py-2 transition-all duration-100 ${
            mirror
              ? "border-mint bg-mint/10 text-mint shadow-[inset_0_0_0_1px_rgba(103,245,177,0.22)]"
              : "border-line bg-panel-2/60 text-slate-400 hover:border-line-2 hover:bg-panel-2 hover:text-slate-100"
          }`}
        >
          <span className="flex items-center gap-2">
            <Icon name="mirror" className="h-4 w-4" />
            <span className="font-pixel text-[7px] uppercase tracking-[0.12em]">Mirror</span>
          </span>
          <span className={`font-pixel text-[7px] ${mirror ? "text-mint" : "text-slate-600"}`}>
            {mirror ? "ON" : "OFF"}
          </span>
        </button>
        <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
          Mirrors pencil strokes across the vertical centre.
        </p>
      </div>

      <div className="border-t border-line px-3 py-2">
        <p className="text-[10px] leading-relaxed text-slate-500">{active.hint}.</p>
        <p className="mt-1 whitespace-nowrap font-pixel text-[6px] tracking-[0.12em] text-slate-600">
          SHORTCUTS B · E · G · I · L · R
        </p>
      </div>
    </section>
  );
}
