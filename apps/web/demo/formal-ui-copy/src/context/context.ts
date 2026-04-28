import { createContext, type Dispatch, type SetStateAction } from 'react';

export interface AppUser {
  id?: number;
  isLoggedIn: boolean;
  username: string;
  email: string;
  nickname?: string | null;
}

export interface AppContextType {
  user: AppUser;
  authResolved: boolean;
  authLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: {
    username: string;
    email: string;
    password: string;
    nickname?: string | null;
  }) => Promise<void>;
  logout: () => Promise<void>;
  openChatPanel: boolean;
  setOpenChatPanel: Dispatch<SetStateAction<boolean>>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
