// src/pages/OnboardingPage.tsx
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
    const navigate = useNavigate();

    const handleFinish = () => {
        // client-side nav — no full reload, so App’s effect won’t fire again
        navigate("/onboarding/providers");
    };

    return (
        <div className="p-6 max-w-xl mx-auto">
            <h1 className="text-2xl font-semibold mb-4">
                Welcome to Corpora Commander
            </h1>
            <p className="mb-6">
                This app helps you author and manage structured book projects with full
                control over sections, subsections, and AI-generated images.
            </p>
            <Button onClick={handleFinish}>Get Started</Button>
        </div>
    );
}
