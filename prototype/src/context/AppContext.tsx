import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { useState, useCallback, useMemo, useEffect, startTransition } from 'react';
import { AppContext, type AppContextType, type Message, type Todo } from './context';
import { defaultInterests, type Interest } from '../utils/intentParser';

export type { Message, Todo };

interface Push {
  id: number;
  type: string;
  category: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  time: string;
  collected: boolean;
  deadline?: string;
  tracking?: boolean;
}

interface CollectedItem {
  id: number;
  type: string;
  category: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  collectedAt: string;
  tracking: boolean;
  deadline?: string;
  trackStatus?: string;
  trackProgress?: { step: string; done: boolean; date?: string }[];
}

interface Story {
  id: number;
  date: string;
  type: string;
  title: string;
  content: string;
  stats: {
    viewed: number;
    collected: number;
    recorded: number;
  };
  highlights: string[];
  literaryContent?: string;
  feedback?: string;
  journalSummary?: string;
}

interface User {
  isLoggedIn: boolean;
  username: string;
  email: string;
}

interface ThoughtRecord {
  id: number;
  content: string;
  createdAt: string;
}

interface PersistedState {
  user: User;
  messages: Message[];
  todos: Todo[];
  collectedItems: CollectedItem[];
  stories: Story[];
  interests: Interest[];
  pushTime: string;
  thoughtRecords: ThoughtRecord[];
}

const STORAGE_KEY = 'jianbao_app_state';

function loadPersistedState(): PersistedState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load persisted state:', e);
  }
  return null;
}

function persistState(state: Partial<PersistedState>): void {
  try {
    const current = loadPersistedState() || {} as PersistedState;
    const updated = { ...current, ...state };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to persist state:', e);
  }
}

function createInitialThoughtRecords(): ThoughtRecord[] {
  const today = new Date();
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = String(9 + Math.floor(Math.random() * 10)).padStart(2, '0');
    const minute = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    return `${year}/${month}/${day} ${hour}:${minute}`;
  };
  
  const mockRecords: ThoughtRecord[] = [];
  
  const todayRecords = [
    '今天看到了GPT-5的发布，感觉AI发展太快了',
    '词类研究的新视角很有意思，认知语言学的角度很新颖',
  ];
  todayRecords.forEach((content, i) => {
    mockRecords.push({
      id: Date.now() + i,
      content,
      createdAt: formatDate(today),
    });
  });
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayRecords = [
    '投递了远程内容运营的简历，希望能有回应',
    '收藏了关于AI发展的几篇文章',
  ];
  yesterdayRecords.forEach((content, i) => {
    mockRecords.push({
      id: Date.now() + 100 + i,
      content,
      createdAt: formatDate(yesterday),
    });
  });
  
  const dayBefore = new Date(today);
  dayBefore.setDate(dayBefore.getDate() - 2);
  const dayBeforeRecords = [
    '开始关注认知语言学的研究进展',
    '思考了AI与人类创造力的关系',
  ];
  dayBeforeRecords.forEach((content, i) => {
    mockRecords.push({
      id: Date.now() + 200 + i,
      content,
      createdAt: formatDate(dayBefore),
    });
  });
  
  return mockRecords;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const persistedState = useMemo(() => loadPersistedState(), []);
  
  const [user, setUser] = useState<User>(() => 
    persistedState?.user || { isLoggedIn: false, username: '', email: '' }
  );
  const [messages, setMessages] = useState<Message[]>(() => 
    persistedState?.messages || []
  );
  const [todos, setTodos] = useState<Todo[]>(() => 
    persistedState?.todos || []
  );
  const [pushes, setPushes] = useState<Push[]>([]);
  const [collectedItems, setCollectedItems] = useState<CollectedItem[]>(() => 
    persistedState?.collectedItems || []
  );
  const [stories, setStories] = useState<Story[]>(() => 
    persistedState?.stories || []
  );
  const [interests, setInterests] = useState<Interest[]>(() => 
    persistedState?.interests || defaultInterests
  );
  const [pushTime, setPushTime] = useState<string>(() => 
    persistedState?.pushTime || '08:00'
  );
  const [openChatPanel, setOpenChatPanel] = useState<boolean>(false);
  const [thoughtRecords, setThoughtRecords] = useState<ThoughtRecord[]>(() => 
    persistedState?.thoughtRecords || createInitialThoughtRecords()
  );

  useEffect(() => {
    persistState({
      user,
      messages,
      todos,
      collectedItems,
      stories,
      interests,
      pushTime,
      thoughtRecords,
    });
  }, [user, messages, todos, collectedItems, stories, interests, pushTime, thoughtRecords]);

  useEffect(() => {
    let cancelled = false;
    if (persistedState) {
      return () => {
        cancelled = true;
      };
    }

    const loadDemoData = async () => {
      const demoData = await import('../data/demoSeeds');
      if (cancelled) {
        return;
      }
      startTransition(() => {
        setMessages((prev) => (prev.length > 0 ? prev : demoData.chatHistory));
        setTodos((prev) => (prev.length > 0 ? prev : demoData.todayTodos));
        setPushes((prev) => (prev.length > 0 ? prev : demoData.todayPushes as Push[]));
        setCollectedItems((prev) => (prev.length > 0 ? prev : demoData.collectedItems as CollectedItem[]));
        setStories((prev) => (prev.length > 0 ? prev : demoData.dailyStories as Story[]));
      });
    };

    void loadDemoData();
    return () => {
      cancelled = true;
    };
  }, [persistedState]);

  const login = useCallback((username: string, email: string) => {
    setUser({ isLoggedIn: true, username, email });
  }, []);

  const logout = useCallback(() => {
    setUser({ isLoggedIn: false, username: '', email: '' });
  }, []);

  const addInterest = useCallback((name: string) => {
    setInterests((prev) => {
      const existing = prev.find((i) => i.name === name);
      if (existing) {
        return prev.map((i) => (i.name === name ? { ...i, active: true } : i));
      }
      return [
        ...prev,
        { id: Date.now().toString(), name, icon: '📌', active: true, frequency: 'daily' as const },
      ];
    });
  }, []);

  const removeInterest = useCallback((name: string) => {
    setInterests((prev) => prev.map((i) => (i.name === name ? { ...i, active: false } : i)));
  }, []);

  const addThoughtRecord = useCallback((content: string) => {
    setThoughtRecords((prev) => [
      ...prev,
      { id: Date.now(), content, createdAt: new Date().toLocaleString() },
    ]);
  }, []);

  const value: AppContextType = useMemo(() => ({
    user,
    setUser: setUser as Dispatch<SetStateAction<User>>,
    messages,
    setMessages: setMessages as Dispatch<SetStateAction<Message[]>>,
    todos,
    setTodos: setTodos as Dispatch<SetStateAction<Todo[]>>,
    pushes,
    setPushes: setPushes as Dispatch<SetStateAction<Push[]>>,
    collectedItems,
    setCollectedItems: setCollectedItems as Dispatch<SetStateAction<CollectedItem[]>>,
    stories,
    setStories: setStories as Dispatch<SetStateAction<Story[]>>,
    interests,
    setInterests: setInterests as Dispatch<SetStateAction<Interest[]>>,
    addInterest,
    removeInterest,
    pushTime,
    setPushTime,
    thoughtRecords,
    setThoughtRecords: setThoughtRecords as Dispatch<SetStateAction<ThoughtRecord[]>>,
    addThoughtRecord,
    login,
    logout,
    openChatPanel,
    setOpenChatPanel,
  }), [user, messages, todos, pushes, collectedItems, stories, interests, pushTime, thoughtRecords, addInterest, removeInterest, addThoughtRecord, login, logout, openChatPanel]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
