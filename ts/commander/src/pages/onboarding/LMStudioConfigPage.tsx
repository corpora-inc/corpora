// src/pages/onboarding/LMStudioConfigPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLLMConfigStore } from "@/stores/LLMConfigStore";
import type { LMStudioConfig } from "@/stores/LLMConfigStore";
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

const DEFAULT_URL = "http://host.docker.internal:1234/v1";

export default function LMStudioConfigPage() {
    const navigate = useNavigate();
    const {
        configs,
        addConfig,
        availableModels,
        setAvailableModels,
    } = useLLMConfigStore();
    const existing = configs.lmstudio;

    // 1) Build initial models list:
    //    - if we have a persisted full list, use that
    //    - else if we only have a stored defaultModel, show just that one
    const initialModels = availableModels.lmstudio.length
        ? availableModels.lmstudio
        : existing?.defaultModel
            ? [existing.defaultModel]
            : [];

    const [baseUrl, setBaseUrl] = useState(existing?.baseUrl || DEFAULT_URL);
    const [models, setModels] = useState<string[]>(initialModels);
    const [selectedModel, setSelectedModel] = useState(
        existing?.defaultModel || ""
    );
    const [validated, setValidated] = useState<boolean>(
        Boolean(existing?.defaultModel)
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 2) Persist any time we really discover a new list
    useEffect(() => {
        if (models.length > 1 || (existing?.defaultModel && models[0] !== existing.defaultModel)) {
            setAvailableModels("lmstudio", models);
        }
    }, [models, existing?.defaultModel, setAvailableModels]);

    // 3) Reset validation if you choose a different model
    useEffect(() => {
        if (existing?.defaultModel === selectedModel) {
            setValidated(true);
        } else {
            setValidated(false);
        }
    }, [selectedModel, existing?.defaultModel]);

    // Phase 1: discover all models
    const discoverModels = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/commander/lmstudio/models", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ base_url: baseUrl }),
            });
            if (!res.ok) throw new Error(await res.text() || "Discovery failed");
            const payload: { models: { data: Array<{ id: string }> } } =
                await res.json();

            const ids = payload.models.data.map((m) => m.id);
            if (!ids.length) throw new Error("No models found");
            setModels(ids);
            setSelectedModel(ids[0]);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    // Phase 2: validate your chosen model end-to-end
    const validateModel = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/commander/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider: "local",
                    base_url: baseUrl,
                    model: selectedModel,
                    messages: [
                        { role: "system", text: "You are a helpful assistant." },
                        { role: "user", text: "Hello, world!" },
                    ],
                }),
            });
            if (!res.ok) throw new Error(await res.text() || "Validation failed");
            setValidated(true);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    // Commit & move on
    const handleNext = () => {
        const cfg: LMStudioConfig = {
            provider: "lmstudio",
            baseUrl,
            defaultModel: selectedModel,
        };
        addConfig(cfg);
        navigate("/onboarding/openai");
    };

    return (
        <OnboardingContainer
            title="Configure LM Studio"
            skip="/onboarding/openai"
            // subtitle="Connect to your local LM Studio server for on-device LLMs."
            footer={
                <>
                    <Button variant="secondary" onClick={() => navigate("/onboarding")}>
                        Back
                    </Button>
                    <div className="flex items-center space-x-2">
                        {!validated && (
                            <Button
                                onClick={models.length === 0 ? discoverModels : validateModel}
                                disabled={
                                    loading ||
                                    !baseUrl.trim() ||
                                    (models.length > 0 && !selectedModel)
                                }
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin h-4 w-4" />
                                ) : models.length === 0 ? (
                                    "Discover models"
                                ) : (
                                    "Validate model"
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
                LM Studio runs a local inference server exposed at{" "}
                <code className="font-mono text-sm">{baseUrl}</code>.{" "}
                <a
                    href="https://lmstudio.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-900 underline"
                >
                    Install now
                </a>
            </p>

            <Input
                type="url"
                placeholder={DEFAULT_URL}
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full"
            />

            {error && <p className="text-red-600">{error}</p>}

            {/* ALWAYS render the Select once there’s at least one model */}
            {models.length > 0 && (
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-neutral-700">
                        Select default model
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
        </OnboardingContainer>
    );
}
