import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/database";

interface AuthState {
  user: User | null;
  session: { access_token: string; user_id: string } | null;
  setUser: (user: User | null) => void;
  setSession: (session: AuthState["session"]) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      clear: () => set({ user: null, session: null }),
    }),
    { name: "nexio-auth" }
  )
);
