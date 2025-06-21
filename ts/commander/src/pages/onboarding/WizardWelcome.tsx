import { useAppState } from "@/stores/AppState";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function WizardWelcome() {
    const { setOnboarded } = useAppState();
    const nav = useNavigate();

    const next = () => {
        setOnboarded(false);          // ensure flag isn’t set until complete
        nav("/onboarding/providers");
    };

    return (
        <div className="p-6 max-w-lg mx-auto">
            <h1 className="text-2xl font-semibold mb-4">Welcome to Corpora Commander</h1>
            <p className="mb-6">
                Let's get your AI backends configured so you can start authoring right away.
            </p>
            <Button onClick={next}>Configure LLMs</Button>
        </div>
    );
}
