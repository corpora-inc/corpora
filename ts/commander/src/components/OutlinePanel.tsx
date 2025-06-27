// ts/commander/src/components/OutlinePanel.tsx
import type { FC } from "react"
import { Button } from "@/components/ui/button"
import { useProjectStore } from "@/stores/ProjectStore"


export const OutlinePanel: FC = () => {
    // grab everything we need from the store
    const sections = useProjectStore((s) => s.sections)
    const selectedSectionId = useProjectStore((s) => s.selectedSectionId)
    const selectedSubsectionId = useProjectStore((s) => s.selectedSubsectionId)
    const setSelectedSectionId = useProjectStore((s) => s.setSelectedSectionId)
    const setSelectedSubsectionId = useProjectStore(
        (s) => s.setSelectedSubsectionId
    )
    const setOutlineOpen = useProjectStore((s) => s.setOutlineOpen)

    return (
        // <aside className="w-64 border-r p-4 hidden md:flex flex-col h-full">
        <aside className="w-full md:w-64 md:border-r flex flex-col h-full">
            {sections.length === 0 ? (
                <div className="space-y-2">
                    <p className="text-sm text-gray-600">No sections yet.</p>
                    <Button onClick={() => setOutlineOpen(true)}>
                        Generate Outline
                    </Button>
                </div>
            ) : (
                <ul className="flex-1 overflow-y-auto space-y-1 p-3">
                    {sections.map((sec) => (
                        <li key={sec.id}>
                            <div
                                className={
                                    "cursor-pointer rounded px-2 py-1 " +
                                    (sec.id === selectedSectionId
                                        ? "bg-blue-100"
                                        : "hover:bg-gray-100")
                                }
                                onClick={() => {
                                    // select section *and* clear any subsection
                                    setSelectedSectionId(sec.id)
                                    setSelectedSubsectionId(null)
                                }}
                            >
                                {sec.title}
                            </div>

                            {sec.id === selectedSectionId && sec.subsections.length > 0 && (
                                <ul className="pl-4 mt-1 space-y-1">
                                    {sec.subsections.map((sub) => (
                                        <li key={sub.id}>
                                            <div
                                                className={
                                                    "cursor-pointer rounded px-2 py-1 " +
                                                    (sub.id === selectedSubsectionId
                                                        ? "bg-blue-50"
                                                        : "hover:bg-gray-100")
                                                }
                                                onClick={() => setSelectedSubsectionId(sub.id)}
                                            >
                                                {sub.title}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </aside>
    )
}
