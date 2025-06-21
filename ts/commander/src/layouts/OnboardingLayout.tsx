// src/layouts/OnboardingLayout.tsx
import { Outlet } from "react-router-dom";

export default function OnboardingLayout() {
    return (
        <div className="h-screen flex flex-col justify-center items-center bg-gray-50">
            {/* optional logo/header */}
            <Outlet />
        </div>
    );
}
