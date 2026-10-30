import Icon from "./Icon";
import PixelThumb from "./PixelThumb";

const FPS_MIN = 1;
const FPS_MAX = 24;

export default function FramesPanel({
  frames,
  activeFrameId,
  playing,
  playIndex,
  fps,
  size,
  onAdd,
  onDuplicate,
  onDelete,
  onSelect,
  onPlay,
  onPause,
  onFpsChange,
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2 className="panel-title">Animation</h2>
        <span className="chip text-cyan/80">
          {frames.length} {frames.length === 1 ? "frame" : "frames"}
        </span>
      </div>

      <div className="space-y-3 p-3">
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          aria-label="Animation frames"
        >
          {frames.map((frame, index) => {
            const selected = frame.id === activeFrameId;
            const current = playing && index === playIndex % frames.length;
            return (
              <button
                key={frame.id}
                type="button"
                onClick={() => onSelect(frame.id)}
                aria-pressed={selected}
                title={`Frame ${index + 1}`}
                className={`checker relative h-14 w-14 shrink-0 cursor-pointer overflow-hidden border-2 transition-colors duration-100 ${
                  current
                    ? "border-cyan"
                    : selected
                      ? "border-mint"
                      : "border-line-2 hover:border-slate-500"
                }`}
              >
                <PixelThumb pixels={frame.pixels} size={size} />
                <span className="absolute right-0 bottom-0 bg-deep/85 px-1 font-pixel text-[6px] leading-relaxed text-slate-300">
                  {index + 1}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={onAdd}
            title="Add a new frame"
            aria-label="Add a new frame"
            className="flex h-14 w-14 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 border-2 border-dashed border-line-2 text-slate-500 transition-colors duration-100 hover:border-mint hover:text-mint"
          >
            <Icon name="plus" className="h-4 w-4" />
            <span className="font-pixel text-[6px]">ADD</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={playing ? onPause : onPlay}
            className="btn btn-sm flex-1 py-2"
            title={playing ? "Pause the preview" : "Play the animation"}
          >
            <Icon name={playing ? "pause" : "play"} className="h-3 w-3" />
            {playing ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="icon-btn h-[30px] w-[30px]"
            title="Duplicate the selected frame"
            aria-label="Duplicate the selected frame"
          >
            <Icon name="copy" className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={frames.length <= 1}
            className="icon-btn h-[30px] w-[30px] hover:border-rose/70 hover:text-rose"
            title="Delete the selected frame"
            aria-label="Delete the selected frame"
          >
            <Icon name="trash" className="h-3.5 w-3.5" />
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="label">Speed</span>
            <span className="chip text-mint/80">{fps} fps</span>
          </div>
          <input
            type="range"
            min={FPS_MIN}
            max={FPS_MAX}
            step={1}
            value={fps}
            onChange={(event) => onFpsChange(Number(event.target.value))}
            aria-label="Playback speed in frames per second"
            className="brush-slider mt-1 w-full"
          />
        </div>

        <p className="text-[10px] leading-relaxed text-slate-500">
          {playing
            ? "Playing on the canvas — pause to keep editing."
            : "Select a frame, then draw to edit it."}
        </p>
      </div>
    </section>
  );
}
