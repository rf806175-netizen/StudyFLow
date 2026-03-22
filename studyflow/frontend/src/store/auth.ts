import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../api/client";

interface FreeActions {
  organize: number; // times used free study organization
  search: number;   // times used free Wikipedia search
}

interface AuthState {
  user: User | null;
  guestMode: boolean;
  freeActions: FreeActions;
  setUser: (user: User | null) => void;
  setGuestMode: (v: boolean) => void;
  consumeFreeAction: (action: keyof FreeActions) => boolean;
  isPremium: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      guestMode: false,
      freeActions: { organize: 0, search: 0 },
      setUser: (user) => set({ user }),
      setGuestMode: (v) => set({ guestMode: v }),
      consumeFreeAction: (action) => {
        const { freeActions } = get();
        if (freeActions[action] === 0) {
          set({ freeActions: { ...freeActions, [action]: 1 } });
          return true;
        }
        return false;
      },
      isPremium: () => {
        const user = get().user;
        if (!user || user.subscriptionTier !== "premium") return false;
        if (user.subscriptionExpiresAt) {
          return new Date(user.subscriptionExpiresAt) > new Date();
        }
        return true;
      },
    }),
    {
      name: "studyflow-auth",
      partialize: (state) => ({
        user: state.user,
        freeActions: state.freeActions,
      }),
    }
  )
);
