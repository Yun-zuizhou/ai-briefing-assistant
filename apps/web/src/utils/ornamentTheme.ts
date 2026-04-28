export type OrnamentLevel = 'subtle' | 'classic' | 'rich';

export const ORNAMENT_LEVEL_STORAGE_KEY = 'ui:ornament-level';
export const ORNAMENT_LEVEL_DEFAULT: OrnamentLevel = 'classic';

export const ORNAMENT_LEVEL_LABELS: Record<OrnamentLevel, string> = {
  subtle: '轻装饰',
  classic: '标准',
  rich: '浓装饰',
};

const ORNAMENT_LEVEL_SET = new Set<OrnamentLevel>(['subtle', 'classic', 'rich']);

const isOrnamentLevel = (value: unknown): value is OrnamentLevel =>
  typeof value === 'string' && ORNAMENT_LEVEL_SET.has(value as OrnamentLevel);

const resolveOrnamentLevel = (value: unknown): OrnamentLevel => {
  if (!isOrnamentLevel(value)) {
    return ORNAMENT_LEVEL_DEFAULT;
  }
  return value;
};

const persistOrnamentLevel = (level: OrnamentLevel) => {
  try {
    window.localStorage.setItem(ORNAMENT_LEVEL_STORAGE_KEY, level);
  } catch {
    // Ignore localStorage failures (e.g. privacy mode).
  }
};

export const getStoredOrnamentLevel = (): OrnamentLevel => {
  if (typeof window === 'undefined') {
    return ORNAMENT_LEVEL_DEFAULT;
  }
  try {
    return resolveOrnamentLevel(window.localStorage.getItem(ORNAMENT_LEVEL_STORAGE_KEY));
  } catch {
    return ORNAMENT_LEVEL_DEFAULT;
  }
};

export const applyOrnamentLevel = (level: OrnamentLevel): OrnamentLevel => {
  const resolvedLevel = resolveOrnamentLevel(level);
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-ornament-level', resolvedLevel);
  }
  if (typeof window !== 'undefined') {
    persistOrnamentLevel(resolvedLevel);
  }
  return resolvedLevel;
};

export const bootstrapOrnamentLevel = (): OrnamentLevel => {
  if (typeof window === 'undefined') {
    return ORNAMENT_LEVEL_DEFAULT;
  }
  const queryLevel = new URLSearchParams(window.location.search).get('ornament');
  const storedLevel = getStoredOrnamentLevel();
  const resolvedLevel = isOrnamentLevel(queryLevel) ? queryLevel : storedLevel;
  return applyOrnamentLevel(resolvedLevel);
};
