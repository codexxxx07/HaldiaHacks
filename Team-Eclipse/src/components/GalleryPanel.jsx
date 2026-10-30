import { useEffect, useMemo, useRef, useState } from "react";
import { MAX_GALLERY } from "../constants";
import { decodeArt } from "../lib/art";
import Icon from "./Icon";

function relativeTime(timestamp) {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function SavedThumb({ art }) {
  const canvasRef = useRef(null);
  const decoded = useMemo(() => decodeArt(art), [art]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !decoded) return;
    const { size, pixels } = decoded;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const image = ctx.createImageData(size, size);

    for (let i = 0; i < pixels.length; i += 1) {
      const color = pixels[i];
      if (!color) continue;
      const value = Number.parseInt(color.slice(1), 16);
      const offset = i * 4;
      image.data[offset] = (value >> 16) & 255;
      image.data[offset + 1] = (value >> 8) & 255;
      image.data[offset + 2] = value & 255;
      image.data[offset + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
  }, [decoded]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full [image-rendering:pixelated]"
      aria-hidden="true"
    />
  );
}

export default function GalleryPanel({
  gallery,
  name,
  onNameChange,
  onSave,
  onOpen,
  onDelete,
}) {
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => {
    if (!confirmId) return undefined;
    const timer = window.setTimeout(() => setConfirmId(null), 4000);
    return () => window.clearTimeout(timer);
  }, [confirmId]);

  return (
    <section className="panel">
      <div className="panel-head">
        <h2 className="panel-title">Gallery</h2>
        <span className="chip">
          {gallery.length} / {MAX_GALLERY}
        </span>
      </div>

      <div className="border-b border-line p-3">
        <label className="label" htmlFor="artwork-name">
          Artwork name
        </label>
        <div className="mt-1.5 flex gap-1.5">
          <input
            id="artwork-name"
            type="text"
            value={name}
            maxLength={40}
            onChange={(event) => onNameChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onSave();
              }
            }}
            placeholder="Untitled"
            className="field min-w-0 flex-1"
          />
          <button
            type="button"
            onClick={onSave}
            className="btn btn-accent shrink-0 px-3"
            title="Save the current artwork to the gallery"
          >
            <Icon name="save" className="h-3.5 w-3.5" />
            Save
          </button>
        </div>
      </div>

      <div className="p-2.5">
        {gallery.length === 0 ? (
          <div className="border border-dashed border-line px-3 py-6 text-center">
            <Icon name="folder" className="mx-auto h-5 w-5 text-slate-600" />
            <p className="mt-2 font-pixel text-[7px] leading-relaxed tracking-[0.12em] text-slate-500">
              No saved art yet
            </p>
            <p className="mt-1.5 text-[10px] text-slate-600">
              Draw something, then save it here.
            </p>
          </div>
        ) : (
          <ul className="max-h-[330px] space-y-2 overflow-y-auto pr-1">
            {gallery.map((item) => {
              const confirming = confirmId === item.id;
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-2 border border-line bg-ink/40 p-2"
                >
                  <button
                    type="button"
                    onClick={() => onOpen(item)}
                    className="checker h-12 w-12 shrink-0 cursor-pointer overflow-hidden border border-line-2"
                    title={`Open ${item.name}`}
                    aria-label={`Open ${item.name}`}
                  >
                    <SavedThumb art={item.art} />
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-[11px] font-bold text-slate-200"
                      title={item.name}
                    >
                      {item.name}
                    </p>
                    <p className="mt-0.5 font-pixel text-[7px] tracking-[0.06em] text-slate-500">
                      {item.size}×{item.size} · {relativeTime(item.createdAt)}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1">
                      {confirming ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmId(null);
                              onDelete(item);
                            }}
                            className="btn btn-danger btn-sm flex-1 px-1.5 py-1.5 text-[7px]"
                          >
                            Sure?
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmId(null)}
                            className="btn btn-sm px-1.5 py-1.5 text-[7px]"
                          >
                            No
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => onOpen(item)}
                            className="btn btn-sm flex-1 px-1.5 py-1.5 text-[7px]"
                          >
                            Open
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmId(item.id)}
                            className="icon-btn h-6 w-6 hover:border-rose/70 hover:text-rose"
                            title={`Delete ${item.name}`}
                            aria-label={`Delete ${item.name}`}
                          >
                            <Icon name="trash" className="h-3 w-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
