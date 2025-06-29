// ts/commander/src/components/SubsectionEditor.tsx
import { useEffect, useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Zap } from "lucide-react"
import {
    useCorporaCommanderApiSubsectionGetSubsection,
    useCorporaCommanderApiSubsectionUpdateSubsection,
} from "@/api/commander/commander"
import { useProjectStore } from "@/stores/ProjectStore"
import type { SectionWithSubsections } from "@/api/schemas/sectionWithSubsections"
import { LLMEnhanceModal } from "@/components/LLMEnhanceModal"

// always include this prompt instruction
const GENERAL_MARKDOWN_INSTRUCTIONS =
    "The subsection content MUST begin with a second-level heading: `## {title}` to maintain proper markdown structure."

export function SubsectionEditor({
    subsectionId,
    onBack,
}: {
    subsectionId: string
    onBack: () => void
}) {
    // ─── hooks ───────────────────────────────────────────────────────────────
    const subQ = useCorporaCommanderApiSubsectionGetSubsection(subsectionId)
    const saveSub = useCorporaCommanderApiSubsectionUpdateSubsection()

    const project = useProjectStore((s) => s.project)!
    const sections = useProjectStore((s) => s.sections)

    const [title, setTitle] = useState("")
    const [instructions, setInstructions] = useState("")
    const [content, setContent] = useState("")
    const [enhanceOpen, setEnhanceOpen] = useState(false)

    // seed from fetched data
    useEffect(() => {
        if (subQ.data) {
            const { title: t, instructions: i, content: c } = subQ.data.data
            setTitle(t)
            setInstructions(i ?? "")
            setContent(c ?? "")
        }
    }, [subQ.data])

    // find parent section
    const section = useMemo<SectionWithSubsections>(() => {
        const found = sections.find(
            (sec) => sec.id === subQ.data?.data.section_id
        )
        if (found) return found
        return {
            id: "",
            project_id: project.id,
            title: "",
            introduction: "",
            instructions: "",
            order: 0,
            created_at: "",
            updated_at: "",
            subsections: [],
        }
    }, [sections, subQ.data, project.id])

    // build extraContext
    const extraContext = useMemo(() => {
        const parts: string[] = []
        parts.push(`Project Title: ${project.title}`)
        if (project.subtitle) parts.push(`Subtitle: ${project.subtitle}`)
        if (project.purpose) parts.push(`Purpose: ${project.purpose}`)
        if (project.voice) parts.push(`Voice: ${project.voice}`)
        parts.push(`Section Title: ${section.title}`)
        if (section.instructions)
            parts.push(`Section Instructions: ${section.instructions}`)
        if (section.subsections.length > 0) {
            const other = section.subsections
                .filter((s) => s.id !== subsectionId)
                .map((s) => s.title)
                .join(", ")
            parts.push(`Other Subsections: ${other}`)
        }
        parts.push(`You are currently editing subsection: ${subQ.data?.data.title}`)
        parts.push(`Subsection Instructions: ${subQ.data?.data.instructions}`)
        parts.push(GENERAL_MARKDOWN_INSTRUCTIONS)
        return parts.join("\n\n")
    }, [project, section, subQ.data, subsectionId])

    const handleSave = () =>
        saveSub.mutate({
            subsectionId,
            data: { title, instructions, content },
        })

    // ─── early returns ──────────────────────────────────────────────────────
    if (subQ.isLoading) return <p>Loading…</p>
    if (subQ.isError)
        return <p className="text-red-600">Error: {subQ.error?.message}</p>

    // ─── render ─────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    aria-label="Back"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Subsection Title"
                        className="text-lg"
                    />
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 flex flex-col overflow-hidden space-y-4">
                {/* Instructions (fixed ~3 lines) */}
                <div>
                    <label className="block mb-1 font-medium">
                        Instructions
                    </label>
                    <Textarea
                        className="h-24 resize-none w-full"
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                    />
                </div>

                {/* Content (fills remaining space) */}
                <div className="flex-1 flex flex-col">
                    <label className="block mb-1 font-medium">
                        Content
                    </label>
                    <Textarea
                        className="flex-1 resize-none w-full"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t pt-3 pb-4 flex justify-end space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEnhanceOpen(true)}
                    disabled={!(
                        title.trim() ||
                        instructions.trim() ||
                        content.trim()
                    )}
                >
                    <Zap className="mr-1 h-4 w-4" /> Enhance
                </Button>
                <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saveSub.isPending}
                >
                    {saveSub.isPending ? "Saving…" : "Save"}
                </Button>
            </div>

            {/* AI Enhance Modal */}
            <LLMEnhanceModal<{
                title: string
                instructions: string
                content: string
            }>
                open={enhanceOpen}
                schema={{
                    title: "str",
                    instructions: "str",
                    content: "str",
                }}
                initialData={{ title, instructions, content }}
                extraContext={extraContext}
                onAccept={({
                    title: newTitle,
                    instructions: newInst,
                    content: newContent,
                }) => {
                    if (typeof newTitle === "string") setTitle(newTitle)
                    if (typeof newInst === "string") setInstructions(newInst)
                    if (typeof newContent === "string") setContent(newContent)
                    setEnhanceOpen(false)
                }}
                onClose={() => setEnhanceOpen(false)}
            />
        </div>
    )
}
