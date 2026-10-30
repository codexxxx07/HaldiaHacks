import { useEffect, useRef, useState } from "react";
import { pixelateImage } from "../lib/art";
import Icon from "./Icon";
import PixelThumb from "./PixelThumb";

const ACCEPTED = /^image\/(png|jpe?g)$/i;
const BLOCK_MIN = 1;
const BLOCK_MAX = 16;
const DEFAULT_BLOCK = 4;

export default function ImportPanel({ size, onApply, onNotify }) {
  const inputRef = useRef(null);
  const [image, setImage] = useState(null);
  const [fileName, setFileName] = useState("");
  const [block, setBlock] = useState(DEFAULT_BLOCK);
  const [preview, setPreview] = useState(null);

  // Rebuild the pixel-art preview whenever the image, intensity or grid changes.
  useEffect(() => {
    if (!image) {
      setPreview(null);
      return;
    }
    setPreview(pixelateImage(image, size, block));
  }, [image, block, size]);

  const openPicker = () => inputRef.current?.click();

  const reset = () => {
    setImage(null);
    setFileName("");
    setPreview(null);
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    // Reset so selecting the same file again still fires a change event.
    event.target.value = "";
    if (!file) return;

    if (!ACCEPTED.test(file.type)) {
      onNotify("Unsupported file — please choose a PNG or JPG image.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => onNotify("Could not read that image file.", "error");
    reader.onload = () => {
      const next = new Image();
      next.onload = () => {
        if (!next.naturalWidth || !next.naturalHeight) {
          onNotify("That image appears to be empty.", "error");
          return;
        }
        setImage(next);
        setFileName(file.name);
      };
      next.onerror = () => onNotify("That image could not be loaded.", "error");
      next.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleApply = () => {
    if (!preview) return;
    onApply(preview);
    reset();
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <h2 className="panel-title">Import Image</h2>
        <span className="chip text-violet/80">Pixelate</span>
      </div>

      <div className="space-y-3 p-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onChange={handleFile}
          className="hidden"
        />

        {!image ? (
          <>
            <button
              type="button"
              onClick={openPicker}
              className="btn w-full"
              title="Import a PNG or JPG image"
            >
              <Icon name="upload" className="h-3.5 w-3.5" />
              Import Image
            </button>
            <p className="text-[10px] leading-relaxed text-slate-500">
              Turn a PNG or JPG into pixel art on the {size}×{size} grid. Images stay in your
              browser — nothing is uploaded.
            </p>
          </>
        ) : (
          <>
            <div className="checker overflow-hidden border border-line-2">
              {preview ? (
                <div className="aspect-square w-full">
                  <PixelThumb pixels={preview} size={size} />
                </div>
              ) : (
                <div className="flex aspect-square w-full items-center justify-center">
                  <span className="font-pixel text-[7px] text-slate-500">No preview</span>
                </div>
              )}
            </div>

            <p className="truncate text-[10px] text-slate-500" title={fileName}>
              {fileName} · {image.naturalWidth}×{image.naturalHeight}
            </p>

            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="label">Pixel size</span>
                <span className="chip text-violet/80">{block}px</span>
              </div>
              <input
                type="range"
                min={BLOCK_MIN}
                max={BLOCK_MAX}
                step={1}
                value={block}
                onChange={(event) => setBlock(Number(event.target.value))}
                aria-label="Pixelation intensity"
                className="brush-slider mt-1 w-full"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleApply}
                className="btn btn-accent flex-1"
                title="Apply the pixelated image to the canvas"
              >
                <Icon name="check" className="h-3.5 w-3.5" />
                Apply
              </button>
              <button
                type="button"
                onClick={openPicker}
                className="icon-btn h-[34px] w-[34px]"
                title="Choose another image"
                aria-label="Choose another image"
              >
                <Icon name="upload" className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={reset}
                className="icon-btn h-[34px] w-[34px]"
                title="Clear the import"
                aria-label="Clear the import"
              >
                <Icon name="x" className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
