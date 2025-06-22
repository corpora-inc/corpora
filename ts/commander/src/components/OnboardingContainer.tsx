// src/components/OnboardingContainer.tsx
import React from "react";

interface OnboardingContainerProps {
    title?: string;
    subtitle?: string;
    children?: React.ReactNode;
    footer?: React.ReactNode;
}

export function OnboardingContainer({
    title,
    subtitle,
    children,
    footer,
}: OnboardingContainerProps) {
    return (
        <div className="flex w-full flex-col bg-white rounded-2xl shadow-md p-8 space-y-6 min-h-[380px]">
            {title && <h1 className="text-3xl font-semibold">{title}</h1>}
            {subtitle && <p className="text-neutral-600">{subtitle}</p>}

            {/* Main content grows to fill */}
            <div className="flex-1 space-y-4">{children}</div>

            {/* Footer actions pinned to bottom-right */}
            {footer && (
                <div className="flex justify-between items-center">
                    {footer}
                </div>
            )}
        </div>
    );
}
