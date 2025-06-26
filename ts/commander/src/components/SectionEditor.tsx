// ts/commander/src/components/SectionEditor.tsx
import { useEffect, useState } from "react"
import {
    useCorporaCommanderApiSectionGetSection,
    useCorporaCommanderApiSubsectionListSubsections,
    useCorporaCommanderApiSectionUpdateSection,
} from "@/api/commander/commander"
import type { SubsectionOut } from "@/api/schemas/subsectionOut"

export function SectionEditor({
    sectionId,
    onBack,
    onPickSub,
}: {
    sectionId: string
    onBack: () => void
    onPickSub: (subId: string) => void
}) {
    // 1) fetch the section
    const sectionQuery = useCorporaCommanderApiSectionGetSection(sectionId)
    // 2) fetch its subsections
    const subsQuery = useCorporaCommanderApiSubsectionListSubsections(
        sectionId,
        { query: { enabled: !!sectionId } }
    )
    // 3) mutation for saving
    const updateSection = useCorporaCommanderApiSectionUpdateSection()

    // local intro state (always a string)
    const [intro, setIntro] = useState("")

    // when section arrives, initialize intro
    useEffect(() => {
        if (sectionQuery.data) {
            setIntro(sectionQuery.data.data.introduction ?? "")
        }
    }, [sectionQuery.data])

    // loading / error states
    if (sectionQuery.isLoading || subsQuery.isLoading) {
        return <p>Loading…</p>
    }
    if (sectionQuery.isError) {
        return <p className="text-red-600">Error loading section: {sectionQuery.error?.message}</p>
    }
    if (subsQuery.isError) {
        return <p className="text-red-600">Error loading subsections: {subsQuery.error?.message}</p>
    }

    // both are ready
    const section = sectionQuery.data!.data
    const subs = subsQuery.data!.data as SubsectionOut[]

    const handleSave = () => {
        updateSection.mutate({ sectionId, data: { introduction: intro } })
    }

    return (
        <div>
            <button
                className="mb-4 text-blue-600 hover:underline"
                onClick={onBack}
            >
                &larr; Back to Project
            </button>

            <h2 className="text-xl font-semibold">{section.title}</h2>

            <label className="block mt-4 font-medium">Introduction</label>
            <textarea
                className="mt-1 w-full border p-2"
                rows={4}
                value={intro}
                onChange={e => setIntro(e.target.value)}
            />
            <button
                className="mt-2 btn-primary"
                onClick={handleSave}
                disabled={updateSection.isPending}
            >
                {updateSection.isPending ? "Saving…" : "Save Intro"}
            </button>

            <h3 className="mt-6 font-semibold">Subsections</h3>
            {subs.length === 0 ? (
                <p className="text-gray-600">No subsections yet.</p>
            ) : (
                <ul className="mt-2 space-y-1">
                    {subs.map((sub: SubsectionOut) => (
                        <li
                            key={sub.id}
                            className="cursor-pointer text-blue-600 hover:underline"
                            onClick={() => onPickSub(sub.id)}
                        >
                            {sub.title}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
