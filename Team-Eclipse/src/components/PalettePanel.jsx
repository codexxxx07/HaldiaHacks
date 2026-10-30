import { useEffect, useState } from "react";
import { normalizeHex } from "../lib/art";
import Icon from "./Icon";

function HexInput({ value, onCommit }) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    const next = normalizeHex(draft);
    if (next) onCommit(next);
    else setDraft(value);
  };

  return (
    <input
      type="text"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit();
          event.currentTarget.blur();
        }
        if (event.key === "Escape") {
          setDraft(value);
          event.currentTarget.blur();
        }
      }}
      maxLength={7}
      spellCheck={false}
      aria-label="Colour hex value"
      className="field min-w-0 flex-1 py-1.5 text-center uppercase"
    />
  );
}

export default function PalettePanel({
  color,
  palette,
  onColorChange,
  onAdd,
  onRemove,
}) {
  const selectedIndex = palette.indexOf(color);

  return (
    <section className="panel">
      <div className="panel-head">
        <h2 className="panel-title">Palette</h2>
        <span className="chip">{palette.length} colours</span>
      </div>

      <div className="space-y-3 p-3">
        <div className="flex items-center gap-3">
          <div
            className="relative h-12 w-12 shrink-0 border-2 border-line-2 shadow-[3px_3px_0_#000]"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          >
            <span className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="label">Current colour</span>
            <div className="mt-1.5 flex items-center gap-1.5">
              <HexInput value={color} onCommit={onColorChange} />
              <label
                className="icon-btn relative h-[34px] w-[34px] cursor-pointer"
                title="Open custom colour picker"
              >
                <input
                  type="color"
                  value={color}
                  onChange={(event) => {
                    const next = normalizeHex(event.target.value);
                    if (next) onColorChange(next);
                  }}
                  className="absolute h-0 w-0 opacity-0"
                  aria-label="Custom colour picker"
                />
                <Icon name="picker" className="h-4 w-4" />
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-8 gap-1.5" role="group" aria-label="Colour palette">
          {palette.map((hex, index) => {
            const selected = hex === color;
            return (
              <button
                key={`${hex}-${index}`}
                type="button"
                onClick={() => onColorChange(hex)}
                aria-label={`Select colour ${hex}`}
                aria-pressed={selected}
                title={hex}
                className={`aspect-square w-full cursor-pointer border transition-transform duration-100 hover:-translate-y-0.5 ${
                  selected
                    ? "border-white ring-2 ring-mint ring-offset-2 ring-offset-panel"
                    : "border-black/60 hover:border-line-2"
                }`}
                style={{ backgroundColor: hex }}
              />
            );
          })}
        </div>

        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={onAdd}
            className="btn btn-sm flex-1 py-2"
            title="Add the current colour to the palette"
          >
            <Icon name="plus" className="h-3 w-3" />
            Add
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={palette.length <= 1 || selectedIndex < 0}
            className="btn btn-sm flex-1 py-2"
            title="Remove the selected colour from the palette"
          >
            <Icon name="minus" className="h-3 w-3" />
            Remove
          </button>
        </div>

        <p className="text-[10px] leading-relaxed text-slate-500">
          Palette is saved in this browser.
        </p>
      </div>
    </section>
  );
}
