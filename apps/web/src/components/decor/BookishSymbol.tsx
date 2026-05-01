type Shape = 'diamond' | 'star' | 'square' | 'triangle-up' | 'triangle-down' | 'circle' | 'hexagon' | 'cross' | 'plus' | 'check' | 'chevron-left' | 'chevron-right';

function renderPath(shape: Shape, variant: 'fill' | 'outline'): string {
  const o = variant === 'outline';
  switch (shape) {
    case 'diamond':
      return o
        ? 'M12 2 L22 12 L12 22 L2 12 Z'
        : 'M3 3 L12 1 L21 3 L23 12 L21 21 L12 23 L3 21 L1 12 Z';
    case 'star':
      return 'M12 2 L14.5 9.5 L22 11 L16 17 L17.5 24.5 L12 20.5 L6.5 24.5 L8 17 L2 11 L9.5 9.5 Z';
    case 'square':
      return o
        ? 'M5 5 H19 V19 H5 Z'
        : 'M4 4 H20 V20 H4 Z';
    case 'triangle-up':
      return o
        ? 'M12 4 L22 20 H2 Z'
        : 'M12 3 L23 21 H1 Z';
    case 'triangle-down':
      return o
        ? 'M2 4 H22 L12 20 Z'
        : 'M1 3 H23 L12 21 Z';
    case 'circle':
      return o
        ? 'M12 3 A9 9 0 1 1 11.99 3 Z'
        : 'M12 2 A10 10 0 1 1 11.99 2 Z';
    case 'hexagon':
      return o
        ? 'M12 3 L21 8 L21 16 L12 21 L3 16 L3 8 Z'
        : 'M12 2 L22 7.5 L22 16.5 L12 22 L2 16.5 L2 7.5 Z';
    case 'cross':
      return 'M6 6 L18 18 M18 6 L6 18';
    case 'plus':
      return 'M12 4 V20 M4 12 H20';
    case 'check':
      return 'M5 13 L9 17 L19 7';
    case 'chevron-left':
      return 'M14 5 L7 12 L14 19';
    case 'chevron-right':
      return 'M10 5 L17 12 L10 19';
  }
}

export function BookishSymbol({
  shape = 'diamond',
  size = 12,
  variant = 'fill',
  className = '',
}: {
  shape?: Shape;
  size?: number;
  variant?: 'fill' | 'outline';
  className?: string;
}) {
  const isLine = ['cross', 'plus', 'check', 'chevron-left', 'chevron-right'].includes(shape);
  const path = renderPath(shape, variant);

  return (
    <span
      className={`bookish-symbol ${className}`.trim()}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={isLine ? 'none' : 'currentColor'}
        stroke={isLine ? 'currentColor' : 'none'}
        strokeWidth={isLine ? 2 : 0}
        strokeLinecap="round"
        strokeLinejoin="round"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={path} />
      </svg>
    </span>
  );
}
