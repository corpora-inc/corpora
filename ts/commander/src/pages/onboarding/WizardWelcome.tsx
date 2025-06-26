// src/pages/onboarding/WizardWelcome.tsx
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { OnboardingContainer } from "@/components/OnboardingContainer";
import { ChevronRight } from "lucide-react";

export default function WizardWelcome() {
    const navigate = useNavigate();

    return (
        <OnboardingContainer
            title="Welcome to Corpora Commander"
            subtitle="Author and manage structured book projects with AI-assisted content."
            footer={
                <>
                    {/* empty spacer to push the button right */}
                    <div />
                    <Button
                        onClick={() => navigate("/onboarding/lmstudio")}
                    >
                        Get Started
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </>
            }
        >
            {/* no extra content */}
        </OnboardingContainer>
    );
}
