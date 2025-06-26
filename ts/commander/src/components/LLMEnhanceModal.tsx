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
import { useLLMConfigStore, type ProviderType, type LLMConfig } from "@/stores/LLMConfigStore"
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
}

export function LLMEnhanceModal<T extends Record<string, any>>({
    open,
    schema,
    initialData,
    onAccept,
    onClose,
}: LLMEnhanceModalProps<T>) {
    const configs = useLLMConfigStore((s) => s.configs)
    const defaultProv = useLLMConfigStore((s) => s.defaultProvider)
    const availableModels = useLLMConfigStore((s) => s.availableModels)
    const setDefault = useLLMConfigStore((s) => s.setDefault)
    const setDefaultModel = useLLMConfigStore((s) => s.setDefaultModel)

    const providers = useMemo(
        () =>
            (Object.keys(configs) as ProviderType[]).filter((p) => configs[p] !== null),
        [configs]
    )

    const [provider, _setProvider] = useState<ProviderType>(
        defaultProv ?? providers[0]!
    )
    const [model, _setModel] = useState<string>("")
    const [prompt, setPrompt] = useState("")
    const [history, setHistory] = useState<ChatMessage[]>([])
    const [expanded, setExpanded] = useState<Record<string, boolean>>({})

    const generic = useGenericCompleteMutation<T>()

    // when user picks a model we also persist it
    const onProviderChange = (prov: ProviderType) => {
        _setProvider(prov)
        setDefault(prov)
        const mdl = configs[prov]?.defaultModel
        _setModel(
            typeof mdl === "string" ? mdl : availableModels[prov]?.[0] ?? ""
        )
    }
    const onModelChange = (m: string) => {
        _setModel(m)
        setDefaultModel(provider, m)
    }

    // reset when opened
    useEffect(() => {
        if (!open) return
        const startProv = defaultProv ?? providers[0]!
        onProviderChange(startProv)

        setPrompt("")
        setHistory([
            { role: "system", text: "You are a helpful assistant." },
            {
                role: "user",
                text: `Current values: ${JSON.stringify(initialData)}`,
            },
        ])
        generic.reset()
        setExpanded({})
    }, [open])

    // append to history on each AI response
    useEffect(() => {
        if (generic.data) {
            setHistory((h) => [
                ...h,
                { role: "assistant", text: JSON.stringify(generic.data) },
            ])
        }
    }, [generic.data])

    const handleGenerate = () => {
        generic.mutate({
            provider,
            config: configs[provider] as LLMConfig,
            messages: [
                ...history,
                { role: "user", text: prompt },
                {
                    role: "system",
                    text: `Return JSON matching keys: ${Object.keys(schema).join(
                        ", "
                    )}`,
                },
            ],
            fields_schema: schema,
        })
    }

    const toggleField = (key: string) =>
        setExpanded((e) => ({ ...e, [key]: !e[key] }))

    return (
        <Dialog open={open} onOpenChange={(ok) => !ok && onClose()}>
            <DialogContent className="w-full sm:max-w-md lg:max-w-xl max-h-[80vh] overflow-auto p-6 space-y-4">
                <header className="flex items-center justify-between">
                    <DialogTitle className="text-xl font-semibold">
                        Mutate with AI
                    </DialogTitle>
                    <DialogClose className="cursor-pointer" />
                </header>

                {/* provider/model selector */}
                <LLMModelSelector
                    provider={provider}
                    model={model}
                    onProviderChange={onProviderChange}
                    onModelChange={onModelChange}
                />

                {/* custom prompt */}
                <Textarea
                    className="min-h-[6rem]"
                    placeholder="Extra prompt..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                />

                <div className="flex space-x-2">
                    <Button
                        variant="secondary"
                        onClick={handleGenerate}
                        disabled={!model || generic.isPending}
                    >
                        {generic.data ? "Regenerate" : "Generate"}
                    </Button>
                    {generic.data && (
                        <Button onClick={() => onAccept(generic.data as Partial<T>)}>
                            Accept
                        </Button>
                    )}
                </div>

                {generic.isError && (
                    <p className="text-red-600">{generic.error!.message}</p>
                )}

                {generic.data && (
                    <div className="border rounded bg-gray-50 p-4 space-y-3">
                        {Object.entries(generic.data).map(([key, val]) => {
                            const str = String(val)
                            const isLong = str.length > 100
                            const isOpen = !!expanded[key]
                            const preview = isOpen ? str : str.slice(0, 100) + (isLong ? "…" : "")
                            return (
                                <div
                                    key={key}
                                    className="cursor-pointer"
                                    onClick={() => isLong && toggleField(key)}
                                >
                                    <div className="font-medium">{key}</div>
                                    <div className="text-sm break-words">{preview}</div>
                                    {isLong && (
                                        <div className="text-xs text-blue-500">
                                            {isOpen ? "Show less" : "Show more"}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
