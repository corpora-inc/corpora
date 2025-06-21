// src/layouts/OnboardingLayout.tsx
import { Outlet } from "react-router-dom";
import { OnboardingStepper } from "@/components/OnboardingStepper";

export default function OnboardingLayout() {
    return (
        <div className="h-screen flex flex-col items-center pt-12 bg-gray-50">
            <div className="w-full max-w-2xl px-4">
                <OnboardingStepper />
                <Outlet />
            </div>
        </div>
    );
}
