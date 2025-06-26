// ts/commander/src/components/LLMEnhanceModal.tsx

import { useState, useEffect, useMemo } from "react"
import { useMutation } from "@tanstack/react-query"
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import {
    useLLMConfigStore,
    type ProviderType,
    type LLMConfig,
} from "@/stores/LLMConfigStore"
import { LLMModelSelector } from "./LLMModelSelector"

export interface ChatMessage {
    role: "system" | "user" | "assistant"
    text: string
}

export interface GenericCompleteRequest<T> {
    provider: ProviderType
    config: LLMConfig
    messages: ChatMessage[]
    fields_schema: Record<keyof T, "str" | "int" | "bool">
}
export type GenericCompleteResponse<T> = Partial<T>

async function genericComplete<T>(
    req: GenericCompleteRequest<T>
): Promise<GenericCompleteResponse<T>> {
    const res = await fetch("/api/commander/generic/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
    })
    if (!res.ok) throw new Error(res.statusText)
    return (await res.json()) as GenericCompleteResponse<T>
}

function useGenericCompleteMutation<T>() {
    return useMutation<GenericCompleteResponse<T>, Error, GenericCompleteRequest<T>>({
        mutationFn: genericComplete,
    })
}

export interface LLMEnhanceModalProps<T extends Record<string, any>> {
    open: boolean
    schema: Record<keyof T, "str" | "int" | "bool">
    initialData: Partial<T>
    onAccept: (suggested: Partial<T>) => void
    onClose: () => void
    /** Optional extra prompt context to include before the user message */
    extraContext?: string
}

export function LLMEnhanceModal<T extends Record<string, any>>({
    open,
    schema,
    initialData,
    onAccept,
    onClose,
    extraContext,
}: LLMEnhanceModalProps<T>) {
    const configs = useLLMConfigStore((s) => s.configs)
    const defaultProv = useLLMConfigStore((s) => s.defaultProvider)
    const availableModels = useLLMConfigStore((s) => s.availableModels)
    const setDefault = useLLMConfigStore((s) => s.setDefault)
    const setDefaultModel = useLLMConfigStore((s) => s.setDefaultModel)

    const providers = useMemo<ProviderType[]>(
        () => (Object.keys(configs) as ProviderType[]).filter((p) => configs[p] !== null),
        [configs]
    )

    const [provider, _setProvider] = useState<ProviderType>(defaultProv ?? providers[0]!)
    const [model, _setModel] = useState<string>("")
    const [prompt, setPrompt] = useState<string>("")
    const [history, setHistory] = useState<ChatMessage[]>([])
    const [expanded, setExpanded] = useState<Record<string, boolean>>({})

    const generic = useGenericCompleteMutation<T>()

    // Static system messages: only once per open
    const systemMessages = useMemo<ChatMessage[]>(() => {
        const msgs: ChatMessage[] = [
            { role: "system", text: "You are a helpful assistant." },
        ]
        if (extraContext) {
            msgs.push({ role: "system", text: extraContext })
        }
        msgs.push({
            role: "system",
            text: `When asked, return only a JSON object with keys: ${Object.keys(schema).join(
                ", "
            )
                }. Do not include any extra text.`,
        })
        return msgs
    }, [extraContext, schema])

    // Handlers for provider/model
    const onProviderChange = (prov: ProviderType) => {
        _setProvider(prov)
        setDefault(prov)
        const mdl = configs[prov]?.defaultModel
        _setModel(typeof mdl === "string" ? mdl : availableModels[prov]?.[0] ?? "")
    }
    const onModelChange = (m: string) => {
        _setModel(m)
        setDefaultModel(provider, m)
    }

    // Reset when opened
    useEffect(() => {
        if (!open) return
        onProviderChange(defaultProv ?? providers[0]!)
        setPrompt("")
        setHistory([
            {
                role: "user",
                text: `Current values: ${JSON.stringify(initialData)} `,
            },
        ])
        generic.reset()
        setExpanded({})
    }, [open])

    // Append assistant responses
    useEffect(() => {
        if (!generic.data) return
        setHistory((h) => [
            ...h,
            { role: "assistant", text: JSON.stringify(generic.data) },
        ])
    }, [generic.data])

    // Generate call
    const handleGenerate = () => {
        generic.mutate({
            provider,
            config: configs[provider] as LLMConfig,
            messages: [...systemMessages, ...history, { role: "user", text: prompt }],
            fields_schema: schema,
        })
    }

    const toggleField = (key: string) =>
        setExpanded((e) => ({ ...e, [key]: !e[key] }))

    return (
        <Dialog open={open} onOpenChange={(ok) => !ok && onClose()}>
            <DialogContent className="w-full sm:max-w-md lg:max-w-xl max-h-[80vh] overflow-hidden p-6">
                <div className="relative">
                    {generic.isPending && (
                        <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
                            <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
                        </div>
                    )}

                    <header className="flex items-center justify-between mb-4">
                        <DialogTitle className="text-xl font-semibold">Mutate with AI</DialogTitle>
                        <DialogClose className="cursor-pointer" />
                    </header>

                    <LLMModelSelector
                        provider={provider}
                        model={model}
                        onProviderChange={onProviderChange}
                        onModelChange={onModelChange}
                    />

                    <Textarea
                        className="min-h-[6rem] mt-4"
                        placeholder="Extra prompt..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={generic.isPending}
                    />

                    <div className="flex space-x-2 mt-4">
                        <Button
                            variant="secondary"
                            onClick={handleGenerate}
                            disabled={!model || generic.isPending}
                        >
                            {generic.data ? "Regenerate" : "Generate"}
                        </Button>
                        {generic.data && (
                            <Button onClick={() => onAccept(generic.data as Partial<T>)} disabled={generic.isPending}>
                                Accept
                            </Button>
                        )}
                    </div>

                    {generic.isError && <p className="text-red-600 mt-2">{generic.error!.message}</p>}

                    {generic.data && (
                        <div className="border rounded bg-gray-50 p-4 space-y-3 mt-4 overflow-auto max-h-48">
                            {Object.entries(generic.data).map(([key, val]) => {
                                const str = String(val)
                                const isLong = str.length > 100
                                const isOpen = !!expanded[key]
                                const preview = isOpen ? str : str.slice(0, 100) + (isLong ? "…" : "")
                                return (
                                    <div key={key} onClick={() => isLong && toggleField(key)}>
                                        <div className="font-medium">{key}</div>
                                        <div className="text-sm break-words">{preview}</div>
                                        {isLong && (
                                            <div className="text-xs text-blue-500 cursor-pointer">
                                                {isOpen ? "Show less" : "Show more"}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
