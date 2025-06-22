// src/components/LLMEnhanceModal.tsx
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
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select"
import { useLLMConfigStore } from "@/stores/LLMConfigStore"
import type { ProviderType, LLMConfig } from "@/stores/LLMConfigStore"

export interface ChatMessage {
    role: "system" | "user" | "assistant"
    text: string
}

export interface GenericCompleteRequest<T> {
    provider: ProviderType
    config: LLMConfig
    messages: ChatMessage[]
    schema: Record<keyof T, "str" | "int" | "bool">
}
export type GenericCompleteResponse<T> = Partial<T>

function genericComplete<T>(
    req: GenericCompleteRequest<T>
): Promise<GenericCompleteResponse<T>> {
    return fetch("/api/commander/generic/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
    }).then((r) => {
        if (!r.ok) throw new Error(r.statusText)
        return r.json() as Promise<GenericCompleteResponse<T>>
    })
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

    const providers = useMemo(
        () =>
            (Object.keys(configs) as ProviderType[]).filter(
                (p) => configs[p] !== null
            ),
        [configs]
    )

    const [provider, setProvider] = useState<ProviderType>(
        defaultProv ?? providers[0]!
    )
    const [model, setModel] = useState(
        configs[defaultProv!]?.defaultModel ?? ""
    )
    const [prompt, setPrompt] = useState("")
    const [history, setHistory] = useState<ChatMessage[]>([])
    const [expanded, setExpanded] = useState<Record<string, boolean>>({})

    const generic = useGenericCompleteMutation<T>()

    // reset once when modal opens
    useEffect(() => {
        if (!open) return
        setProvider(defaultProv ?? providers[0]!)
        setModel(configs[defaultProv!]?.defaultModel ?? "")
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

    // sync model when provider changes
    useEffect(() => {
        setModel(configs[provider]?.defaultModel ?? "")
    }, [provider, configs])

    // append each assistant reply
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
            schema,
        })
    }

    const toggleField = (key: string) =>
        setExpanded((e) => ({ ...e, [key]: !e[key] }))

    return (
        <Dialog open={open} onOpenChange={(ok) => !ok && onClose()}>
            <DialogContent
                className="
          w-full
          sm:max-w-md
          lg:max-w-xl
          max-h-[80vh]
          overflow-auto     /* let the entire modal scroll */
          p-6
          space-y-4
        "
            >
                <header className="flex items-center justify-between">
                    <DialogTitle className="text-xl font-semibold">
                        Enhance with AI
                    </DialogTitle>
                    <DialogClose className="cursor-pointer" />
                </header>

                <div className="grid grid-cols-2 gap-3">
                    <Select
                        value={provider}
                        onValueChange={(v) => setProvider(v as ProviderType)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Provider" />
                        </SelectTrigger>
                        <SelectContent>
                            {providers.map((p) => (
                                <SelectItem key={p} value={p}>
                                    {p.toUpperCase()}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={model} onValueChange={setModel}>
                        <SelectTrigger>
                            <SelectValue placeholder="Model" />
                        </SelectTrigger>
                        <SelectContent>
                            {model && <SelectItem value={model}>{model}</SelectItem>}
                        </SelectContent>
                    </Select>
                </div>

                <label className="block text-sm font-medium">Additional instructions</label>
                <Textarea
                    className="mt-1 min-h-[6rem]"
                    placeholder="Extra prompt..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                />

                <div className="flex space-x-2">
                    <Button
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={handleGenerate}
                        disabled={!model || generic.isPending}
                    >
                        {generic.data ? "Regenerate" : "Generate"}
                    </Button>
                    {generic.data && (
                        <Button
                            className="cursor-pointer"
                            onClick={() => onAccept(generic.data as Partial<T>)}
                        >
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
