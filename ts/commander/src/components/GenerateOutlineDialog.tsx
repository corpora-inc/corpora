import { useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select"
import { useLLMConfigStore } from "@/stores/LLMConfigStore"
import {
    useCorporaCommanderApiOutlineGenerateOutline,
} from "@/api/commander/commander"

import type { ProviderType } from "@/stores/LLMConfigStore"
import type { OutlineResponse } from "@/api/schemas/outlineResponse"
import type { SectionOutline } from "@/api/schemas/sectionOutline"
import type { OutlineRequestConfig } from "@/api/schemas/outlineRequestConfig"

// Needed props:
// - open, onClose
// - projectMeta (for outlining context)
// - onAccept(outline: OutlineResponse)
export interface GenerateOutlineDialogProps {
    open: boolean
    onClose: () => void
    projectMeta: {
        title: string
        subtitle?: string | null
        purpose?: string | null
        has_images?: boolean
        [key: string]: any
    }
    onAccept: (outline: OutlineResponse) => void
}

export function GenerateOutlineDialog({
    open,
    onClose,
    projectMeta,
    onAccept,
}: GenerateOutlineDialogProps) {
    const { configs, defaultProvider, availableModels, setDefault, setDefaultModel } = useLLMConfigStore()

    const providers = useMemo(
        () => (Object.keys(configs) as ProviderType[]).filter(p => configs[p] !== null),
        [configs]
    )

    const [provider, setProvider] = useState<ProviderType>(defaultProvider ?? providers[0]!)
    const [model, _setModel] = useState<string>("")
    const [userPrompt, setUserPrompt] = useState("")
    const [history, setHistory] = useState<{ role: "system" | "user" | "assistant"; text: string }[]>([])
    const [outline, setOutline] = useState<OutlineResponse | null>(null)
    const [error, setError] = useState<string | null>(null)

    const outlineGen = useCorporaCommanderApiOutlineGenerateOutline()

    // Reset dialog state on open
    useEffect(() => {
        if (!open) return
        const startProv = defaultProvider ?? providers[0]!
        setProvider(startProv)
        setDefault(startProv)
        const modelsForProv = availableModels[startProv] ?? []
        const startModel =
            (configs[startProv]?.defaultModel as string) ??
            modelsForProv[0] ??
            ""
        _setModel(startModel)

        setUserPrompt("")
        setOutline(null)
        setError(null)
        setHistory([
            {
                role: "system",
                text: "You are an expert book-outliner. Always return JSON in the exact schema requested.",
            },
            {
                role: "user",
                text:
                    `Project context:\n` +
                    `title: ${projectMeta.title}\n` +
                    `subtitle: ${projectMeta.subtitle ?? ""}\n` +
                    `purpose: ${projectMeta.purpose ?? ""}\n` +
                    `has_images: ${projectMeta.has_images ?? false}\n` +
                    `Instructions: ${projectMeta.instructions ?? ""}\n` +
                    `Voice: ${projectMeta.voice ?? ""}\n`
                // `Prompt: ${userPrompt}\n\n`
            },
        ])
        outlineGen.reset()
    }, [open])

    // Keep model list in sync
    useEffect(() => {
        setDefault(provider)
        const mdl = configs[provider]?.defaultModel
        if (mdl) {
            _setModel(mdl)
        } else {
            const list = availableModels[provider] ?? []
            _setModel(list[0] ?? "")
        }
    }, [provider, configs, availableModels])

    // On successful outline, add to chat history
    useEffect(() => {
        if (outlineGen.data) {
            setOutline(outlineGen.data.data)
            setHistory((h) => [
                ...h,
                {
                    role: "assistant",
                    text: `outline: ${JSON.stringify(outlineGen.data.data, null, 2)}`,
                },
            ])
        }
    }, [outlineGen.data])

    const setModel = (m: string) => {
        _setModel(m)
        setDefaultModel(provider, m)
    }

    // Compose API request, keeping full chat context
    const handleGenerate = async () => {
        setError(null)
        setOutline(null)
        setHistory((h) =>
            userPrompt.trim()
                ? [...h, { role: "user", text: userPrompt.trim() }]
                : h
        )

        try {
            await outlineGen.mutateAsync({
                projectId: projectMeta.id || "", // or pass project_id if available
                data: {
                    provider,
                    config: configs[provider]! as unknown as OutlineRequestConfig,
                    prompt: userPrompt,
                },
            })
        } catch (e: any) {
            setError(e.message ?? "Unknown error")
        }
    }

    // Accept = save outline to parent
    const handleAccept = () => {
        if (outline) {
            onAccept(outline)
            onClose()
        }
    }

    const models = availableModels[provider] ?? []

    return (
        <Dialog open={open} onOpenChange={(ok) => !ok && onClose()}>
            <DialogContent className="max-w-2xl p-6 space-y-4">
                <header className="flex items-center justify-between">
                    <DialogTitle className="text-xl font-semibold">
                        Generate Book Outline
                    </DialogTitle>
                    <DialogClose className="cursor-pointer" />
                </header>

                {/* Provider/model */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="w-full">
                        <Select value={provider} onValueChange={(v) => setProvider(v as ProviderType)}>
                            <SelectTrigger className="w-full">
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
                    </div>
                    <div className="w-full">
                        <Select value={model} onValueChange={setModel}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Model" />
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
                </div>

                <Textarea
                    className="min-h-[5rem]"
                    placeholder="Describe what you want in the outline or add feedback. E.g. 'Make it more concise', 'Add a chapter on X', etc."
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                />

                {/* Show history */}
                <div className="border rounded bg-gray-50 p-3 max-h-40 overflow-auto text-xs space-y-2">
                    {history.map((m, i) => (
                        <div key={i}>
                            <span className="font-semibold">{m.role}: </span>
                            <span>{m.text}</span>
                        </div>
                    ))}
                </div>

                {outlineGen.isPending ? (
                    <div className="flex justify-center py-6">
                        <Loader2 className="animate-spin h-6 w-6 text-gray-500" />
                    </div>
                ) : outline ? (
                    <div className="border rounded bg-gray-50 p-4 space-y-3 max-h-72 overflow-y-auto">
                        {outline.sections.map((sec: SectionOutline) => (
                            <div key={sec.order} className="space-y-1">
                                <h3 className="font-semibold">
                                    {sec.order}. {sec.title}
                                </h3>
                                <p className="text-sm text-gray-600">{sec.instructions}</p>
                                <div className="pl-4">
                                    {sec.subsections.map((sub) => (
                                        <div key={sub.order} className="mb-2">
                                            <h4 className="font-medium">
                                                {sub.order}. {sub.title}
                                            </h4>
                                            <p className="text-sm text-gray-600">{sub.instructions}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}

                {error && <div className="text-red-600">{error}</div>}

                <div className="flex justify-end space-x-2">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleGenerate}
                        disabled={outlineGen.isPending || !model}
                    >
                        {outline ? "Regenerate" : "Generate"}
                    </Button>
                    <Button
                        onClick={handleAccept}
                        disabled={!outline}
                    >
                        Accept
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
