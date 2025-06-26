// ts/commander/src/pages/ProjectEditorPage.tsx

import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    useCorporaCommanderApiProjectGetProject,
    useCorporaCommanderApiSectionListSections,
} from "@/api/commander/commander"
import { GenerateOutlineDialog } from "@/components/GenerateOutlineDialog"
import { GenerateDraftDialog } from "@/components/GenerateDraftDialog"
import { ExportPdfButton } from "@/components/ExportPdfButton"
import { useProjectStore } from "@/stores/ProjectStore"

// these editors render into the scrollable area below
import { ProjectMetadataEditor } from "@/components/ProjectMetadataEditor"
import { SectionEditor } from "@/components/SectionEditor"
import { SubsectionEditor } from "@/components/SubsectionEditor"

export default function ProjectEditorPage() {
    const { id } = useParams<{ id: string }>()
    const projectQuery = useCorporaCommanderApiProjectGetProject(id!, {
        query: { enabled: !!id },
    })
    const sectionsQuery = useCorporaCommanderApiSectionListSections(id!, {
        query: { enabled: !!id },
    })

    // global store
    const setProject = useProjectStore((s) => s.setProject)
    const setSections = useProjectStore((s) => s.setSections)
    const project = useProjectStore((s) => s.project)
    const sections = useProjectStore((s) => s.sections)

    // UI state
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
    const [selectedSubsectionId, setSelectedSubsectionId] = useState<string | null>(null)
    const [isOutlineOpen, setIsOutlineOpen] = useState(false)
    const [isDraftOpen, setIsDraftOpen] = useState(false)

    // hydrate
    useEffect(() => {
        if (projectQuery.data) setProject(projectQuery.data.data)
    }, [projectQuery.data, setProject])
    useEffect(() => {
        if (sectionsQuery.data) setSections(sectionsQuery.data.data)
    }, [sectionsQuery.data, setSections])

    if (!id)
        return <p className="p-4 text-red-600">No project ID provided.</p>
    if (projectQuery.isLoading || sectionsQuery.isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="animate-spin h-6 w-6 text-gray-500" />
            </div>
        )
    }
    if (projectQuery.isError)
        return (
            <p className="p-4 text-red-600">
                Error loading project: {projectQuery.error?.message}
            </p>
        )
    if (sectionsQuery.isError)
        return (
            <p className="p-4 text-red-600">
                Error loading sections: {sectionsQuery.error?.message}
            </p>
        )

    // clear subsection when changing section
    const onSelectSection = (secId: string) => {
        setSelectedSectionId(secId)
        setSelectedSubsectionId(null)
    }
    const onSelectSubsection = (subId: string) => setSelectedSubsectionId(subId)

    // pick which pane to show
    let editorPane
    if (selectedSubsectionId && selectedSectionId) {
        editorPane = (
            <SubsectionEditor
                // sectionId={selectedSectionId}
                subsectionId={selectedSubsectionId}
                onBack={() => setSelectedSubsectionId(null)}
            />
        )
    } else if (selectedSectionId) {
        editorPane = (
            <SectionEditor
                sectionId={selectedSectionId}
                onBack={() => setSelectedSectionId(null)}
                onPickSub={onSelectSubsection}
            />
        )
    } else {
        editorPane = <ProjectMetadataEditor projectId={project!.id} />
    }

    return (
        <>
            <div className="flex h-full">
                <aside className="w-64 border-r p-4 hidden md:block">
                    <h2 className="mb-4 text-lg font-semibold">Outline</h2>
                    {sections.length === 0 ? (
                        <div className="space-y-2">
                            <p className="text-sm text-gray-600">
                                No sections yet.
                            </p>
                            <Button onClick={() => setIsOutlineOpen(true)}>
                                Generate Outline
                            </Button>
                        </div>
                    ) : (
                        <ul className="space-y-1">
                            {sections.map((sec) => (
                                <li
                                    key={sec.id}
                                    className={`cursor-pointer rounded px-2 py-1 ${sec.id === selectedSectionId
                                        ? "bg-blue-100"
                                        : "hover:bg-gray-100"
                                        }`}
                                    onClick={() => onSelectSection(sec.id)}
                                >
                                    {sec.title}
                                </li>
                            ))}
                        </ul>
                    )}

                    {project?.has_images && (
                        <div className="mt-6">
                            <h3 className="mb-2 text-sm font-medium">Images</h3>
                            {/* <ImageDrawer projectId={project.id} /> */}
                        </div>
                    )}
                </aside>

                {/* ─── MAIN ──────────────────────────────────────────────────────────── */}
                <main className="flex-1 flex flex-col h-full overflow-hidden">
                    {/* HEADER */}
                    <div className="border-b p-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">{project?.title}</h1>
                            {project?.subtitle && (
                                <p className="mt-1 text-gray-600">{project.subtitle}</p>
                            )}
                        </div>
                        <div className="space-x-2">
                            {sections.length > 0 && (
                                <Button onClick={() => setIsDraftOpen(true)}>
                                    Draft book
                                </Button>
                            )}
                            <Button onClick={() => setIsOutlineOpen(true)}>
                                Outline
                            </Button>
                            {sections.length > 0 && (
                                <ExportPdfButton projectId={project!.id} />
                            )}
                        </div>
                    </div>

                    {/* SCROLLABLE EDITOR AREA */}
                    <div className="flex-1 overflow-auto p-6">{editorPane}</div>
                </main>
            </div>

            <GenerateOutlineDialog
                open={isOutlineOpen}
                onClose={() => setIsOutlineOpen(false)}
            />
            <GenerateDraftDialog
                open={isDraftOpen}
                onClose={() => setIsDraftOpen(false)}
            />
        </>
    )
}
