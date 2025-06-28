// ts/commander/src/components/GenerateRewriteDialog.tsx
import React, { useState, useMemo, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useProjectStore } from "@/stores/ProjectStore"
import { useLLMConfigStore } from "@/stores/LLMConfigStore"
import { LLMModelSelector } from "@/components/LLMModelSelector"
import {
    useCorporaCommanderApiRewriteRewriteSections,
    useCorporaCommanderApiRewriteRewriteSubsections,
    useCorporaCommanderApiSectionUpdateSection,
    useCorporaCommanderApiSubsectionUpdateSubsection,
} from "@/api/commander/commander"

import type { ProviderType } from "@/stores/LLMConfigStore"
import type {
    RewriteRequest,
    RewriteSection,
    RewriteSubsection,
} from "@/api/schemas"

export interface GenerateRewriteDialogProps {
    open: boolean
    onClose: () => void
}

export const GenerateRewriteDialog: React.FC<GenerateRewriteDialogProps> = ({
    open,
    onClose,
}) => {
    const project = useProjectStore((s) => s.project)
    const sections = useProjectStore((s) => s.sections)

    const { configs, defaultProvider, availableModels } = useLLMConfigStore()

    // determine valid providers
    const providers = useMemo(
        () => (Object.keys(configs) as ProviderType[]).filter((p) => configs[p] != null),
        [configs]
    )
    const initProvider: ProviderType = defaultProvider ?? providers[0]
    const initModel =
        configs[initProvider]?.defaultModel ??
        availableModels[initProvider]?.[0] ??
        ""

    const [provider, setProvider] = useState<ProviderType>(initProvider)
    const [model, setModel] = useState<string>(initModel)
    const [prompt, setPrompt] = useState<string>("")
    const [scope, setScope] = useState<"sections" | "subsections">("sections")
    const [proposals, setProposals] = useState<
        RewriteSection[] | RewriteSubsection[] | null
    >(null)

    const rewriteSections = useCorporaCommanderApiRewriteRewriteSections()
    const rewriteSubs = useCorporaCommanderApiRewriteRewriteSubsections()
    const updateSection = useCorporaCommanderApiSectionUpdateSection()
    const updateSub = useCorporaCommanderApiSubsectionUpdateSubsection()

    // reset when opened
    useEffect(() => {
        if (!open) return
        setPrompt("")
        setProposals(null)
        setScope("sections")
    }, [open])

    const handleRun = async () => {
        if (!project) return
        const payload: RewriteRequest = {
            provider,
            config: { ...configs[provider]!, defaultModel: model },
            prompt,
        }
        try {
            if (scope === "sections") {
                const res = await rewriteSections.mutateAsync({
                    projectId: project.id,
                    data: payload,
                })
                setProposals(res.data)
            } else {
                const res = await rewriteSubs.mutateAsync({
                    projectId: project.id,
                    data: payload,
                })
                setProposals(res.data)
            }
        } catch (e) {
            console.error("Rewrite failed", e)
        }
    }

    const handleAccept = async () => {
        if (!proposals) return
        try {
            if (scope === "sections") {
                for (const sec of proposals as RewriteSection[]) {
                    await updateSection.mutateAsync({
                        sectionId: sec.section_id,
                        data: { introduction: sec.introduction },
                    })
                }
            } else {
                for (const sub of proposals as RewriteSubsection[]) {
                    await updateSub.mutateAsync({
                        subsectionId: sub.subsection_id,
                        data: { content: sub.content },
                    })
                }
            }
            onClose()
        } catch (e) {
            console.error("Accept rewrite failed", e)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(ok) => !ok && onClose()}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>
                        Rewrite {scope === "sections" ? "Introductions" : "Subsections"}
                    </DialogTitle>
                    <DialogClose />
                </DialogHeader>

                {/* Provider & Model */}
                <LLMModelSelector
                    provider={provider}
                    model={model}
                    onProviderChange={setProvider}
                    onModelChange={setModel}
                />

                {/* Scope selector */}
                <div className="flex gap-2 mt-4">
                    <Button
                        variant={scope === "sections" ? "default" : "outline"}
                        onClick={() => setScope("sections")}
                    >
                        Sections
                    </Button>
                    <Button
                        variant={scope === "subsections" ? "default" : "outline"}
                        onClick={() => setScope("subsections")}
                    >
                        Subsections
                    </Button>
                </div>

                {/* Prompt or proposals */}
                <div className="mt-4 space-y-4">
                    {!proposals ? (
                        <Textarea
                            className="h-32"
                            placeholder="Additional instructions (optional)"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                    ) : (
                        <div className="space-y-6 overflow-y-auto max-h-[60vh]">
                            {(proposals as any[]).map((item) => {
                                if (scope === "sections") {
                                    const sec = item as RewriteSection
                                    const title =
                                        sections.find((s) => s.id === sec.section_id)?.title ??
                                        "Untitled"
                                    return (
                                        <section
                                            key={sec.section_id}
                                            className="space-y-2 border-b pb-4"
                                        >
                                            <h3 className="text-lg font-semibold">{title}</h3>
                                            <p>{sec.introduction}</p>
                                        </section>
                                    )
                                } else {
                                    const sub = item as RewriteSubsection
                                    const parentTitle =
                                        sections
                                            .flatMap((s) => s.subsections)
                                            .find((x) => x.id === sub.subsection_id)?.title ??
                                        "Untitled"
                                    return (
                                        <section
                                            key={sub.subsection_id}
                                            className="space-y-2 border-b pb-4"
                                        >
                                            <h3 className="text-lg font-semibold">
                                                {parentTitle}
                                            </h3>
                                            <p>{sub.content}</p>
                                        </section>
                                    )
                                }
                            })}
                        </div>
                    )}
                </div>

                <DialogFooter className="space-x-2">
                    {!proposals ? (
                        <Button
                            onClick={handleRun}
                            disabled={
                                (scope === "sections"
                                    ? rewriteSections.isPending
                                    : rewriteSubs.isPending) || !model
                            }
                        >
                            {(scope === "sections"
                                ? rewriteSections.isPending
                                : rewriteSubs.isPending) ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                `Generate ${scope === "sections" ? "Introductions" : "Content"}`
                            )}
                        </Button>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => setProposals(null)}>
                                Regenerate
                            </Button>
                            <Button
                                onClick={handleAccept}
                                disabled={updateSection.isPending || updateSub.isPending}
                            >
                                {updateSection.isPending || updateSub.isPending ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    "Accept Changes"
                                )}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
