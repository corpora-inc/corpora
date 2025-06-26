// ts/commander/src/components/OutlinePanel.tsx
import { Button } from "@/components/ui/button"
import { useProjectStore } from "@/stores/ProjectStore"

export function OutlinePanel({
    onGenerateOutline,
}: {
    onGenerateOutline: () => void
}) {
    const sections = useProjectStore((s) => s.sections)
    const selectedSectionId = useProjectStore((s) => s.selectedSectionId)
    const selectedSubsectionId = useProjectStore((s) => s.selectedSubsectionId)
    const setSelectedSectionId = useProjectStore((s) => s.setSelectedSectionId)
    const setSelectedSubsectionId = useProjectStore(
        (s) => s.setSelectedSubsectionId
    )

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
        <aside className="w-64 border-r p-4 hidden md:block overflow-y-auto">
            <h2 className="mb-4 text-lg font-semibold">Outline</h2>
            <ul className="space-y-1">
                {sections.map((sec) => (
                    <li key={sec.id}>
                        <div
                            className={`cursor-pointer rounded px-2 py-1 ${sec.id === selectedSectionId
                                    ? "bg-blue-100"
                                    : "hover:bg-gray-100"
                                }`}
                            onClick={() => {
                                setSelectedSectionId(sec.id)
                                setSelectedSubsectionId(null)
                            }}
                        >
                            {sec.title}
                        </div>

                        {sec.id === selectedSectionId && sec.subsections.length > 0 && (
                            <ul className="pl-4 mt-1 space-y-1">
                                {sec.subsections.map((sub) => (
                                    <li
                                        key={sub.id}
                                        className={`cursor-pointer rounded px-2 py-1 ${sub.id === selectedSubsectionId
                                                ? "bg-blue-50"
                                                : "hover:bg-gray-100"
                                            }`}
                                        onClick={() => setSelectedSubsectionId(sub.id)}
                                    >
                                        {sub.title}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                ))}
            </ul>
        </aside>
    )
}
