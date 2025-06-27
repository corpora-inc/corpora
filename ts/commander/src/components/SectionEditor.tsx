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
    const [enhanceOpen, setEnhanceOpen] = useState(false)

    // seed state when section loads
    useEffect(() => {
        if (sectionQ.data) {
            const sec = sectionQ.data.data
            setTitle(sec.title)
            setIntro(sec.introduction ?? "")
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

    // compute extraContext
    // const section = sectionQ.data!.data
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

    // console.log("Extra context for LLM:", extraContext)

    // save handler
    const handleSave = () =>
        saveSection.mutate({
            sectionId,
            data: { title, introduction: intro },
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
            <div className="flex-1 flex flex-col overflow-hidden">
                <label className="block mb-2 font-medium">Introduction</label>
                <Textarea
                    className="flex-1 resize-none"
                    value={intro}
                    onChange={(e) => setIntro(e.target.value)}
                />
            </div>

            {/* FOOTER */}
            <div className="flex justify-end space-x-2 py-4 border-t">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEnhanceOpen(true)}
                    disabled={!(title.trim() || intro.trim())}
                >
                    <Zap className="mr-1 h-4 w-4" /> Enhance
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saveSection.isPending}>
                    {saveSection.isPending ? "..." : "Save"}
                </Button>
            </div>

            {/* AI ENHANCE DIALOG */}
            <LLMEnhanceModal<{ title: string; introduction: string }>
                open={enhanceOpen}
                schema={{ title: "str", introduction: "str" }}
                initialData={{ title, introduction: intro }}
                extraContext={extraContext}
                onAccept={({ title: newTitle, introduction: newIntro }) => {
                    if (newTitle) setTitle(newTitle)
                    if (newIntro) setIntro(newIntro)
                    setEnhanceOpen(false)
                }}
                onClose={() => setEnhanceOpen(false)}
            />
        </div>
    )
}
