// ts/commander/src/components/SubsectionEditor.tsx

import { useEffect, useState } from "react"
import {
    useCorporaCommanderApiSubsectionGetSubsection,
    useCorporaCommanderApiSubsectionUpdateSubsection,
} from "@/api/commander/commander"

export function SubsectionEditor({
    // sectionId,
    subsectionId,
    onBack,
}: {
    sectionId: string
    subsectionId: string
    onBack: () => void
}) {
    // 1) Fetch the subsection by its own ID, not sectionId!
    const subQuery = useCorporaCommanderApiSubsectionGetSubsection(subsectionId)
    const updateSub = useCorporaCommanderApiSubsectionUpdateSubsection()

    // Local content state (always a string)
    const [content, setContent] = useState("")

    // When data arrives, default undefined → ""
    useEffect(() => {
        if (subQuery.data) {
            setContent(subQuery.data.data.content ?? "")
        }
    }, [subQuery.data])

    // Loading / error
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

    // Now safe to unwrap
    const sub = subQuery.data!.data

    const handleSave = () => {
        updateSub.mutate({ subsectionId, data: { content } })
    }

    return (
        <div>
            <button
                className="mb-4 text-blue-600 hover:underline"
                onClick={onBack}
            >
                &larr; Back to Section
            </button>

            <h2 className="text-xl font-semibold">{sub.title}</h2>

            <label className="block mt-4 font-medium">Content</label>
            <textarea
                className="mt-1 w-full border p-2 min-h-[200px]"
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />

            <button
                className="mt-2 btn-primary"
                onClick={handleSave}
                disabled={updateSub.isPending}
            >
                {updateSub.isPending ? "Saving…" : "Save Content"}
            </button>
        </div>
    )
}
