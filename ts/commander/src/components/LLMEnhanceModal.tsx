// src/components/LLMEnhanceModal.tsx
import { useState, useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
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
    return useMutation<GenericCompleteResponse<T>, Error, GenericCompleteRequest<T>>({
        mutationFn: genericComplete,
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
    const configs = useLLMConfigStore((s) => s.configs);
    const defaultProv = useLLMConfigStore((s) => s.defaultProvider);

    const availableProviders = useMemo(
        () =>
            Object.entries(configs)
                .filter(([, cfg]) => cfg)
                .map(([p]) => p as ProviderType),
        [configs]
    );

    const [provider, _setProvider] = useState<ProviderType>(
        defaultProv ?? availableProviders[0]!
    );
    const setProvider = (v: string) => _setProvider(v as ProviderType);

    const [model, setModel] = useState<string>(
        configs[provider]?.defaultModel ?? ""
    );
    useEffect(() => {
        setModel(configs[provider]?.defaultModel ?? "");
    }, [provider, configs]);

    const [extraPrompt, setExtraPrompt] = useState("");
    const generic = useGenericCompleteMutation<T>();

    const baseMessages = useMemo<ChatMessage[]>(
        () => [
            { role: "system", text: "You are a helpful assistant." },
            { role: "user", text: `Current values: ${JSON.stringify(initialData)}` },
        ],
        [initialData]
    );

    const handleGenerate = () => {
        generic.mutate({
            provider,
            config: configs[provider] as LLMConfig,
            messages: [
                ...baseMessages,
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
        <Dialog open={open} onOpenChange={(ok) => ok || onClose()}>
            <DialogContent
                className="
          w-full
          sm:max-w-md
          lg:max-w-xl
          max-h-[80vh]
          flex flex-col overflow-hidden
        "
            >
                <header className="flex items-center justify-between mb-4">
                    <DialogTitle className="text-xl font-semibold">
                        Enhance with AI
                    </DialogTitle>
                    <DialogClose className="text-gray-500 hover:text-gray-700" />
                </header>

                <div className="grid grid-cols-2 gap-3">
                    <Select value={provider} onValueChange={setProvider}>
                        <SelectTrigger>
                            <SelectValue placeholder="Provider" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableProviders.map((p) => (
                                <SelectItem key={p} value={p}>
                                    {p.toUpperCase()}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={model} onValueChange={setModel} disabled={!model}>
                        <SelectTrigger>
                            <SelectValue placeholder="Model" />
                        </SelectTrigger>
                        <SelectContent>
                            {model && <SelectItem value={model}>{model}</SelectItem>}
                        </SelectContent>
                    </Select>
                </div>

                <label className="block text-sm font-medium mt-4">
                    Additional instructions
                </label>
                <Textarea
                    className="mt-1 flex-1 min-h-[6rem]"
                    placeholder="Extra prompt..."
                    value={extraPrompt}
                    onChange={(e) => setExtraPrompt(e.target.value)}
                />

                <div className="mt-4 flex space-x-2">
                    <Button
                        variant="secondary"
                        onClick={handleGenerate}
                        disabled={!model || generic.isPending}
                    >
                        {generic.isPending ? "Thinking…" : "Generate"}
                    </Button>
                    {generic.data && (
                        <Button variant="outline" onClick={handleGenerate}>
                            Retry
                        </Button>
                    )}
                    {generic.data && (
                        <Button onClick={() => onAccept(generic.data as Partial<T>)}>
                            Accept
                        </Button>
                    )}
                </div>

                {generic.isError && (
                    <p className="text-red-600 mt-3">{generic.error!.message}</p>
                )}

                {generic.data && (
                    <div className="mt-4 overflow-auto max-h-40 border rounded p-3 bg-gray-50">
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                            {Object.entries(generic.data).map(([k, v]) => (
                                <div key={k}>
                                    <dt className="font-medium">{k}</dt>
                                    <dd className="break-words">{String(v)}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
