// src/pages/onboarding/XAIConfigPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLLMConfigStore } from "@/stores/LLMConfigStore";
import type { XAIConfig } from "@/stores/LLMConfigStore";
import { OnboardingContainer } from "@/components/OnboardingContainer";
import { Button } from "@/components/ui/button";

export default function XAIConfigPage() {
    const navigate = useNavigate();
    const { addConfig } = useLLMConfigStore();
    const [apiKey, setApiKey] = useState("");

    const testConnection = async () => {
        // TODO: call /api/llm/ping_xai
        return true;
    };

    const handleNext = async () => {
        if (await testConnection()) {
            const cfg: XAIConfig = { provider: "xai", apiKey };
            addConfig(cfg);
            navigate("/onboarding/complete");
        } else {
            alert("XAI ping failed");
        }
    };

    return (
        <OnboardingContainer title="Configure XAI">
            <input
                type="password"
                placeholder="Enter your XAI API Key"
                className="w-full border rounded p-2"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
            />
            <div className="flex justify-between">
                <Button variant="secondary" onClick={() => navigate(-1)}>
                    Back
                </Button>
                <div className="space-x-2">
                    <Button onClick={testConnection}>Test</Button>
                    <Button onClick={handleNext} disabled={!apiKey.trim()}>
                        Next
                    </Button>
                </div>
            </div>
        </OnboardingContainer>
    );
}
