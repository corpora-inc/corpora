import { useAppState } from "@/stores/AppState";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function WizardComplete() {
    const { setOnboarded } = useAppState();
    const nav = useNavigate();

    const finish = () => {
        setOnboarded(true);
        nav("/new-project", { replace: true });
    };

    return (
        <div className="p-6 max-w-lg mx-auto text-center">
            <h1 className="text-2xl font-semibold mb-4">All Set!</h1>
            <p className="mb-6">
                Your LLM providers are configured. You can always update them in Settings.
            </p>
            <Button onClick={finish}>Create Your First Project</Button>
        </div>
    );
}
