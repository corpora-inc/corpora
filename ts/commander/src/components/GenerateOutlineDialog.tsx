// src/components/GenerateOutlineDialog.tsx
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

import { useLLMConfigStore } from "@/stores/LLMConfigStore"
import { useProjectStore } from "@/stores/ProjectStore"
import { LLMModelSelector } from "@/components/LLMModelSelector"
import {
    useCorporaCommanderApiOutlineGenerateOutline,
    useCorporaCommanderApiSectionCreateSection,
    useCorporaCommanderApiSubsectionCreateSubsection,
} from "@/api/commander/commander"

import type { ProviderType } from "@/stores/LLMConfigStore"
import type { OutlineResponse } from "@/api/schemas/outlineResponse"
import type { SectionOutline } from "@/api/schemas/sectionOutline"

export interface GenerateOutlineDialogProps {
    open: boolean
    onClose: () => void
}

export function GenerateOutlineDialog({
    open,
    onClose,
}: GenerateOutlineDialogProps) {
    const project = useProjectStore((s) => s.project)

    // LLM config
    const {
        configs,
        defaultProvider,
        availableModels,
        setDefault,
        setDefaultModel,
    } = useLLMConfigStore()

    // CRUD hooks
    const createSection = useCorporaCommanderApiSectionCreateSection()
    const createSubsection = useCorporaCommanderApiSubsectionCreateSubsection()

    // Outline LLM hook
    const outlineGen = useCorporaCommanderApiOutlineGenerateOutline()

    // Local UI state
    const [provider, setProvider] = useState<ProviderType>(
        defaultProvider!
    )
    const [model, setModel] = useState<string>("")
    const [userPrompt, setUserPrompt] = useState<string>("")
    const [history, setHistory] = useState<
        { role: "system" | "user" | "assistant"; text: string }[]
    >([])
    const [outline, setOutline] = useState<OutlineResponse | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Reset state when opened or project changes
    useEffect(() => {
        if (!open || !project) return

        const startProv = defaultProvider!
        setProvider(startProv)
        const modelsForProv = availableModels[startProv] ?? []
        const startModel =
            (configs[startProv]?.defaultModel as string) ??
            modelsForProv[0] ??
            ""
        setModel(startModel)

        setUserPrompt("")
        setOutline(null)
        setError(null)
        setHistory([
            {
                role: "system",
                text:
                    "You are an expert book-outliner. Always return JSON in the exact schema requested.",
            },
            {
                role: "user",
                text: [
                    `Project context:`,
                    `title: ${project.title}`,
                    `subtitle: ${project.subtitle ?? ""}`,
                    `purpose: ${project.purpose ?? ""}`,
                    `has_images: ${project.has_images}`,
                    `instructions: ${project.instructions}`,
                    `voice: ${project.voice}`,
                ].join("\n"),
            },
        ])

        outlineGen.reset()
    }, [open, project])

    // Keep model in sync if configs change
    useEffect(() => {
        const list = availableModels[provider] ?? []
        const defaultM = configs[provider]?.defaultModel as string | undefined
        setModel((prev) =>
            defaultM === prev ? prev : defaultM ?? list[0] ?? ""
        )
    }, [provider, configs, availableModels])

    // On LLM response
    useEffect(() => {
        if (!outlineGen.data) return
        const result = outlineGen.data.data
        setOutline(result)
        setHistory((h) => [
            ...h,
            { role: "assistant", text: JSON.stringify(result, null, 2) },
        ])
    }, [outlineGen.data])

    const handleGenerate = async () => {
        if (!project || !model) return
        setError(null)
        setOutline(null)
        if (userPrompt.trim()) {
            setHistory((h) => [
                ...h,
                { role: "user", text: userPrompt.trim() },
            ])
        }
        try {
            await outlineGen.mutateAsync({
                projectId: project.id,
                data: {
                    provider,
                    config: { ...configs[provider]!, defaultModel: model },
                    prompt: userPrompt,
                },
            })
        } catch (e: any) {
            setError(e.message ?? "Unknown error")
        }
    }

    const handleAccept = async () => {
        if (!outline || !project) return
        try {
            for (const sec of outline.sections) {
                const secRes = await createSection.mutateAsync({
                    projectId: project.id,
                    data: {
                        title: sec.title,
                        introduction: "",
                        instructions: sec.instructions,
                        order: sec.order,
                    },
                })
                for (const sub of sec.subsections) {
                    await createSubsection.mutateAsync({
                        sectionId: secRes.data.id,
                        data: {
                            title: sub.title,
                            content: "",
                            instructions: sub.instructions,
                            order: sub.order,
                        },
                    })
                }
            }
            onClose()
        } catch (err) {
            console.error("Accept outline failed", err)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(ok) => !ok && onClose()}>
            <DialogContent className="max-w-2xl p-6 space-y-4">
                <DialogHeader>
                    <DialogTitle>Generate Book Outline</DialogTitle>
                    <DialogClose />
                </DialogHeader>

                {/* Reusable provider/model selector */}
                <LLMModelSelector
                    provider={provider}
                    model={model}
                    onProviderChange={(p) => {
                        setProvider(p)
                        setDefault(p)
                    }}
                    onModelChange={(m) => {
                        setModel(m)
                        setDefaultModel(provider, m)
                    }}
                />

                {/* Custom prompt */}
                <Textarea
                    className="min-h-[5rem]"
                    placeholder="Feedback or custom instructions (optional)"
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                />

                {/* Chat history */}
                <div className="border rounded bg-gray-50 p-3 max-h-40 overflow-auto text-xs space-y-2">
                    {history.map((m, i) => (
                        <div key={i}>
                            <span className="font-semibold">{m.role}: </span>
                            <span>{m.text}</span>
                        </div>
                    ))}
                </div>

                {/* Spinner or preview */}
                {outlineGen.isPending ? (
                    <div className="flex justify-center py-6">
                        <Loader2 className="animate-spin h-6 w-6 text-gray-500" />
                    </div>
                ) : outline ? (
                    <div className="border rounded bg-gray-50 p-4 space-y-3 max-h-72 overflow-y-auto">
                        {outline.sections.map((sec: SectionOutline) => (
                            <div key={sec.order} className="space-y-1">
                                <h3 className="font-semibold">{sec.title}</h3>
                                <p className="text-sm text-gray-600">
                                    {sec.instructions}
                                </p>
                                <div className="pl-4">
                                    {sec.subsections.map((sub) => (
                                        <div key={sub.order} className="mb-2">
                                            <h4 className="font-medium">{sub.title}</h4>
                                            <p className="text-sm text-gray-600">
                                                {sub.instructions}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}

                {error && <div className="text-red-600">{error}</div>}

                <DialogFooter className="flex justify-end space-x-2">
                    <Button variant="secondary" onClick={onClose}>
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
                        disabled={
                            !outline ||
                            createSection.isPending ||
                            createSubsection.isPending
                        }
                    >
                        {createSection.isPending ||
                            createSubsection.isPending ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            "Accept"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
