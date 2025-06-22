// src/components/OnboardingContainer.tsx
import React from "react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

interface OnboardingContainerProps {
    title?: string;
    skip?: string;
    subtitle?: string;
    children?: React.ReactNode;
    footer?: React.ReactNode;
}

export function OnboardingContainer({
    title,
    subtitle,
    children,
    footer,
    skip,
}: OnboardingContainerProps) {
    const navigate = useNavigate();

    return (
        <div className="flex w-full flex-col bg-white rounded-2xl shadow-md p-8 space-y-6 min-h-[380px]">
            <div className="flex w-full justify-between items-center">
                {title && <h1 className="text-3xl font-semibold">{title}</h1>}
                {skip && (
                    <Button variant="ghost" onClick={() => navigate(skip)}>
                        Skip
                    </Button>
                )}
            </div>
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
