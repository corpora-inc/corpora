import type { FC } from "react"
import { Button } from "@/components/ui/button"
import { useProjectStore } from "@/stores/ProjectStore"

interface OutlinePanelProps {
    onGenerateOutline: () => void
}

export const OutlinePanel: FC<OutlinePanelProps> = ({
    onGenerateOutline,
}) => {
    const sections = useProjectStore((s) => s.sections)
    const selectedSectionId = useProjectStore((s) => s.selectedSectionId)
    const selectedSubsectionId = useProjectStore((s) => s.selectedSubsectionId)
    const setSelectedSectionId = useProjectStore((s) => s.setSelectedSectionId)
    const setSelectedSubsectionId = useProjectStore(
        (s) => s.setSelectedSubsectionId
    )

    // no sections yet
    if (sections.length === 0) {
        return (
            <aside className="w-64 border-r p-4 hidden md:block">
                <h2 className="mb-4 text-lg font-semibold">Outline</h2>
                <div className="space-y-2">
                    <p className="text-sm text-gray-600">No sections yet.</p>
                    <Button onClick={onGenerateOutline}>Generate Outline</Button>
                </div>
            </aside>
        )
    }

    return (

        <aside
            className="
            hidden md:block
            w-64 border-r p-4
            h-full             /* full height of flex parent */
            overflow-auto      /* scroll contents internally */
            flex flex-col      /* ensure contents stack vertically */
            "
        >
            <h2 className="mb-4 text-lg font-semibold">Outline</h2>
            <ul className="space-y-1">
                {sections.map((sec) => {
                    const isOpen = sec.id === selectedSectionId
                    return (
                        <li key={sec.id}>
                            <button
                                className={`w-full text-left rounded px-2 py-1 ${isOpen ? "bg-blue-100" : "hover:bg-gray-100"
                                    }`}
                                onClick={() => setSelectedSectionId(sec.id)}
                            >
                                {sec.title}
                            </button>

                            {isOpen && sec.subsections.length > 0 && (
                                <ul className="ml-4 mt-1 space-y-1">
                                    {sec.subsections.map((sub) => (
                                        <li key={sub.id}>
                                            <button
                                                className={`w-full text-left rounded px-2 py-1 ${sub.id === selectedSubsectionId
                                                    ? "bg-blue-200"
                                                    : "hover:bg-gray-100"
                                                    }`}
                                                onClick={() => setSelectedSubsectionId(sub.id)}
                                            >
                                                {sub.title}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    )
                })}
            </ul>
        </aside>
    )
}
