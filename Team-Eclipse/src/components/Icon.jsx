const PATHS = {
  pencil: (
    <>
      <path d="M4 20h4L20 8l-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </>
  ),
  eraser: (
    <>
      <path d="m4 15 7-7 6 6-5 5H7l-3-3Z" />
      <path d="M10 20h10" />
    </>
  ),
  fill: (
    <>
      <path d="M6 12 12 6l7 7-6 6-7-7Z" />
      <path d="M19 15c.8 1.2 1.5 2.2 1.5 3a1.5 1.5 0 0 1-3 0c0-.8.7-1.8 1.5-3Z" />
    </>
  ),
  picker: (
    <>
      <path d="M16 3l5 5-2 2-5-5 2-2Z" />
      <path d="m14 7 3 3" />
      <path d="M14 8 5 17v2h2l9-9" />
    </>
  ),
  line: <path d="M5 19 19 5" />,
  rect: <rect x="4" y="4" width="16" height="16" />,
  undo: (
    <>
      <path d="M9 6 4 11l5 5" />
      <path d="M4 11h9a7 7 0 0 1 7 7v1" />
    </>
  ),
  redo: (
    <>
      <path d="m15 6 5 5-5 5" />
      <path d="M20 11h-9a7 7 0 0 0-7 7v1" />
    </>
  ),
  save: (
    <>
      <path d="M5 4h11l3 3v13H5V4Z" />
      <path d="M8 4v6h8V4" />
      <path d="M8 14h8v6H8z" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v10" />
      <path d="m8 10 4 4 4-4" />
      <path d="M5 20h14" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7v13h12V7" />
      <path d="M10 11v5M14 11v5" />
    </>
  ),
  folder: <path d="M3 6h6l2 2h10v11H3V6Z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  fit: (
    <>
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
    </>
  ),
  x: <path d="m6 6 12 12M18 6 6 18" />,
  check: <path d="m5 13 4 4L19 7" />,
  grid: (
    <>
      <rect x="4" y="4" width="16" height="16" />
      <path d="M4 12h16M12 4v16" />
    </>
  ),
};

export default function Icon({ name, className = "h-4 w-4" }) {
  const paths = PATHS[name];
  if (!paths) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="square"
      strokeLinejoin="miter"
      shapeRendering="geometricPrecision"
      className={className}
      aria-hidden="true"
    >
      {paths}
    </svg>
  );
}
