export function StitchDivider({
  height = 40,
  className = '',
}: {
  height?: number;
  className?: string;
}) {
  return (
    <div
      className={`stitch-divider ${className}`.trim()}
      style={{ height }}
      aria-hidden="true"
    />
  );
}
