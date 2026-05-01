export function BookishChip({
  label,
  active = false,
  onClick,
  className = '',
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'bookish-chip',
        active ? 'bookish-chip--active' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {label}
    </button>
  );
}
