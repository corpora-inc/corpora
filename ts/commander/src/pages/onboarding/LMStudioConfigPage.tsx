// src/pages/onboarding/LMStudioConfigPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLLMConfigStore } from "@/stores/LLMConfigStore";
import type { LMStudioConfig } from "@/stores/LLMConfigStore";
import { OnboardingContainer } from "@/components/OnboardingContainer";
import { Button } from "@/components/ui/button";

export default function LMStudioConfigPage() {
    const navigate = useNavigate();
    const { addConfig } = useLLMConfigStore();

    const [baseUrl, setBaseUrl] = useState(
        "http://host.docker.internal:1234/v1"
    );

    const testConnection = async () => {
        // TODO: call your backend ping endpoint, e.g. /api/llm/ping_lmstudio
        // return (await fetch("/api/llm/ping_lmstudio", { method: "POST", body: JSON.stringify({ baseUrl }) })).ok;
        return true;
    };

    const handleNext = async () => {
        if (await testConnection()) {
            const cfg: LMStudioConfig = { provider: "lmstudio", baseUrl };
            addConfig(cfg);
            navigate("/onboarding/openai");
        } else {
            alert("Unable to reach LM Studio at that URL. Please check and try again.");
        }
    };

    return (
        <OnboardingContainer
            title="Configure LM Studio"
            footer={
                <>
                    <Button variant="secondary" onClick={() => navigate("/onboarding")}>
                        Back
                    </Button>

                    <div className="flex space-x-2">
                        <Button onClick={testConnection}>Test</Button>
                        <Button onClick={handleNext} disabled={!baseUrl.trim()}>
                            Next
                        </Button>
                    </div>
                </>
            }
        >
            <p className="text-neutral-600">
                LM Studio runs a local inference server exposed by default at{" "}
                <code className="font-mono text-sm">{baseUrl}</code>.
                {" "}
                <a
                    href="https://lmstudio.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-900 underline"
                >
                    Install Now
                </a>
            </p>
            <input
                placeholder="http://host.docker.internal:1234/v1"
                className="w-full border rounded p-2"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
            />
        </OnboardingContainer>
    );
}
