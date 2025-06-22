// src/pages/onboarding/OpenAIConfigPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLLMConfigStore } from "@/stores/LLMConfigStore";
import type { OpenAIConfig } from "@/stores/LLMConfigStore";
import { OnboardingContainer } from "@/components/OnboardingContainer";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

const DEFAULT_MODEL = "gpt-3.5-turbo";

export default function OpenAIConfigPage() {
    const navigate = useNavigate();
    const {
        configs,
        addConfig,
        availableModels,
        setAvailableModels,
    } = useLLMConfigStore();

    const existing = configs.openai;

    // 1) build initial list: either full list or just your stored default
    const initialModels =
        availableModels.openai.length > 0
            ? availableModels.openai
            : existing?.defaultModel
                ? [existing.defaultModel]
                : [];

    const [apiKey, setApiKey] = useState(existing?.apiKey || "");
    const [models, setModels] = useState<string[]>(initialModels);
    const [selectedModel, setSelectedModel] = useState(
        existing?.defaultModel || DEFAULT_MODEL
    );
    const [validated, setValidated] = useState<boolean>(
        Boolean(existing?.defaultModel)
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ping, setPing] = useState<string | null>(null);

    // 2) persist list whenever it changes for real discovery
    useEffect(() => {
        if (
            models.length > 1 ||
            (existing?.defaultModel && models[0] !== existing.defaultModel)
        ) {
            setAvailableModels("openai", models);
        }
    }, [models, existing?.defaultModel, setAvailableModels]);

    // 3) if you pick a new model, clear your validation
    useEffect(() => {
        setValidated(selectedModel === existing?.defaultModel);
    }, [selectedModel, existing?.defaultModel]);

    // 4) fetch model list
    const discoverModels = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/commander/openai/models", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ api_key: apiKey }),
            });
            if (!res.ok) throw new Error(await res.text() || "Fetch failed");
            const { models: list }: { models: string[] } = await res.json();
            if (!list.length) throw new Error("No models returned");
            setModels(list);
            setSelectedModel(list[0]);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    // 5) quick “ping” through your /complete endpoint
    const validate = async () => {
        setLoading(true);
        setError(null);
        setPing(null);
        try {
            const res = await fetch("/api/commander/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider: "openai",
                    api_key: apiKey,
                    model: selectedModel,
                    messages: [
                        { role: "system", text: "You are a helpful assistant." },
                        { role: "user", text: "Ping" },
                    ],
                }),
            });
            if (!res.ok) throw new Error(await res.text() || "Validation failed");
            const { text } = await res.json();
            setPing(text);
            setValidated(true);
        } catch (e: any) {
            setError(e.message);
            setValidated(false);
        } finally {
            setLoading(false);
        }
    };

    // 6) save and go
    const handleNext = () => {
        const cfg: OpenAIConfig = {
            provider: "openai",
            apiKey,
            defaultModel: selectedModel,
        };
        addConfig(cfg);
        navigate("/onboarding/xai");
    };

    return (
        <OnboardingContainer
            title="Configure OpenAI"
            subtitle="Plug in your OpenAI key and pick a default model."
            skip="/onboarding/xai"
            footer={
                <>
                    <Button
                        variant="secondary"
                        onClick={() => navigate("/onboarding/lmstudio")}
                    >
                        Back
                    </Button>
                    <div className="flex items-center space-x-2">
                        {!validated && (
                            <Button
                                onClick={models.length ? validate : discoverModels}
                                disabled={loading || !apiKey.trim()}
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin h-4 w-4" />
                                ) : models.length ? (
                                    "Validate"
                                ) : (
                                    "Fetch models"
                                )}
                            </Button>
                        )}
                        {validated && <CheckCircle2 className="text-green-600 h-5 w-5" />}
                        <Button onClick={handleNext} disabled={!validated}>
                            Next <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    </div>
                </>
            }
        >
            <p className="text-neutral-600">
                Your default model is used for all completions unless overridden.
            </p>

            <Input
                type="password"
                placeholder="sk-…"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full"
            />

            {error && <p className="text-red-600">{error}</p>}

            {models.length > 0 && (
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-neutral-700">
                        Default model
                    </label>
                    <Select
                        value={selectedModel}
                        onValueChange={setSelectedModel}
                        disabled={loading}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose a model…" />
                        </SelectTrigger>
                        <SelectContent>
                            {models.map((m) => (
                                <SelectItem key={m} value={m}>
                                    {m}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {ping && (
                <div className="mt-4 p-4 bg-gray-100 rounded">
                    <p className="text-sm italic text-neutral-700">Ping result:</p>
                    <p className="mt-1">{ping}</p>
                </div>
            )}
        </OnboardingContainer>
    );
}
