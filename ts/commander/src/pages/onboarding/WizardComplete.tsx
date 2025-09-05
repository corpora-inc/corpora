// src/pages/onboarding/WizardComplete.tsx
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/stores/AppState";
import { Button } from "@/components/ui/button";
import { OnboardingContainer } from "@/components/OnboardingContainer";
import { ChevronRight, Settings } from "lucide-react";

export default function WizardComplete() {
    const navigate = useNavigate();
    const { setOnboarded } = useAppState();

    const finish = () => {
        setOnboarded(true);
        // send them straight into the new-project flow
        navigate("/projects");
    };

    return (
        <OnboardingContainer
            title="All Set!"
            subtitle="Your LLM providers are configured. Let's create your first project."
            footer={
                <>
                    <div />
                    <Button onClick={finish}>
                        Let's Go!
                        <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                </>
            }
        >
            <div className="text-center space-y-4 py-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-center mb-2">
                        <Settings className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="font-medium text-blue-900">Quick Tip</span>
                    </div>
                    <p className="text-sm text-blue-800">
                        You can always change your AI provider settings later by clicking the settings icon (⚙️) in the top navigation bar.
                    </p>
                </div>
                
                <div className="text-sm text-gray-600">
                    <p>You're ready to start creating structured book projects with AI assistance!</p>
                </div>
            </div>
        </OnboardingContainer>
    );
}
