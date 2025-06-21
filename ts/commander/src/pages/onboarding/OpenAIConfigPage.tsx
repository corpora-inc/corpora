// src/pages/onboarding/OpenAIConfigPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLLMConfigStore } from "@/stores/LLMConfigStore";
import type { OpenAIConfig } from "@/stores/LLMConfigStore";
import { OnboardingContainer } from "@/components/OnboardingContainer";
import { Button } from "@/components/ui/button";

export default function OpenAIConfigPage() {
    const navigate = useNavigate();
    const { addConfig, setDefault } = useLLMConfigStore();
    const [apiKey, setApiKey] = useState("");

    const testConnection = async () => {
        // TODO: call /api/llm/ping_openai
        return true;
    };

    const handleNext = async () => {
        if (await testConnection()) {
            const cfg: OpenAIConfig = { provider: "openai", apiKey };
            addConfig(cfg);
            setDefault("openai");
            navigate("/onboarding/lmstudio");
        } else {
            alert("OpenAI ping failed");
        }
    };

    return (
        <OnboardingContainer title="Configure OpenAI">
            <input
                type="password"
                placeholder="Enter your OPENAI_API_KEY"
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
