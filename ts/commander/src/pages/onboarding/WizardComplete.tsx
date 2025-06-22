// src/pages/onboarding/WizardComplete.tsx
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/stores/AppState";
import { Button } from "@/components/ui/button";
import { OnboardingContainer } from "@/components/OnboardingContainer";
import { ChevronRight } from "lucide-react";

export default function WizardComplete() {
    const navigate = useNavigate();
    const { setOnboarded } = useAppState();

    const handleFinish = () => {
        setOnboarded(true);
        navigate("/projects", { replace: true });
    };

    return (
        <OnboardingContainer
            title="All Set!"
            subtitle="Your LLM providers are configured. Let's create your first project."
            footer={
                <>
                    {/* spacer to push button right */}
                    <div />
                    <Button onClick={handleFinish}
                        className="cursor-pointer"
                    >
                        Create First Project
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </>
            }
        >
            {/* You could add additional summary or tips here if desired */}
        </OnboardingContainer>
    );
}
