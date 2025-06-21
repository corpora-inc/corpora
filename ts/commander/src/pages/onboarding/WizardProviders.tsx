import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLLMConfigStore } from "@/stores/LLMConfigStore";
import type { ProviderType, LLMConfig } from "@/stores/LLMConfigStore";
import { Button } from "@/components/ui/button";

const steps: ProviderType[] = ["openai", "lmstudio", "xai"];

export default function WizardProviders() {
    const nav = useNavigate();
    const { configs, addConfig, setDefault } = useLLMConfigStore();
    const [index, setIndex] = useState(0);
    const provider = steps[index];
    const existing = configs[provider];

    const [form, setForm] = useState<Partial<LLMConfig>>(existing || { provider });

    // stub for now
    const testConnection = async () => true;

    const handleNext = async () => {
        if (await testConnection()) {
            addConfig(form as LLMConfig);
            setDefault(provider);
            if (index < steps.length - 1) {
                setIndex((i) => i + 1);
            } else {
                nav("/onboarding/complete");
            }
        } else {
            alert("Connection failed. Please check your settings.");
        }
    };

    return (
        <div className="p-6 max-w-md mx-auto space-y-4">
            <h2 className="text-xl font-semibold">
                Configure {provider.toUpperCase()}
            </h2>

            {provider === "openai" && (
                <input
                    type="password"
                    placeholder="OPENAI_API_KEY"
                    className="w-full border rounded p-2"
                    value={(form as any).apiKey ?? ""}
                    onChange={(e) =>
                        setForm({ provider, apiKey: e.target.value })
                    }
                />
            )}

            {provider === "lmstudio" && (
                <input
                    placeholder="LM Studio URL"
                    className="w-full border rounded p-2"
                    value={(form as any).baseUrl ?? ""}
                    onChange={(e) =>
                        setForm({ provider, baseUrl: e.target.value })
                    }
                />
            )}

            {provider === "xai" && (
                <input
                    type="password"
                    placeholder="XAI_API_KEY"
                    className="w-full border rounded p-2"
                    value={(form as any).apiKey ?? ""}
                    onChange={(e) =>
                        setForm({ provider, apiKey: e.target.value })
                    }
                />
            )}

            <div className="flex justify-between">
                <Button onClick={testConnection}>Test</Button>
                <Button onClick={handleNext} disabled={!form}>
                    {index < steps.length - 1 ? "Next" : "Finish"}
                </Button>
            </div>
        </div>
    );
}
