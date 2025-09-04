// ts/commander/src/components/OutlinePanel.tsx
import type { FC } from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useProjectStore } from "@/stores/ProjectStore"
import { useQueryClient } from "@tanstack/react-query"
import {
    useCorporaCommanderApiSectionUpdateSection,
    useCorporaCommanderApiSubsectionUpdateSubsection,
    getCorporaCommanderApiSectionListSectionsQueryKey,
} from "@/api/commander/commander"


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

    // editing state
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
    const [editingSubsectionId, setEditingSubsectionId] = useState<string | null>(null)
    const [tempTitle, setTempTitle] = useState("")

    // hooks
    const queryClient = useQueryClient()
    const updateSection = useCorporaCommanderApiSectionUpdateSection()
    const updateSubsection = useCorporaCommanderApiSubsectionUpdateSubsection()
    const project = useProjectStore((s) => s.project)

    // handlers
    const startEditingSection = (sectionId: string, currentTitle: string) => {
        setEditingSectionId(sectionId)
        setTempTitle(currentTitle)
    }

    const startEditingSubsection = (subsectionId: string, currentTitle: string) => {
        setEditingSubsectionId(subsectionId)
        setTempTitle(currentTitle)
    }

    const saveSectionTitle = () => {
        if (editingSectionId && project) {
            updateSection.mutate(
                {
                    sectionId: editingSectionId,
                    data: { title: tempTitle },
                },
                {
                    onSuccess: () => {
                        queryClient.invalidateQueries({
                            queryKey: getCorporaCommanderApiSectionListSectionsQueryKey(project.id),
                        })
                        setEditingSectionId(null)
                        setTempTitle("")
                    },
                }
            )
        }
    }

    const saveSubsectionTitle = () => {
        if (editingSubsectionId) {
            updateSubsection.mutate(
                {
                    subsectionId: editingSubsectionId,
                    data: { title: tempTitle },
                },
                {
                    onSuccess: () => {
                        if (project) {
                            queryClient.invalidateQueries({
                                queryKey: getCorporaCommanderApiSectionListSectionsQueryKey(project.id),
                            })
                        }
                        setEditingSubsectionId(null)
                        setTempTitle("")
                    },
                }
            )
        }
    }

    const cancelEdit = () => {
        setEditingSectionId(null)
        setEditingSubsectionId(null)
        setTempTitle("")
    }

    return (
        // <aside className="w-64 border-r p-4 hidden md:flex flex-col h-full">
        <aside className="w-full md:w-64 md:border-r flex flex-col h-full">
            {sections.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
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
                                    if (editingSectionId === sec.id) return
                                    // select section *and* clear any subsection
                                    setSelectedSectionId(sec.id)
                                    setSelectedSubsectionId(null)
                                }}
                                onDoubleClick={() => startEditingSection(sec.id, sec.title)}
                            >
                                {editingSectionId === sec.id ? (
                                    <Input
                                        value={tempTitle}
                                        onChange={(e) => setTempTitle(e.target.value)}
                                        onBlur={saveSectionTitle}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") saveSectionTitle()
                                            if (e.key === "Escape") cancelEdit()
                                        }}
                                        className=" px-1 text-sm"
                                        autoFocus
                                    />
                                ) : (
                                    sec.title
                                )}
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
                                                onClick={() => {
                                                    if (editingSubsectionId === sub.id) return
                                                    setSelectedSubsectionId(sub.id)
                                                }}
                                                onDoubleClick={() => startEditingSubsection(sub.id, sub.title)}
                                            >
                                                {editingSubsectionId === sub.id ? (
                                                    <Input
                                                        value={tempTitle}
                                                        onChange={(e) => setTempTitle(e.target.value)}
                                                        onBlur={saveSubsectionTitle}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") saveSubsectionTitle()
                                                            if (e.key === "Escape") cancelEdit()
                                                        }}
                                                        className="px-1  text-sm ml-4"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    sub.title
                                                )}
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
