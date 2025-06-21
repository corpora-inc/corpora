import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { OnboardingContainer } from "@/components/OnboardingContainer";

export default function WizardWelcome() {
    const navigate = useNavigate();
    return (
        <OnboardingContainer
            title="Welcome to Corpora Commander"
            subtitle="Author and manage structured book projects with AI-assisted images, sections, and more."
        >
            <Button onClick={() => navigate("/onboarding/providers")}>
                Get Started
            </Button>
        </OnboardingContainer>
    );
}
