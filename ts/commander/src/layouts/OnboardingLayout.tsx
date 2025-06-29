// src/layouts/OnboardingLayout.tsx
import { Outlet, useLocation } from "react-router-dom";
import { ONBOARDING_STEPS } from "@/onboardingSteps";
import { StepProgress } from "@/components/StepProgress";

export default function OnboardingLayout() {
    const { pathname } = useLocation();

    // exact match instead of startsWith:
    let currentIndex = ONBOARDING_STEPS.findIndex((s) => s.path === pathname);
    if (currentIndex === -1) {
        // fallback: maybe someone reloaded on a deeper route with a trailing slash
        currentIndex = ONBOARDING_STEPS.findIndex((s) =>
            pathname.startsWith(s.path + "/")
        );
    }
    // ensure we never go below 0
    if (currentIndex < 0) currentIndex = 0;

    const total = ONBOARDING_STEPS.length;

    return (
        <div className="h-screen flex flex-col items-center pt-12 bg-gray-50">
            <div className="w-full max-w-xl px-4">
                <StepProgress currentIndex={currentIndex} total={total} />
                <Outlet />
            </div>
        </div>
    );
}
