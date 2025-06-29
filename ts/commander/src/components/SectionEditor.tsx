// ts/commander/src/components/SectionEditor.tsx
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { useProjectStore } from "@/stores/ProjectStore"
import {
    useCorporaCommanderApiSectionGetSection,
    useCorporaCommanderApiSectionUpdateSection,
} from "@/api/commander/commander"
import { useCorporaCommanderApiSubsectionListSubsections } from "@/api/commander/commander"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, Zap } from "lucide-react"
import { LLMEnhanceModal } from "@/components/LLMEnhanceModal"

export function SectionEditor({
    sectionId,
    onBack,
}: {
    sectionId: string
    onBack: () => void
}) {
    // fetch the section
    const sectionQ = useCorporaCommanderApiSectionGetSection(sectionId)
    const saveSection = useCorporaCommanderApiSectionUpdateSection()

    // fetch its subsections for context
    const subsQ = useCorporaCommanderApiSubsectionListSubsections(sectionId, {
        query: { enabled: !!sectionId },
    })

    // project context
    const project = useProjectStore((s) => s.project)!

    // local editable state
    const [title, setTitle] = useState("")
    const [intro, setIntro] = useState("")
    const [instructions, setInstructions] = useState("")
    const [enhanceOpen, setEnhanceOpen] = useState(false)

    // seed state when section loads
    useEffect(() => {
        if (sectionQ.data) {
            const sec = sectionQ.data.data
            setTitle(sec.title)
            setIntro(sec.introduction ?? "")
            setInstructions(sec.instructions ?? "")
        }
    }, [sectionQ.data])

    if (sectionQ.isLoading || subsQ.isLoading) {
        return <p>Loading…</p>
    }
    if (sectionQ.isError) {
        return (
            <p className="text-red-600">
                Error loading section: {sectionQ.error?.message}
            </p>
        )
    }
    if (subsQ.isError) {
        return (
            <p className="text-red-600">
                Error loading subsections: {subsQ.error?.message}
            </p>
        )
    }

    const subs = subsQ.data!.data
    const subsectionTitles =
        subs.length > 0
            ? "Subsections:\n" + subs.map((s) => `- ${s.title}`).join("\n")
            : ""

    const extraContext = [
        `Book Title: ${project.title}`,
        project.subtitle ? `Subtitle: ${project.subtitle}` : "",
        project.purpose ? `Purpose: ${project.purpose}` : "",
        subsectionTitles,
    ]
        .filter(Boolean)
        .join("\n\n")

    // save handler
    const handleSave = () =>
        saveSection.mutate({
            sectionId,
            data: {
                title,
                introduction: intro,
                instructions,
            },
        })

    return (
        <div className="flex flex-col h-full">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    aria-label="Back to Project"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Section Title"
                        className="text-xl font-semibold"
                    />
                </div>
            </div>

            {/* BODY */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                {/* Instructions: fixed ~3 lines */}
                <div className="mb-4">
                    <label className="block mb-1 font-medium">Instructions</label>
                    <Textarea
                        className="h-24 resize-none w-full"
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                    />
                </div>

                {/* Introduction: fills remaining space & scrolls internally */}
                <div className="flex-1 flex flex-col min-h-0">
                    <label className="block mb-1 font-medium">Introduction</label>
                    <Textarea
                        className="flex-1 h-full min-h-0 w-full resize-none overflow-y-auto"
                        value={intro}
                        onChange={(e) => setIntro(e.target.value)}
                    />
                </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-end space-x-2 my-2 py-2 border-t">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEnhanceOpen(true)}
                    disabled={!(
                        title.trim() ||
                        intro.trim() ||
                        instructions.trim()
                    )}
                >
                    <Zap className="mr-1 h-4 w-4" /> Enhance
                </Button>
                <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saveSection.isPending}
                >
                    {saveSection.isPending ? "Saving…" : "Save"}
                </Button>
            </div>

            {/* AI ENHANCE DIALOG */}
            <LLMEnhanceModal<{
                title: string
                instructions: string
                introduction: string
            }>
                open={enhanceOpen}
                schema={{
                    title: "str",
                    instructions: "str",
                    introduction: "str",
                }}
                initialData={{
                    title,
                    instructions,
                    introduction: intro,
                }}
                extraContext={extraContext}
                onAccept={({
                    title: newTitle,
                    introduction: newIntro,
                    instructions: newInst,
                }) => {
                    if (newTitle) setTitle(newTitle)
                    if (newIntro) setIntro(newIntro)
                    if (newInst) setInstructions(newInst)
                    setEnhanceOpen(false)
                }}
                onClose={() => setEnhanceOpen(false)}
            />
        </div>
    )
}
