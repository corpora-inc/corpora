// ts/commander/src/components/GenerateDraftDialog.tsx

import { useState, useMemo } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useProjectStore } from "@/stores/ProjectStore"
import { useLLMConfigStore } from "@/stores/LLMConfigStore"
import { LLMModelSelector } from "./LLMModelSelector"
import {
    useCorporaCommanderApiDraftDraftBook,
    useCorporaCommanderApiSectionUpdateSection,
    useCorporaCommanderApiSubsectionUpdateSubsection,
} from "@/api/commander/commander"

import type {
    DraftBookResponse,
    DraftSection,
    DraftSubsection,
} from "@/api/schemas"
import type { ProviderType } from "@/stores/LLMConfigStore"

interface GenerateDraftDialogProps {
    open: boolean
    onClose: () => void
}

export function GenerateDraftDialog({
    open,
    onClose,
}: GenerateDraftDialogProps) {
    const project = useProjectStore((s) => s.project)
    const sections = useProjectStore((s) => s.sections)

    const { configs, defaultProvider, availableModels } = useLLMConfigStore()

    // providers & initial model
    const providers = useMemo(
        () =>
            (Object.keys(configs) as ProviderType[]).filter(
                (p) => configs[p] !== null
            ),
        [configs]
    )
    const initProvider = defaultProvider ?? providers[0]!
    const initModel =
        (configs[initProvider]?.defaultModel as string | undefined) ??
        availableModels[initProvider]?.[0] ??
        ""

    const [provider, setProvider] = useState<ProviderType>(initProvider)
    const [model, setModel] = useState<string>(initModel)
    const [prompt, setPrompt] = useState<string>("")
    const [draft, setDraft] = useState<DraftBookResponse | null>(null)

    const draftMutation = useCorporaCommanderApiDraftDraftBook()
    const updateSection = useCorporaCommanderApiSectionUpdateSection()
    const updateSub = useCorporaCommanderApiSubsectionUpdateSubsection()

    const handleRunDraft = async () => {
        if (!project) return
        try {
            const res = await draftMutation.mutateAsync({
                projectId: project.id,
                data: { provider, config: { ...configs[provider]!, defaultModel: model }, prompt },
            })
            setDraft(res.data)
        } catch (e) {
            console.error("Draft failed", e)
        }
    }

    const handleAccept = async () => {
        if (!draft) return
        try {
            for (const secDraft of draft.sections) {
                await updateSection.mutateAsync({
                    sectionId: secDraft.section_id,
                    data: { introduction: secDraft.introduction },
                })
                for (const subDraft of secDraft.subsections) {
                    await updateSub.mutateAsync({
                        subsectionId: subDraft.subsection_id,
                        data: { content: subDraft.content },
                    })
                }
            }
            onClose()
        } catch (e) {
            console.error("Accept draft failed", e)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(ok) => !ok && onClose()}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Draft Book Content</DialogTitle>
                </DialogHeader>

                {/* Provider & Model */}
                <LLMModelSelector
                    provider={provider}
                    model={model}
                    onProviderChange={setProvider}
                    onModelChange={setModel}
                />

                <div className="space-y-4 mt-4">
                    {!draft ? (
                        <Textarea
                            className="h-32"
                            placeholder="Additional instructions (optional)"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                    ) : (
                        <div className="space-y-6 overflow-y-auto max-h-[60vh]">
                            {draft.sections.map((sec: DraftSection) => (
                                <section key={sec.section_id} className="space-y-4 border-b pb-4">
                                    <h3 className="text-lg font-semibold">
                                        {sections.find((s) => s.id === sec.section_id)?.title}
                                    </h3>
                                    <p>{sec.introduction}</p>
                                    {sec.subsections.map((sub: DraftSubsection) => (
                                        <div key={sub.subsection_id} className="ml-4 space-y-2">
                                            <h4 className="text-md font-medium">
                                                {
                                                    sections
                                                        .flatMap((s) => s.subsections)
                                                        .find((x) => x.id === sub.subsection_id)?.title
                                                }
                                            </h4>
                                            <p>{sub.content}</p>
                                        </div>
                                    ))}
                                </section>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className="space-x-2">
                    {!draft ? (
                        <Button onClick={handleRunDraft} disabled={draftMutation.isPending}>
                            {draftMutation.isPending ? <Loader2 className="animate-spin" /> : "Generate Draft"}
                        </Button>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => setDraft(null)}>
                                Regenerate
                            </Button>
                            <Button onClick={handleAccept} disabled={updateSection.isPending || updateSub.isPending}>
                                {updateSection.isPending || updateSub.isPending ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    "Accept Draft"
                                )}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
