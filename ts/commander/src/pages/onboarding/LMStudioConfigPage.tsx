// src/pages/onboarding/LMStudioConfigPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLLMConfigStore } from "@/stores/LLMConfigStore";
import type { LMStudioConfig } from "@/stores/LLMConfigStore";
import { OnboardingContainer } from "@/components/OnboardingContainer";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
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

    const [baseUrl, setBaseUrl] = useState("http://host.docker.internal:1234/v1");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [models, setModels] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>("");

    const testConnection = async () => {
        setLoading(true);
        setError(null);
        setModels([]);

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

            // Backend returns: { models: { data: Array<{ id: string; ... }> } }
            const payload: { models: { data: Array<{ id: string }> } } = await res.json();
            const ids = payload.models.data.map((m) => m.id);
            if (ids.length === 0) {
                throw new Error("No models found at that endpoint");
            }

            setModels(ids);
            setSelectedModel(ids[0]);
            return true;
        } catch (e: any) {
            setError(e.message || "Connection failed");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleNext = async () => {
        if (!(await testConnection())) return;
        const cfg: LMStudioConfig = {
            provider: "lmstudio",
            baseUrl,
            defaultModel: selectedModel, // ensure your store type is updated accordingly
        };
        addConfig(cfg);
        navigate("/onboarding/openai");
    };

    return (
        <OnboardingContainer
            title="Configure LM Studio"
            footer={
                <>
                    <Button variant="secondary" onClick={() => navigate("/onboarding")}>
                        Back
                    </Button>
                    <div className="flex items-center space-x-2">
                        <Button onClick={testConnection} disabled={loading}>
                            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Test"}
                        </Button>
                        <Button
                            onClick={handleNext}
                            disabled={!baseUrl.trim() || !selectedModel}
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
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
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
