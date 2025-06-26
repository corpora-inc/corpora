// ts/commander/src/pages/ProjectEditorPage.tsx
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    useCorporaCommanderApiProjectGetProject,
    useCorporaCommanderApiSectionListSections,
} from "@/api/commander/commander"

import { useProjectStore } from "@/stores/ProjectStore"
import { OutlinePanel } from "@/components/OutlinePanel"
import { GenerateOutlineDialog } from "@/components/GenerateOutlineDialog"
import { GenerateDraftDialog } from "@/components/GenerateDraftDialog"
import { ExportPdfButton } from "@/components/ExportPdfButton"
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
    const project = useProjectStore((s) => s.project)
    const setProject = useProjectStore((s) => s.setProject)
    const sections = useProjectStore((s) => s.sections)
    const setSections = useProjectStore((s) => s.setSections)

    // editor UI state
    const selectedSectionId = useProjectStore((s) => s.selectedSectionId)
    const selectedSubsectionId = useProjectStore((s) => s.selectedSubsectionId)
    const setSelectedSectionId = useProjectStore((s) => s.setSelectedSectionId)
    const setSelectedSubsectionId = useProjectStore(
        (s) => s.setSelectedSubsectionId
    )

    // outline/draft modals
    const [isOutlineOpen, setIsOutlineOpen] = useState(false)
    const [isDraftOpen, setIsDraftOpen] = useState(false)

    // hydrate store from API
    useEffect(() => {
        if (projectQuery.data) setProject(projectQuery.data.data)
    }, [projectQuery.data, setProject])
    useEffect(() => {
        if (sectionsQuery.data) setSections(sectionsQuery.data.data)
    }, [sectionsQuery.data, setSections])

    if (!id) {
        return <p className="p-4 text-red-600">No project ID provided.</p>
    }
    if (projectQuery.isLoading || sectionsQuery.isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="animate-spin h-6 w-6 text-gray-500" />
            </div>
        )
    }
    if (projectQuery.isError) {
        return (
            <p className="p-4 text-red-600">
                Error loading project: {projectQuery.error?.message}
            </p>
        )
    }
    if (sectionsQuery.isError) {
        return (
            <p className="p-4 text-red-600">
                Error loading sections: {sectionsQuery.error?.message}
            </p>
        )
    }

    // pick our editor pane
    let editorPane
    if (selectedSubsectionId) {
        editorPane = (
            <SubsectionEditor
                subsectionId={selectedSubsectionId}
                onBack={() => setSelectedSubsectionId(null)}
            />
        )
    } else if (selectedSectionId) {
        editorPane = (
            <SectionEditor
                sectionId={selectedSectionId}
                onBack={() => setSelectedSectionId(null)}
            />
        )
    } else {
        // pass the string-ID, not project!.id
        editorPane = <ProjectMetadataEditor projectId={id!} />
    }

    return (
        <>
            <div className="flex h-full">
                <OutlinePanel onGenerateOutline={() => setIsOutlineOpen(true)} />

                <main className="flex-1 flex flex-col h-full overflow-hidden">
                    {/* ─── HEADER ─── */}
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
                            <Button onClick={() => setIsOutlineOpen(true)}>Outline</Button>
                            {sections.length > 0 && (
                                <ExportPdfButton projectId={id!} />
                            )}
                        </div>
                    </div>

                    {/* ─── EDITOR PANE ─── */}
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
