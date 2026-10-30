import { TOOLS } from "../constants";
import Icon from "./Icon";

export default function ToolPanel({ tool, onToolChange }) {
  const active = TOOLS.find((item) => item.id === tool) ?? TOOLS[0];

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

      <div className="border-t border-line px-3 py-2">
        <p className="text-[10px] leading-relaxed text-slate-500">{active.hint}.</p>
        <p className="mt-1 whitespace-nowrap font-pixel text-[6px] tracking-[0.12em] text-slate-600">
          SHORTCUTS B · E · G · I · L · R
        </p>
      </div>
    </section>
  );
}
