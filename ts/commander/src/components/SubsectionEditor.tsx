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
    //
    // ─── ALL HOOKS FIRST ──────────────────────────────────────────────────
    //

    // data + mutations
    const subQ = useCorporaCommanderApiSubsectionGetSubsection(subsectionId)
    const saveSub = useCorporaCommanderApiSubsectionUpdateSubsection()

    // global project + outline state
    const project = useProjectStore((s) => s.project)!
    const sections = useProjectStore((s) => s.sections)

    // local form state
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [enhanceOpen, setEnhanceOpen] = useState(false)

    // seed from fetched data
    useEffect(() => {
        if (subQ.data) {
            const { title: t, content: c } = subQ.data.data
            setTitle(t)
            setContent(c ?? "")
        }
    }, [subQ.data])

    // find parent section (typed) or a safe fallback
    const section = useMemo<SectionWithSubsections>(() => {
        const found = sections.find((sec) => sec.id === subQ.data?.data.section_id)
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

    // build the extraContext for the LLM
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
        parts.push(`Instructions: ${subQ.data?.data.instructions}`)
        parts.push(GENERAL_MARKDOWN_INSTRUCTIONS)
        return parts.join("\n\n")
    }, [project, section, subQ.data, subsectionId])

    const handleSave = () =>
        saveSub.mutate({ subsectionId, data: { title, content } })

    const enhanceSchema = { title: "str", content: "str" } as const

    //
    // ─── EARLY RETURNS ────────────────────────────────────────────────────
    //

    if (subQ.isLoading) return <p>Loading…</p>
    if (subQ.isError)
        return <p className="text-red-600">Error: {subQ.error?.message}</p>

    //
    // ─── MAIN RENDER ──────────────────────────────────────────────────────
    //

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Subsection Title"
                    />
                </div>
            </div>

            {/* Content editor */}
            <div className="flex-1 overflow-auto mb-4">
                <Textarea
                    className="w-full h-full resize-none"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
            </div>

            {/* Sticky footer */}
            <div className="sticky bottom-0 bg-white border-t pt-3 pb-4 flex justify-end space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEnhanceOpen(true)}
                    disabled={!(title.trim() || content.trim())}
                >
                    <Zap className="mr-1 h-4 w-4" /> Enhance
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saveSub.isPending}>
                    {saveSub.isPending ? "Saving…" : "Save"}
                </Button>
            </div>

            {/* AI enhance modal */}
            <LLMEnhanceModal<{ title: string; content: string }>
                open={enhanceOpen}
                schema={enhanceSchema}
                initialData={{ title, content }}
                extraContext={extraContext}
                onAccept={({ title: newTitle, content: newContent }) => {
                    if (typeof newTitle === "string") setTitle(newTitle)
                    if (typeof newContent === "string") setContent(newContent)
                    setEnhanceOpen(false)
                }}
                onClose={() => setEnhanceOpen(false)}
            />
        </div>
    )
}
