import React from "react";

interface OnboardingContainerProps {
    title?: string;
    subtitle?: string;
    children: React.ReactNode;
}

export function OnboardingContainer({
    title,
    subtitle,
    children,
}: OnboardingContainerProps) {
    return (
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-md p-8 space-y-6 min-h-[270px] mx-auto">
            {title && <h1 className="text-3xl font-semibold">{title}</h1>}
            {subtitle && <p className="text-neutral-600">{subtitle}</p>}
            <div className="space-y-4">{children}</div>
        </div>
    );
}
