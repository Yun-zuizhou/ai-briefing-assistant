import { createContext, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { collectedItems as initialCollectedItems, dailyStories as initialStories } from '../data/demoSeeds';
import type { CollectedItem, DailyStory } from '../data/types';

interface DemoAppContextType {
  collectedItems: CollectedItem[];
  setCollectedItems: Dispatch<SetStateAction<CollectedItem[]>>;
  stories: DailyStory[];
  setStories: Dispatch<SetStateAction<DailyStory[]>>;
}

const DEMO_STORAGE_KEY = 'jianbao_demo_state';

const DemoAppContext = createContext<DemoAppContextType | undefined>(undefined);

function loadDemoState() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as {
      collectedItems: CollectedItem[];
      stories: DailyStory[];
    };
  } catch (error) {
    console.error('Failed to load demo state:', error);
    return null;
  }
}

function persistDemoState(state: { collectedItems: CollectedItem[]; stories: DailyStory[] }) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to persist demo state:', error);
  }
}

export function DemoAppProvider({ children }: { children: ReactNode }) {
  const persisted = useMemo(() => loadDemoState(), []);
  const [collectedItems, setCollectedItems] = useState<CollectedItem[]>(
    () => persisted?.collectedItems || initialCollectedItems,
  );
  const [stories, setStories] = useState<DailyStory[]>(
    () => persisted?.stories || initialStories,
  );

  const value = useMemo(
    () => ({ collectedItems, setCollectedItems, stories, setStories }),
    [collectedItems, stories],
  );

  useEffect(() => {
    persistDemoState({ collectedItems, stories });
  }, [collectedItems, stories]);

  return <DemoAppContext.Provider value={value}>{children}</DemoAppContext.Provider>;
}

export { DemoAppContext };
