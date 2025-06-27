import type { FC } from "react"
import { Button } from "@/components/ui/button"

interface Sub {
    id: string
    title: string
}

interface Section {
    id: string
    title: string
    subsections: Sub[]
}

interface OutlinePanelProps {
    sections: Section[]
    selectedSectionId: string | null
    selectedSubsectionId: string | null
    onSelectSection: (id: string) => void
    onSelectSubsection: (id: string) => void
    onGenerateOutline: () => void
}

export const OutlinePanel: FC<OutlinePanelProps> = ({
    sections,
    selectedSectionId,
    selectedSubsectionId,
    onSelectSection,
    onSelectSubsection,
    onGenerateOutline,
}) => {
    return (
        <div className="h-full flex flex-col">
            <h2 className="mb-4 text-lg font-semibold">Outline</h2>

            {sections.length === 0 ? (
                <div className="space-y-2">
                    <p className="text-sm text-gray-600">No sections yet.</p>
                    <Button onClick={onGenerateOutline}>Generate Outline</Button>
                </div>
            ) : (
                <ul className="space-y-1 flex-1 overflow-y-auto">
                    {sections.map((sec) => (
                        <li key={sec.id}>
                            <div
                                className={`cursor-pointer rounded px-2 py-1 ${sec.id === selectedSectionId
                                        ? "bg-blue-100"
                                        : "hover:bg-gray-100"
                                    }`}
                                onClick={() => onSelectSection(sec.id)}
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
                                            onClick={() => onSelectSubsection(sub.id)}
                                        >
                                            {sub.title}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
