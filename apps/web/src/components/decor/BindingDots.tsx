export function BindingDots({
  count = 5,
  gap = 14,
  className = '',
}: {
  count?: number;
  gap?: number;
  className?: string;
}) {
  return (
    <div
      className={`binding-dots ${className}`.trim()}
      style={{ gap }}
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="binding-dots-dot" />
      ))}
    </div>
  );
}
