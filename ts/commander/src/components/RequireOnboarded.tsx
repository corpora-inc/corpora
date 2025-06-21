// src/components/RequireOnboarded.tsx
import type { JSX } from "react";
import { useAppState } from "@/stores/AppState";
import { Navigate, useLocation } from "react-router-dom";

export function RequireOnboarded({ children }: { children: JSX.Element }) {
    const { onboarded } = useAppState();
    const loc = useLocation();

    if (!onboarded) {
        // remember where they wanted to go
        return <Navigate to="/onboarding" state={{ from: loc }} replace />;
    }
    return children;
}
