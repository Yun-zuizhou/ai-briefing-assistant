import { createContext, type Dispatch, type SetStateAction } from 'react';
import type { Interest, IntentType } from '../utils/intentParser';

export interface Message {
  id: number;
  role: 'assistant' | 'user';
  content: string;
  intent?: IntentType;
}

export interface Todo {
  id: number;
  content: string;
  priority: number;
  estimatedTime: string;
  done: boolean;
  createdAt: string;
}

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

export interface AppContextType {
  user: User;
  setUser: Dispatch<SetStateAction<User>>;
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  todos: Todo[];
  setTodos: Dispatch<SetStateAction<Todo[]>>;
  pushes: Push[];
  setPushes: Dispatch<SetStateAction<Push[]>>;
  collectedItems: CollectedItem[];
  setCollectedItems: Dispatch<SetStateAction<CollectedItem[]>>;
  stories: Story[];
  setStories: Dispatch<SetStateAction<Story[]>>;
  interests: Interest[];
  setInterests: Dispatch<SetStateAction<Interest[]>>;
  addInterest: (name: string) => void;
  removeInterest: (name: string) => void;
  pushTime: string;
  setPushTime: Dispatch<SetStateAction<string>>;
  thoughtRecords: ThoughtRecord[];
  setThoughtRecords: Dispatch<SetStateAction<ThoughtRecord[]>>;
  addThoughtRecord: (content: string) => void;
  login: (username: string, email: string) => void;
  logout: () => void;
  openChatPanel: boolean;
  setOpenChatPanel: Dispatch<SetStateAction<boolean>>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
