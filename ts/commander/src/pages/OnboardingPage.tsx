import { useAppState } from "@/stores/AppState";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
    const { setOnboarded } = useAppState();

    const handleFinish = () => {
        setOnboarded(true);
        location.href = "/new-project"; // hard reload to trigger App.tsx logic
    };

    return (
        <div className="p-6 max-w-xl mx-auto">
            <h1 className="text-2xl font-semibold mb-4">Welcome to Corpora Commander</h1>
            <p className="mb-6">
                This app helps you author and manage structured book projects with full control
                over sections, subsections, and AI-generated images.
            </p>
            <Button onClick={handleFinish}>Get Started</Button>
        </div>
    );
}
