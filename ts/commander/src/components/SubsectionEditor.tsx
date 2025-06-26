// ts/commander/src/components/SubsectionEditor.tsx

import { useEffect, useState } from "react"
import {
    useCorporaCommanderApiSubsectionGetSubsection,
    useCorporaCommanderApiSubsectionUpdateSubsection,
} from "@/api/commander/commander"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, Zap } from "lucide-react"
import { LLMEnhanceModal } from "@/components/LLMEnhanceModal"

// simple fields‐map for enhance modal
const enhanceSchema = { content: "str" } as const

export function SubsectionEditor({
    subsectionId,
    onBack,
}: {
    subsectionId: string
    onBack: () => void
}) {
    const subQuery = useCorporaCommanderApiSubsectionGetSubsection(subsectionId)
    const updateSub = useCorporaCommanderApiSubsectionUpdateSubsection()

    const [content, setContent] = useState<string>("")
    const [enhanceOpen, setEnhanceOpen] = useState(false)

    // seed textarea when we get data
    useEffect(() => {
        if (subQuery.data) {
            setContent(subQuery.data.data.content ?? "")
        }
    }, [subQuery.data])

    if (subQuery.isLoading) {
        return <p>Loading…</p>
    }
    if (subQuery.isError) {
        return (
            <p className="text-red-600">
                Error loading subsection: {subQuery.error?.message}
            </p>
        )
    }

    const sub = subQuery.data!.data

    const handleSave = () => {
        updateSub.mutate({ subsectionId, data: { content } })
    }

    return (
        <div className="flex flex-col h-full">
            {/* ─── HEADER ───────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    aria-label="Back to Section"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-xl font-semibold">{sub.title}</h2>
                <div className="w-8" />{/* placeholder for symmetry */}
            </div>

            {/* ─── EDITOR ───────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-auto">
                <Textarea
                    className="w-full h-full resize-none"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
            </div>

            {/* ─── STICKY FOOTER ────────────────────────────────────────────── */}
            <div className="sticky bottom-0 bg-white border-t pt-4 flex justify-end space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEnhanceOpen(true)}
                    disabled={!content.trim()}
                >
                    <Zap className="mr-1 h-4 w-4" /> Enhance
                </Button>
                <Button size="sm" onClick={handleSave} disabled={updateSub.isPending}>
                    {updateSub.isPending ? "Saving…" : "Save Content"}
                </Button>
            </div>

            {/* ─── AI ENHANCE MODAL ─────────────────────────────────────────── */}
            <LLMEnhanceModal<{ content: string }>
                open={enhanceOpen}
                schema={enhanceSchema}
                initialData={{ content }}
                onAccept={({ content: newContent }) => {
                    if (typeof newContent === "string") setContent(newContent)
                    setEnhanceOpen(false)
                }}
                onClose={() => setEnhanceOpen(false)}
            />
        </div>
    )
}
