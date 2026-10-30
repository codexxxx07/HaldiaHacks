import { useEffect, useRef } from "react";

/** Renders a pixel array into a crisp, upscaled canvas thumbnail. */
export default function PixelThumb({
  pixels,
  size,
  className = "h-full w-full [image-rendering:pixelated]",
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pixels) return;
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
  }, [pixels, size]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
