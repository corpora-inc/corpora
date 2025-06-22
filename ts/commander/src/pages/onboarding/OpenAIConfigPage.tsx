// src/pages/onboarding/OpenAIConfigPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLLMConfigStore } from "@/stores/LLMConfigStore";
import type { OpenAIConfig } from "@/stores/LLMConfigStore";
import { OnboardingContainer } from "@/components/OnboardingContainer";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";

// Change this to whatever default you prefer
const DEFAULT_OPENAI_MODEL = "gpt-3.5-turbo";

export default function OpenAIConfigPage() {
    const navigate = useNavigate();
    const { addConfig, setDefault } = useLLMConfigStore();

    const [apiKey, setApiKey] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [responseText, setResponseText] = useState<string | null>(null);
    const [validated, setValidated] = useState(false);

    const testConnection = async () => {
        setLoading(true);
        setError(null);
        setResponseText(null);

        try {
            const res = await fetch("/api/commander/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider: "openai",
                    api_key: apiKey,
                    model: DEFAULT_OPENAI_MODEL,
                    messages: [
                        { role: "system", text: "You are a helpful assistant." },
                        { role: "user", text: "Ping" },
                    ],
                }),
            });

            if (!res.ok) {
                const err = await res.text();
                throw new Error(err || "Unknown error");
            }

            const data: { text: string } = await res.json();
            setResponseText(data.text);
            setValidated(true);
        } catch (e: any) {
            setError(e.message || "Validation failed");
            setValidated(false);
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        const cfg: OpenAIConfig = { provider: "openai", apiKey };
        addConfig(cfg);
        setDefault("openai");
        navigate("/onboarding/xai");
    };

    return (
        <OnboardingContainer
            title="Configure OpenAI"
            footer={
                <>
                    <Button variant="secondary" onClick={() => navigate("/onboarding")}>
                        Back
                    </Button>
                    <div className="flex items-center space-x-2">
                        {!validated && (
                            <Button onClick={testConnection} disabled={loading || !apiKey.trim()}>
                                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Test"}
                            </Button>
                        )}
                        {validated && <CheckCircle2 className="text-green-600 h-5 w-5" />}
                        <Button onClick={handleNext} disabled={!validated}>
                            Next
                        </Button>
                    </div>
                </>
            }
        >
            <p className="text-neutral-600">
                Enter your OpenAI API key below to enable OpenAI.
            </p>
            <Input
                type="password"
                placeholder="sk-…"
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
