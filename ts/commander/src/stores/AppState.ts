import { create } from "zustand";
import { persist } from "zustand/middleware";

type AppState = {
    onboarded: boolean;
    setOnboarded: (b: boolean) => void;
    resetOnboarding: () => void;

    lastRoute: string | null;
    setLastRoute: (route: string) => void;

    lastProjectId: string | null;
    setLastProjectId: (id: string) => void;
};

export const useAppState = create<AppState>()(
    persist(
        (set) => ({
            onboarded: false,
            setOnboarded: (b) => set({ onboarded: b }),
            resetOnboarding: () =>
                set({
                    onboarded: false,
                    lastRoute: null,
                    lastProjectId: null,
                }),

            lastRoute: null,
            setLastRoute: (route) => set({ lastRoute: route }),

            lastProjectId: null,
            setLastProjectId: (id) => set({ lastProjectId: id }),
        }),
        { name: "corpora-app-state" }
    )
);
