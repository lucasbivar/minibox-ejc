import type { AuthUserDto } from "@minibox/shared";
import { create } from "zustand";

const STORAGE_KEY = "minibox:auth";

interface StoredAuth {
  token: string;
  user: AuthUserDto;
}

function loadStoredAuth(): StoredAuth | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

interface AuthState {
  token: string | null;
  user: AuthUserDto | null;
  isAuthenticated: boolean;
  setSession: (session: StoredAuth) => void;
  clearSession: () => void;
}

const stored = loadStoredAuth();

export const useAuthStore = create<AuthState>((set) => ({
  token: stored?.token ?? null,
  user: stored?.user ?? null,
  isAuthenticated: Boolean(stored?.token),
  setSession: ({ token, user }) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
    set({ token, user, isAuthenticated: true });
  },
  clearSession: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
