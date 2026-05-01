export function MetaText({
  items,
  className = '',
}: {
  items: string[];
  className?: string;
}) {
  return (
    <div className={`meta-text ${className}`.trim()}>
      {items.filter(Boolean).map((item, i) => (
        <span key={i}>
          {i > 0 ? <span className="meta-text-sep"> · </span> : null}
          <span className="meta-text-item">{item}</span>
        </span>
      ))}
    </div>
  );
}
