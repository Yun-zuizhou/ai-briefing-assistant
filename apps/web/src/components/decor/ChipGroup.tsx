import { BookishChip } from './BookishChip';

export function ChipGroup({
  options,
  active,
  onChange,
  className = '',
}: {
  options: string[];
  active: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={`chip-group ${className}`.trim()}>
      {options.map((opt) => (
        <BookishChip
          key={opt}
          label={opt}
          active={active === opt}
          onClick={() => onChange(opt)}
        />
      ))}
    </div>
  );
}
