const TONES = {
  info: "border-cyan text-cyan",
  success: "border-mint text-mint",
  warn: "border-amber text-amber",
  error: "border-rose text-rose",
};

export default function Toast({ notice }) {
  if (!notice) return null;
  return (
    <div
      key={notice.key}
      role="status"
      aria-live="polite"
      className={`animate-toast fixed bottom-5 left-1/2 z-50 w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 border-2 bg-deep px-4 py-3 shadow-[5px_5px_0_#000] ${
        TONES[notice.tone] || TONES.info
      }`}
    >
      <p className="font-pixel text-[8px] leading-relaxed tracking-[0.06em]">
        {notice.message}
      </p>
    </div>
  );
}
