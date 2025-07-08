// ts/commander/src/components/LLMEnhanceModal.tsx
import { useState, useEffect, useMemo, memo } from "react"
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

// memoized suggestions panel
const Suggestions = memo(function Suggestions({
    data,
    expanded,
    toggleField,
}: {
    data: Record<string, any>
    expanded: Record<string, boolean>
    toggleField: (key: string) => void
}) {
    return (
        <div className="border border-gray-200 rounded-md bg-gradient-to-br from-gray-50 to-gray-100 p-4 space-y-4 my-6 overflow-auto max-h-96 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    AI Suggestions
                </h3>
            </div>
            {Object.entries(data).map(([key, val]) => {
                const str = String(val)
                const isLong = str.length > 300
                const isOpen = !!expanded[key]
                const preview = isOpen ? str : str.slice(0, 300) + (isLong ? "…" : "")
                return (
                    <div 
                        key={key} 
                        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 hover:border-blue-300"
                        onClick={() => isLong && toggleField(key)}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
                                {key}
                            </div>
                            {isLong && (
                                <button className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors cursor-pointer">
                                    {isOpen ? "Show less" : "Show more"}
                                </button>
                            )}
                        </div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                            {preview}
                        </div>
                    </div>
                )
            })}
        </div>
    )
})

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

    // build static system messages once per open
    const systemMessages = useMemo<ChatMessage[]>(() => {
        const msgs: ChatMessage[] = [{ role: "system", text: "You are a helpful assistant." }]
        if (extraContext) {
            msgs.push({ role: "system", text: extraContext })
        }
        msgs.push({
            role: "system",
            text: `When asked, return only a JSON object with keys: ${Object.keys(schema).join(
                ", "
            )}. Do not include any extra text.`,
        })
        return msgs
    }, [extraContext, schema])

    // model/provider handlers
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

    // reset whenever modal opens
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

    // append each assistant reply
    useEffect(() => {
        if (!generic.data) return
        setHistory((h) => [
            ...h,
            { role: "assistant", text: JSON.stringify(generic.data) },
        ])
    }, [generic.data])

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
            <DialogContent className="w-full sm:max-w-md md:max-w-xl lg:max-w-2xl max-h-[90vh] p-6 overflow-y-auto">
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

                    {/* provider/model */}
                    <LLMModelSelector
                        provider={provider}
                        model={model}
                        onProviderChange={onProviderChange}
                        onModelChange={onModelChange}
                    />

                    {/* uncontrolled prompt textarea */}
                    <Textarea
                        className="min-h-[6rem] mt-4"
                        placeholder="Extra prompt..."
                        defaultValue={prompt}
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
                            <Button
                                onClick={() => onAccept(generic.data as Partial<T>)}
                                disabled={generic.isPending}
                            >
                                Accept
                            </Button>
                        )}
                    </div>

                    {generic.isError && (
                        <p className="text-red-600 mt-2">{generic.error!.message}</p>
                    )}

                    {generic.data && (
                        <Suggestions
                            data={generic.data as Record<string, any>}
                            expanded={expanded}
                            toggleField={toggleField}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
