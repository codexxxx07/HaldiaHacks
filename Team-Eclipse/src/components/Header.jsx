import Icon from "./Icon";

export default function Header({
  name,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  onExport,
  exporting,
}) {
  return (
    <header className="relative z-30 flex shrink-0 flex-wrap items-center gap-3 border-b border-line bg-deep/90 px-3 py-3 backdrop-blur sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid shrink-0 grid-cols-2 gap-1" aria-hidden="true">
          <span className="h-2.5 w-2.5 bg-mint shadow-[2px_2px_0_#000]" />
          <span className="h-2.5 w-2.5 bg-cyan shadow-[2px_2px_0_#000]" />
          <span className="h-2.5 w-2.5 bg-amber shadow-[2px_2px_0_#000]" />
          <span className="h-2.5 w-2.5 bg-rose shadow-[2px_2px_0_#000]" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-pixel text-[12px] tracking-[0.08em] text-slate-100 sm:text-[14px]">
            PIXEL<span className="text-mint">FORGE</span>
          </h1>
          <p className="mt-1.5 font-pixel text-[6px] uppercase tracking-[0.24em] text-slate-500 sm:text-[7px]">
            Retro pixel studio
          </p>
        </div>
      </div>

      <div className="hidden min-w-0 items-center gap-2 lg:flex">
        <span className="h-6 w-px bg-line" aria-hidden="true" />
        <span
          className="chip max-w-[200px] truncate text-slate-400"
          title={name ? `${name}.png` : "Untitled"}
        >
          <Icon name="grid" className="h-3 w-3 text-mint" />
          <span className="truncate">{name || "Untitled"}</span>
        </span>
      </div>

      <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
        <div className="flex items-center gap-1" role="group" aria-label="History">
          <button
            type="button"
            className="icon-btn"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <Icon name="undo" />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
            aria-label="Redo"
          >
            <Icon name="redo" />
          </button>
        </div>

        <span className="hidden h-6 w-px bg-line sm:block" aria-hidden="true" />

        <button type="button" className="btn" onClick={onSave} title="Save artwork to gallery">
          <Icon name="save" className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Save</span>
        </button>
        <button
          type="button"
          className="btn btn-accent"
          onClick={onExport}
          disabled={exporting}
          title="Export a scaled PNG"
        >
          <Icon name="download" className="h-3.5 w-3.5" />
          <span>{exporting ? "Exporting" : "Export PNG"}</span>
        </button>
      </div>
    </header>
  );
}
