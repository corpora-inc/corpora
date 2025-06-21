// src/layouts/OnboardingLayout.tsx
import { Outlet, useLocation } from "react-router-dom";
import { ONBOARDING_STEPS } from "@/onboardingSteps";
import { StepProgress } from "@/components/StepProgress";

export default function OnboardingLayout() {
    const { pathname } = useLocation();
    const currentIndex =
        ONBOARDING_STEPS.findIndex((s) => pathname.startsWith(s.path));
    const total = ONBOARDING_STEPS.length;

    return (
        <div className="h-screen flex flex-col items-center pt-12 bg-gray-50">
            <div className="w-full max-w-2xl px-4">
                <StepProgress currentIndex={currentIndex} total={total} />
                <Outlet />
            </div>
        </div>
    );
}
