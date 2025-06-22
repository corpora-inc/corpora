// src/pages/onboarding/LMStudioConfigPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLLMConfigStore } from "@/stores/LLMConfigStore";
import type { LMStudioConfig } from "@/stores/LLMConfigStore";
import { OnboardingContainer } from "@/components/OnboardingContainer";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

export default function LMStudioConfigPage() {
    const navigate = useNavigate();
    const { addConfig } = useLLMConfigStore();

    const [baseUrl, setBaseUrl] = useState(
        "http://host.docker.internal:1234/v1"
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [models, setModels] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>("");
    const [validated, setValidated] = useState(false);

    // Phase 1: discover available models
    const discoverModels = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/commander/lmstudio/models", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ base_url: baseUrl }),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Unknown error");
            }
            const payload: { models: { data: Array<{ id: string }> } } =
                await res.json();
            const ids = payload.models.data.map((m) => m.id);
            if (ids.length === 0) throw new Error("No models found");
            setModels(ids);
            setSelectedModel(ids[0]);
        } catch (e: any) {
            setError(e.message || "Discovery failed");
        } finally {
            setLoading(false);
        }
    };

    // Phase 2: validate the selected model
    const validateModel = async () => {
        setLoading(true);
        setError(null);
        try {
            let res = await fetch("/api/commander/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider: "local",
                    model: selectedModel,
                    base_url: baseUrl,
                    messages: [
                        { role: "system", text: "You are a helpful assistant." },
                        { role: "user", text: "Hello world" },
                    ],
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Validation failed");
            }
            setValidated(true);
        } catch (e: any) {
            setError(e.message || "Validation failed");
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        const cfg: LMStudioConfig = {
            provider: "lmstudio",
            baseUrl,
            defaultModel: selectedModel,
        };
        addConfig(cfg);
        navigate("/onboarding/openai");
    };

    // Determine the Test button label and action
    const isDiscoveryPhase = models.length === 0;
    const testLabel = loading
        ? ""
        : isDiscoveryPhase
            ? "Discover models"
            : validated
                ? ""
                : "Validate model";

    return (
        <OnboardingContainer
            title="Configure LM Studio"
            footer={
                <>
                    <Button variant="secondary" onClick={() => navigate("/onboarding")}>
                        Back
                    </Button>

                    <div className="flex items-center space-x-2">
                        {!validated && (
                            <Button
                                onClick={isDiscoveryPhase ? discoverModels : validateModel}
                                disabled={loading || !baseUrl.trim() || (!isDiscoveryPhase && !selectedModel)}
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin h-4 w-4" />
                                ) : (
                                    testLabel
                                )}
                            </Button>
                        )}
                        {validated && (
                            <CheckCircle2 className="text-green-600 h-5 w-5" />
                        )}
                        <Button
                            onClick={handleNext}
                            disabled={!validated}
                        >
                            Next
                        </Button>
                    </div>
                </>
            }
        >
            <p className="text-neutral-600">
                LM Studio runs a local inference server exposed by default at{" "}
                <code className="font-mono text-sm">{baseUrl}</code>.{" "}
                <a
                    href="https://lmstudio.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-900 underline"
                >
                    Install Now
                </a>
            </p>

            <Input
                type="url"
                placeholder="http://host.docker.internal:1234/v1"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full"
            />

            {error && <p className="text-red-600">{error}</p>}

            {models.length > 0 && (
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-neutral-700">
                        Select default model
                    </label>
                    <Select
                        value={selectedModel}
                        onValueChange={setSelectedModel}
                        disabled={loading || validated}
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
