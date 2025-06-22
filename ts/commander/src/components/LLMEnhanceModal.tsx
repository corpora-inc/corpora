// src/components/LLMEnhanceModal.tsx
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLLMConfigStore } from "@/stores/LLMConfigStore";
import type { ProviderType, LLMConfig } from "@/stores/LLMConfigStore";

export interface ChatMessage {
    role: "system" | "user" | "assistant";
    text: string;
}

export interface GenericCompleteRequest<T> {
    provider: ProviderType;
    config: LLMConfig;
    messages: ChatMessage[];
    schema: Record<keyof T, "str" | "int" | "bool">;
}
export type GenericCompleteResponse<T> = Partial<T>;

function genericComplete<T>(
    req: GenericCompleteRequest<T>
): Promise<GenericCompleteResponse<T>> {
    return fetch("/api/commander/generic/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
    }).then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json() as Promise<GenericCompleteResponse<T>>;
    });
}

function useGenericCompleteMutation<T>() {
    const mutationFn = (req: GenericCompleteRequest<T>) =>
        genericComplete<T>(req);

    return useMutation<GenericCompleteResponse<T>, Error, GenericCompleteRequest<T>>({
        mutationFn,
    });
}

export interface LLMEnhanceModalProps<T extends Record<string, any>> {
    open: boolean;
    schema: Record<keyof T, "str" | "int" | "bool">;
    initialData: Partial<T>;
    onAccept: (suggested: Partial<T>) => void;
    onClose: () => void;
}

export function LLMEnhanceModal<T extends Record<string, any>>({
    open,
    schema,
    initialData,
    onAccept,
    onClose,
}: LLMEnhanceModalProps<T>) {
    const { configs, defaultProvider } = useLLMConfigStore();
    const [provider, setProvider] = useState<ProviderType>(
        defaultProvider ?? "openai"
    );
    const [model, setModel] = useState<string>("");

    useEffect(() => {
        const cfg = configs[provider];
        if (cfg && "defaultModel" in cfg && (cfg as any).defaultModel) {
            setModel((cfg as any).defaultModel);
        } else {
            setModel("");
        }
    }, [provider, configs]);

    const [extraPrompt, setExtraPrompt] = useState("");
    const generic = useGenericCompleteMutation<T>();

    const messages: ChatMessage[] = [
        { role: "system", text: "You are a helpful assistant." },
        {
            role: "user",
            text: `Current values: ${JSON.stringify(initialData)}`,
        },
    ];

    const handleGenerate = () => {
        generic.mutate({
            provider,
            config: configs[provider] as LLMConfig,
            messages: [
                ...messages,
                { role: "user", text: extraPrompt },
                {
                    role: "system",
                    text: `Return JSON matching keys: ${Object.keys(schema).join(
                        ", "
                    )}`,
                },
            ],
            schema,
        });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) onClose();
            }}
        >
            <DialogContent className="max-w-md w-full">
                <h2 className="text-xl font-semibold">Enhance with AI</h2>

                <div className="grid grid-cols-2 gap-4 mt-4">
                    <select
                        className="w-full border rounded p-2"
                        value={provider}
                        onChange={(e) =>
                            setProvider(e.target.value as ProviderType)
                        }
                    >
                        {Object.entries(configs).map(
                            ([p, cfg]) =>
                                cfg && (
                                    <option key={p} value={p}>
                                        {p.toUpperCase()}
                                    </option>
                                )
                        )}
                    </select>
                    <select
                        className="w-full border rounded p-2"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                    >
                        {model && <option value={model}>{model}</option>}
                    </select>
                </div>

                <textarea
                    className="w-full border rounded p-2 mt-4"
                    placeholder="Any extra instructions…"
                    value={extraPrompt}
                    onChange={(e) => setExtraPrompt(e.target.value)}
                />

                <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleGenerate} disabled={generic.isPending}>
                        {generic.isPending ? "Thinking…" : "Generate"}
                    </Button>
                </div>

                {/* ONLY render the LLM response */}
                {generic.data && (
                    <div className="mt-6 p-4 bg-gray-50 rounded">
                        <pre className="whitespace-pre-wrap text-sm">
                            {JSON.stringify(generic.data, null, 2)}
                        </pre>
                        <div className="flex justify-end space-x-2 mt-2">
                            <Button onClick={() => generic.reset()}>Retry</Button>
                            <Button
                                onClick={() => onAccept(generic.data as Partial<T>)}
                            >
                                Accept
                            </Button>
                        </div>
                    </div>
                )}

                {generic.error && (
                    <p className="text-red-600 mt-2">{generic.error.message}</p>
                )}
            </DialogContent>
        </Dialog>
    );
}
