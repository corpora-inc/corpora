// ts/commander/src/components/SubsectionEditor.tsx
import { useEffect, useState, useMemo, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Zap } from "lucide-react"
import {
    useCorporaCommanderApiSubsectionGetSubsection,
    useCorporaCommanderApiSubsectionUpdateSubsection,
    getCorporaCommanderApiSectionListSectionsQueryKey,
} from "@/api/commander/commander"
import { useProjectStore } from "@/stores/ProjectStore"
import type { SectionWithSubsections } from "@/api/schemas/sectionWithSubsections"
import { LLMEnhanceModal } from "@/components/LLMEnhanceModal"
import { useQueryClient } from "@tanstack/react-query"

// always include this prompt instruction
const GENERAL_MARKDOWN_INSTRUCTIONS =
    "The subsection content MUST begin with a second-level heading: `## {title}` to maintain proper markdown structure."

type Snapshot = {
    title: string
    instructions: string
    content: string
}

export function SubsectionEditor({
    subsectionId,
    onBack,
}: {
    subsectionId: string
    onBack: () => void
}) {
    // ─── hooks ───────────────────────────────────────────────────────────────
    const subQ = useCorporaCommanderApiSubsectionGetSubsection(subsectionId, {
        // IMPORTANT: treat this like a plain fetch, no long-lived cache
        query: {
            enabled: !!subsectionId,
            gcTime: 0,
            staleTime: 0,
            refetchOnMount: "always",
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
        },
    })

    const saveSub = useCorporaCommanderApiSubsectionUpdateSubsection()
    const queryClient = useQueryClient()

    const project = useProjectStore((s) => s.project)!
    const sections = useProjectStore((s) => s.sections)

    const [title, setTitle] = useState("")
    const [instructions, setInstructions] = useState("")
    const [content, setContent] = useState("")
    const [enhanceOpen, setEnhanceOpen] = useState(false)

    // have we seeded this editor from the server for the *current* subsection?
    const [hasSeeded, setHasSeeded] = useState(false)

    // last saved snapshot (from server or successful save)
    const lastSavedSnapshot = useRef<Snapshot | null>(null)

    // ─── reset editor when subsectionId changes ─────────────────────────────
    useEffect(() => {
        // When you switch which subsection is selected, wipe local editor state.
        // We'll re-seed from the server once the new query resolves.
        setHasSeeded(false)
        lastSavedSnapshot.current = null
        setTitle("")
        setInstructions("")
        setContent("")
    }, [subsectionId])

    // ─── seed from fetched data *once per subsection entry* ─────────────────
    useEffect(() => {
        const data = subQ.data?.data
        if (!data) return
        if (hasSeeded) return // already initialized for this subsection id

        const snapshot: Snapshot = {
            title: data.title ?? "",
            instructions: data.instructions ?? "",
            content: data.content ?? "",
        }

        setTitle(snapshot.title)
        setInstructions(snapshot.instructions)
        setContent(snapshot.content)

        lastSavedSnapshot.current = snapshot
        setHasSeeded(true)
    }, [subQ.data, hasSeeded])

    // ─── debounced autosave ─────────────────────────────────────────────────
    useEffect(() => {
        // Don't autosave until we've actually loaded from the server
        if (!hasSeeded) return

        const current: Snapshot = {
            title: title ?? "",
            instructions: instructions ?? "",
            content: content ?? "",
        }
        const last = lastSavedSnapshot.current

        // If nothing changed vs last saved snapshot, do nothing
        if (
            last &&
            last.title === current.title &&
            last.instructions === current.instructions &&
            last.content === current.content
        ) {
            return
        }

        // Don’t autosave completely empty content
        if (!current.content.trim()) return

        const timer = setTimeout(() => {
            saveSub.mutate(
                {
                    subsectionId,
                    data: current,
                },
                {
                    onSuccess: () => {
                        // backend is now the source of truth for this snapshot
                        lastSavedSnapshot.current = current

                        // keep outline (sections list) fresh
                        if (project) {
                            queryClient.invalidateQueries({
                                queryKey:
                                    getCorporaCommanderApiSectionListSectionsQueryKey(
                                        project.id
                                    ),
                            })
                        }
                    },
                }
            )
        }, 2000)

        return () => clearTimeout(timer)
    }, [title, instructions, content, subsectionId, hasSeeded, saveSub, project, queryClient])

    // ─── find parent section for context (outline only) ─────────────────────
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

    // ─── extraContext for LLMEnhanceModal ───────────────────────────────────
    const extraContext = () => {
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
            if (other) {
                parts.push(`Other Subsections: ${other}`)
            }
        }
        if (subQ.data?.data.title) {
            parts.push(
                `You are currently editing subsection: ${subQ.data.data.title}`
            )
        }
        if (subQ.data?.data.instructions) {
            parts.push(
                `Subsection Instructions: ${subQ.data.data.instructions}`
            )
        }
        parts.push(GENERAL_MARKDOWN_INSTRUCTIONS)
        parts.push("Return the edited content of the subsection.")
        parts.push("Do not change the subsection title or instructions.")
        return parts.join("\n\n")
    }

    // ─── explicit Save button ───────────────────────────────────────────────
    const handleSave = () => {
        const snapshot: Snapshot = {
            title: title ?? "",
            instructions: instructions ?? "",
            content: content ?? "",
        }
        saveSub.mutate(
            {
                subsectionId,
                data: snapshot,
            },
            {
                onSuccess: () => {
                    lastSavedSnapshot.current = snapshot
                    if (project) {
                        queryClient.invalidateQueries({
                            queryKey:
                                getCorporaCommanderApiSectionListSectionsQueryKey(
                                    project.id
                                ),
                        })
                    }
                },
            }
        )
    }

    // ─── early returns ──────────────────────────────────────────────────────
    if (subQ.isLoading && !hasSeeded) return <p>Loading…</p>
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
            <div className="flex flex-col overflow-y-scroll space-y-4 min-h-0">
                {/* Instructions (fixed ~3 lines) */}
                <div>
                    <label className="block mb-1 font-medium">Instructions</label>
                    <Textarea
                        className="h-24 resize-none w-full"
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                    />
                </div>

                {/* Content (fills remaining space & scrolls internally) */}
                <div className="flex-1 flex flex-col min-h-0">
                    <label className="block mb-1 font-medium">Content</label>
                    <Textarea
                        className="min-h-24 w-full"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t py-2 my-2 flex justify-end space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEnhanceOpen(true)}
                    disabled={
                        !(
                            title.trim() ||
                            instructions.trim() ||
                            content.trim()
                        )
                    }
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
            <LLMEnhanceModal<{ content: string }>
                open={enhanceOpen}
                schema={{ content: "str" }}
                initialData={{ content }}
                extraContext={extraContext()}
                onAccept={({ content: newContent }) => {
                    if (typeof newContent === "string") setContent(newContent)
                    setEnhanceOpen(false)
                }}
                onClose={() => setEnhanceOpen(false)}
            />
        </div>
    )
}
