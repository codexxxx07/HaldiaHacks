import { EXPORT_SCALES, SIZES } from "../constants";
import Icon from "./Icon";

export default function SidePanel({
  size,
  onSizeChange,
  exportScale,
  onScaleChange,
  onExport,
  exporting,
  pixelCount,
}) {
  return (
    <div className="space-y-3">
      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">Canvas</h2>
          <span className="chip text-slate-400">
            {pixelCount} / {size * size}
          </span>
        </div>
        <div className="p-3">
          <span className="label">Grid size</span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {SIZES.map((option) => {
              const selected = option === size;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onSizeChange(option)}
                  aria-pressed={selected}
                  className={`flex cursor-pointer flex-col items-center gap-1.5 border py-2.5 transition-colors duration-100 ${
                    selected
                      ? "border-mint bg-mint/10 text-mint shadow-[inset_0_0_0_1px_rgba(103,245,177,0.2)]"
                      : "border-line bg-panel-2/60 text-slate-400 hover:border-line-2 hover:text-slate-100"
                  }`}
                >
                  <span className="font-pixel text-[11px]">{option}</span>
                  <span className="font-pixel text-[7px] tracking-[0.1em]">
                    {option} × {option}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-2.5 text-[10px] leading-relaxed text-slate-500">
            Changing the size starts a fresh canvas.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">Export PNG</h2>
          <span className="chip text-cyan/80">{exportScale}× scale</span>
        </div>
        <div className="space-y-3 p-3">
          <div>
            <span className="label">Output scale</span>
            <div className="mt-2 grid grid-cols-6 gap-1.5">
              {EXPORT_SCALES.map((scale) => {
                const selected = scale === exportScale;
                return (
                  <button
                    key={scale}
                    type="button"
                    onClick={() => onScaleChange(scale)}
                    aria-pressed={selected}
                    title={`Export at ${scale}×`}
                    className={`cursor-pointer border py-2 font-pixel text-[8px] transition-colors duration-100 ${
                      selected
                        ? "border-cyan bg-cyan/10 text-cyan"
                        : "border-line bg-panel-2/60 text-slate-500 hover:border-line-2 hover:text-slate-200"
                    }`}
                  >
                    {scale}×
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-line pt-3 text-[10px] text-slate-500">
            <span>Transparent PNG</span>
            <span className="font-pixel text-[8px] text-slate-400">
              {size * exportScale} × {size * exportScale}
            </span>
          </div>

          <button
            type="button"
            onClick={onExport}
            disabled={exporting}
            className="btn btn-accent w-full"
          >
            <Icon name="download" className="h-4 w-4" />
            {exporting ? "Exporting…" : "Download PNG"}
          </button>
        </div>
      </section>
    </div>
  );
}
