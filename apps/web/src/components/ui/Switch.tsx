import type { ButtonHTMLAttributes } from 'react';
import Button from './Button';

interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'role' | 'aria-checked'> {
  checked: boolean;
  knobClassName?: string;
}

export default function Switch({
  checked,
  knobClassName = '',
  className = '',
  type = 'button',
  ...props
}: SwitchProps) {
  const resolvedClassName = `${className}${checked ? ' is-on' : ''}`.trim();

  return (
    <Button
      type={type}
      variant="unstyled"
      role="switch"
      aria-checked={checked}
      className={resolvedClassName}
      {...props}
    >
      <span className={knobClassName} />
    </Button>
  );
}
