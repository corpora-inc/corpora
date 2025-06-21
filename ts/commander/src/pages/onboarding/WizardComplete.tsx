import { useNavigate } from "react-router-dom";
import { useAppState } from "@/stores/AppState";
import { Button } from "@/components/ui/button";
import { OnboardingContainer } from "@/components/OnboardingContainer";

export default function WizardComplete() {
    const navigate = useNavigate();
    const { setOnboarded } = useAppState();

    const finish = () => {
        setOnboarded(true);
        navigate("/projects", { replace: true });
    };

    return (
        <OnboardingContainer
            title="All Set!"
            subtitle="Your LLM providers are configured. Let's create your first project."
        >
            <Button onClick={finish}>Create First Project</Button>
        </OnboardingContainer>
    );
}
