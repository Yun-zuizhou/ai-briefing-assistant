export function Dateline({
  label,
  time,
  className = '',
}: {
  label: string;
  time?: string;
  className?: string;
}) {
  return (
    <div className={`dateline ${className}`.trim()}>
      <span className="dateline-label">{label}</span>
      {time ? (
        <>
          <span className="dateline-dot">·</span>
          <span className="dateline-time">{time}</span>
        </>
      ) : null}
    </div>
  );
}
