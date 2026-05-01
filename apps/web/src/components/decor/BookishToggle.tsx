export function BookishToggle({
  active = false,
  onChange,
  className = '',
}: {
  active?: boolean;
  onChange?: (active: boolean) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={() => onChange?.(!active)}
      className={`bookish-toggle ${active ? 'bookish-toggle--active' : ''} ${className}`.trim()}
    >
      <span className="bookish-toggle-thumb" />
    </button>
  );
}
