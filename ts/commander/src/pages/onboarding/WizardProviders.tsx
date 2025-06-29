import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLLMConfigStore } from "@/stores/LLMConfigStore";
import type { ProviderType, LLMConfig } from "@/stores/LLMConfigStore";
import { Button } from "@/components/ui/button";
import { OnboardingContainer } from "@/components/OnboardingContainer";

const steps: ProviderType[] = ["openai", "lmstudio", "xai"];

export default function WizardProviders() {
    const navigate = useNavigate();
    const { configs, addConfig, setDefault } = useLLMConfigStore();
    const [index, setIndex] = useState(0);
    const provider = steps[index];
    const existing = configs[provider];
    const [form, setForm] = useState<Partial<LLMConfig>>(existing || { provider });

    const testConnection = async () => true; // stub

    const handleNext = async () => {
        if (await testConnection()) {
            addConfig(form as LLMConfig);
            setDefault(provider);
            if (index < steps.length - 1) {
                setIndex((i) => i + 1);
            } else {
                navigate("/onboarding/complete");
            }
        } else {
            alert("Connection failed. Please check your settings.");
        }
    };

    return (
        <OnboardingContainer
            title={`Configure ${provider.toUpperCase()}`}
            subtitle={`Enter your ${provider} credentials or endpoint.`}
        >
            {provider === "openai" && (
                <input
                    type="password"
                    placeholder="OPENAI_API_KEY"
                    className="w-full border rounded p-2"
                    value={(form as any).apiKey ?? ""}
                    onChange={(e) => setForm({ provider, apiKey: e.target.value })}
                />
            )}
            {provider === "lmstudio" && (
                <input
                    placeholder="LM Studio URL"
                    className="w-full border rounded p-2"
                    value={(form as any).baseUrl ?? ""}
                    onChange={(e) => setForm({ provider, baseUrl: e.target.value })}
                />
            )}
            {provider === "xai" && (
                <input
                    type="password"
                    placeholder="XAI_API_KEY"
                    className="w-full border rounded p-2"
                    value={(form as any).apiKey ?? ""}
                    onChange={(e) => setForm({ provider, apiKey: e.target.value })}
                />
            )}
            <div className="flex justify-between">
                <Button onClick={testConnection}>Test</Button>
                <Button onClick={handleNext} disabled={!form}>
                    {index < steps.length - 1 ? "Next" : "Finish"}
                </Button>
            </div>
        </OnboardingContainer>
    );
}
