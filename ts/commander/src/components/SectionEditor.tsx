// ts/commander/src/components/SectionEditor.tsx
import { useEffect, useState } from "react"
import {
    useCorporaCommanderApiSectionGetSection,
    useCorporaCommanderApiSectionUpdateSection,
} from "@/api/commander/commander"
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
    const sectionQ = useCorporaCommanderApiSectionGetSection(sectionId)
    const saveSection = useCorporaCommanderApiSectionUpdateSection()

    const [intro, setIntro] = useState("")
    const [enhanceOpen, setEnhanceOpen] = useState(false)

    useEffect(() => {
        if (sectionQ.data) {
            setIntro(sectionQ.data.data.introduction ?? "")
        }
    }, [sectionQ.data])

    if (sectionQ.isLoading) return <p>Loading…</p>
    if (sectionQ.isError)
        return (
            <p className="text-red-600">
                Error loading section: {sectionQ.error?.message}
            </p>
        )

    const section = sectionQ.data!.data

    const handleSave = () =>
        saveSection.mutate({ sectionId, data: { introduction: intro } })

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
                <h2 className="text-xl font-semibold">{section.title}</h2>
                <div className="w-8" />
            </div>

            {/* BODY: label + expanding textarea */}
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
                    disabled={!intro.trim()}
                >
                    <Zap className="mr-1 h-4 w-4" /> Enhance
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saveSection.isPending}>
                    {saveSection.isPending ? "Saving ..." : "Save Intro"}
                </Button>
            </div>

            {/* AI ENHANCE DIALOG */}
            <LLMEnhanceModal<{ introduction: string }>
                open={enhanceOpen}
                schema={{ introduction: "str" }}
                initialData={{ introduction: intro }}
                onAccept={({ introduction: enhanced }) => {
                    if (enhanced) setIntro(enhanced)
                    setEnhanceOpen(false)
                }}
                onClose={() => setEnhanceOpen(false)}
            // extraContext=""
            />
        </div>
    )
}
