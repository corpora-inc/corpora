// src/pages/onboarding/WizardComplete.tsx
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/stores/AppState";
import { Button } from "@/components/ui/button";
import { OnboardingContainer } from "@/components/OnboardingContainer";
import { ChevronRight } from "lucide-react";

export default function WizardComplete() {
    const navigate = useNavigate();
    const { setOnboarded } = useAppState();

    const finish = () => {
        setOnboarded(true);
        // send them straight into the new-project flow
        navigate("/projects/new");
    };

    return (
        <OnboardingContainer
            title="All Set!"
            subtitle="Your LLM providers are configured. Let's create your first project."
            footer={
                <>
                    <div />
                    <Button onClick={finish}>
                        Create First Project
                        <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                </>
            }
        >
            {/* you can add tips or summary here */}
        </OnboardingContainer>
    );
}
