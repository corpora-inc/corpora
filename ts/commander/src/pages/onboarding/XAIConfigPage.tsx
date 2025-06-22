// src/pages/onboarding/XAIConfigPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLLMConfigStore } from "@/stores/LLMConfigStore";
import type { XAIConfig } from "@/stores/LLMConfigStore";
import { OnboardingContainer } from "@/components/OnboardingContainer";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function XAIConfigPage() {
    const navigate = useNavigate();
    const { configs, addConfig } = useLLMConfigStore();
    const existing = configs.xai;

    // 1) initialize from store
    const [apiKey, setApiKey] = useState(existing?.apiKey || "");
    const [validated, setValidated] = useState<boolean>(
        Boolean(existing?.apiKey)
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [responseText, setResponseText] = useState<string | null>(null);

    // 2) keep our local state in sync if user returns
    useEffect(() => {
        if (existing?.apiKey) {
            setApiKey(existing.apiKey);
            setValidated(true);
        }
    }, [existing?.apiKey]);

    // 3) test ping → completion
    const testConnection = async () => {
        setLoading(true);
        setError(null);
        setResponseText(null);

        try {
            const res = await fetch("/api/commander/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider: "xai",
                    api_key: apiKey,
                    model: "grok-3",     // your real default
                    messages: [
                        { role: "system", text: "You are a helpful assistant." },
                        { role: "user", text: "Ping" },
                    ],
                }),
            });

            if (!res.ok) {
                throw new Error((await res.text()) || "Validation failed");
            }

            const { text } = await res.json();
            setResponseText(text);
            setValidated(true);
        } catch (e: any) {
            setError(e.message);
            setValidated(false);
        } finally {
            setLoading(false);
        }
    };

    // 4) commit and move on
    const handleNext = () => {
        const cfg: XAIConfig = { provider: "xai", apiKey };
        addConfig(cfg);
        navigate("/onboarding/complete");
    };

    return (
        <OnboardingContainer
            title="Configure XAI"
            subtitle="Provide your XAI API key to enable hosted completions."
            /* passes in a skip‐URL to render your top‐right Skip button */
            skip="/onboarding/complete"
            footer={
                <>
                    <Button
                        variant="secondary"
                        onClick={() => navigate("/onboarding/openai")}
                    >
                        Back
                    </Button>
                    <div className="flex items-center space-x-2">
                        {!validated && (
                            <Button
                                onClick={testConnection}
                                disabled={loading || !apiKey.trim()}
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin h-4 w-4" />
                                ) : (
                                    "Test"
                                )}
                            </Button>
                        )}
                        {validated && (
                            <CheckCircle2 className="text-green-600 h-5 w-5" />
                        )}
                        <Button onClick={handleNext} disabled={!validated}>
                            Next <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    </div>
                </>
            }
        >
            <p className="text-neutral-600">
                Enter your XAI API key to enable text generation.
            </p>

            <Input
                type="password"
                placeholder="xai-…"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full"
            />

            {error && <p className="text-red-600">{error}</p>}

            {responseText && (
                <div className="mt-4 p-4 bg-gray-100 rounded">
                    <p className="text-sm text-neutral-800 italic">Response:</p>
                    <p className="mt-1 text-neutral-900">{responseText}</p>
                </div>
            )}
        </OnboardingContainer>
    );
}
