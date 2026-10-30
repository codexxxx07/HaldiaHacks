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

const WHEEL_CENTER = 50;
const WHEEL_RADIUS = 50;

function polarPoint(angle, radius) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return `${WHEEL_CENTER + radius * Math.cos(rad)}% ${WHEEL_CENTER + radius * Math.sin(rad)}%`;
}

/** Build a pie-slice (or ring-slice) polygon so each colour becomes a wedge of the wheel. */
function sectorClip(startAngle, endAngle, radius = WHEEL_RADIUS, innerRadius = 0) {
  const steps = Math.max(2, Math.ceil((endAngle - startAngle) / 4));
  const points = [];
  if (innerRadius <= 0) points.push(`${WHEEL_CENTER}% ${WHEEL_CENTER}%`);
  for (let i = 0; i <= steps; i += 1) {
    points.push(polarPoint(startAngle + ((endAngle - startAngle) * i) / steps, radius));
  }
  if (innerRadius > 0) {
    for (let i = steps; i >= 0; i -= 1) {
      points.push(polarPoint(startAngle + ((endAngle - startAngle) * i) / steps, innerRadius));
    }
  }
  return `polygon(${points.join(", ")})`;
}

export default function PalettePanel({
  color,
  palette,
  onColorChange,
  onAdd,
  onRemove,
}) {
  const selectedIndex = palette.indexOf(color);
  const segment = palette.length > 0 ? 360 / palette.length : 360;

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

        <div
          className="relative mx-auto aspect-square w-full max-w-[230px]"
          role="group"
          aria-label="Colour palette"
        >
          <div className="absolute inset-0 overflow-hidden rounded-full border-2 border-line-2 shadow-[3px_3px_0_#000]">
            {palette.map((hex, index) => {
              const start = index * segment;
              const selected = hex === color;
              return (
                <button
                  key={`${hex}-${index}`}
                  type="button"
                  onClick={() => onColorChange(hex)}
                  aria-label={`Select colour ${hex}`}
                  aria-pressed={selected}
                  title={hex}
                  className="absolute inset-0 cursor-pointer transition-[filter] duration-100 hover:brightness-110"
                  style={{ backgroundColor: hex, clipPath: sectorClip(start, start + segment) }}
                />
              );
            })}
            {selectedIndex >= 0 && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-white/70"
                style={{
                  clipPath: sectorClip(
                    selectedIndex * segment,
                    selectedIndex * segment + segment,
                    WHEEL_RADIUS - 1,
                    WHEEL_RADIUS - 7,
                  ),
                }}
              />
            )}
          </div>
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
