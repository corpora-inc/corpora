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
    const [baseUrl, setBaseUrl] = useState("");

    const testConnection = async () => {
        // TODO: call /api/llm/ping_lmstudio
        return true;
    };

    const handleNext = async () => {
        if (await testConnection()) {
            const cfg: LMStudioConfig = { provider: "lmstudio", baseUrl };
            addConfig(cfg);
            navigate("/onboarding/xai");
        } else {
            alert("LM Studio ping failed");
        }
    };

    return (
        <OnboardingContainer title="Configure LM Studio">
            <input
                placeholder="http://host.docker.internal:1234/v1"
                className="w-full border rounded p-2"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
            />
            <div className="flex justify-between">
                <Button variant="secondary" onClick={() => navigate(-1)}>
                    Back
                </Button>
                <div className="space-x-2">
                    <Button onClick={testConnection}>Test</Button>
                    <Button onClick={handleNext} disabled={!baseUrl.trim()}>
                        Next
                    </Button>
                </div>
            </div>
        </OnboardingContainer>
    );
}
