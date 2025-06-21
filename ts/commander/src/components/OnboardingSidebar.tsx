// src/components/OnboardingSidebar.tsx
import { Link, useLocation } from "react-router-dom";
import { ONBOARDING_STEPS } from "@/onboardingSteps";

export function OnboardingSidebar() {
    const { pathname } = useLocation();

    return (
        <nav className="w-48 min-w-[12rem] border-r bg-white p-4 space-y-1 overflow-y-auto">
            {ONBOARDING_STEPS.map(({ label, path }) => {
                const active = pathname.startsWith(path);
                return (
                    <Link
                        key={path}
                        to={path}
                        className={`block px-3 py-2 rounded ${active
                                ? "bg-neutral-200 font-semibold text-neutral-900"
                                : "text-neutral-700 hover:bg-neutral-100"
                            }`}
                    >
                        {label}
                    </Link>
                );
            })}
        </nav>
    );
}
