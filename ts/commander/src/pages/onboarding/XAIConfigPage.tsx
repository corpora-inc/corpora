// src/pages/onboarding/XAIConfigPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLLMConfigStore } from "@/stores/LLMConfigStore";
import type { XAIConfig } from "@/stores/LLMConfigStore";
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

export default function XAIConfigPage() {
    const navigate = useNavigate();
    const {
        configs,
        addConfig,
        availableModels,
        setAvailableModels,
    } = useLLMConfigStore();
    const existing = configs.xai;

    // 1) build initial model list: persisted list or last default
    const initialModels =
        availableModels.xai.length > 0
            ? availableModels.xai
            : existing?.defaultModel
                ? [existing.defaultModel]
                : [];

    // 2) component state
    const [apiKey, setApiKey] = useState(existing?.apiKey || "");
    const [models, setModels] = useState<string[]>(initialModels);
    const [selectedModel, setSelectedModel] = useState(
        existing?.defaultModel || ""
    );
    const [validated, setValidated] = useState<boolean>(
        Boolean(existing?.defaultModel)
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ping, setPing] = useState<string | null>(null);

    // 3) whenever we truly discover a list, persist it
    useEffect(() => {
        if (
            models.length > 1 ||
            (existing?.defaultModel && models[0] !== existing.defaultModel)
        ) {
            setAvailableModels("xai", models);
        }
    }, [models, existing?.defaultModel, setAvailableModels]);

    // 4) re-validate flag whenever selection changes
    useEffect(() => {
        setValidated(selectedModel === existing?.defaultModel);
    }, [selectedModel, existing?.defaultModel]);

    // 5) discover available XAI models
    const discoverModels = async () => {
        setLoading(true);
        setError(null);
        setPing(null);
        try {
            const res = await fetch("/api/commander/xai/models", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ api_key: apiKey }),
            });
            if (!res.ok) {
                throw new Error((await res.text()) || "Fetch models failed");
            }
            const { models: list }: { models: string[] } = await res.json();
            if (!list.length) throw new Error("No models returned");
            setModels(list);
            setSelectedModel(list[0]);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    };

    // 6) validate selected model via completion endpoint
    const validateModel = async () => {
        setLoading(true);
        setError(null);
        setPing(null);
        try {
            const res = await fetch("/api/commander/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider: "xai",
                    api_key: apiKey,
                    model: selectedModel,
                    messages: [
                        { role: "system", text: "You are a helpful assistant." },
                        { role: "user", text: "Ping" },
                    ],
                }),
            });
            if (!res.ok) throw new Error((await res.text()) || "Validation failed");
            const { text } = await res.json();
            setPing(text);
            setValidated(true);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    };

    // 7) commit config and advance
    const handleNext = () => {
        const cfg: XAIConfig = {
            provider: "xai",
            apiKey,
            defaultModel: selectedModel,
        };
        addConfig(cfg);
        navigate("/onboarding/claude");
    };

    return (
        <OnboardingContainer
            title="Configure XAI"
            subtitle="Provide your XAI API key and choose a default model."
            skip="/onboarding/claude"
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
                                onClick={models.length ? validateModel : discoverModels}
                                disabled={loading || !apiKey.trim()}
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin h-4 w-4" />
                                ) : models.length ? (
                                    "Validate model"
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
                Enter your XAI API key and pick your default Grok model.
            </p>
            <Input
                type="password"
                placeholder="xai-…"
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
