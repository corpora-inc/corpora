import { useEffect } from "react"
import { useParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import {
    useCorporaCommanderApiProjectGetProject,
    useCorporaCommanderApiSectionListSections,
} from "@/api/commander/commander"

import { useProjectStore } from "@/stores/ProjectStore"
import { OutlinePanel } from "@/components/OutlinePanel"
import { GenerateOutlineDialog } from "@/components/GenerateOutlineDialog"
import { GenerateDraftDialog } from "@/components/GenerateDraftDialog"
import { ProjectMetadataEditor } from "@/components/ProjectMetadataEditor"
import { SectionEditor } from "@/components/SectionEditor"
import { SubsectionEditor } from "@/components/SubsectionEditor"
import { TopBar } from "@/components/TopBar"

export default function ProjectEditorPage() {
    const { id } = useParams<{ id: string }>()
    const projectQuery = useCorporaCommanderApiProjectGetProject(id!, {
        query: { enabled: !!id },
    })
    const sectionsQuery = useCorporaCommanderApiSectionListSections(id!, {
        query: { enabled: !!id },
    })

    // hydrate store
    const setProject = useProjectStore((s) => s.setProject)
    const setSections = useProjectStore((s) => s.setSections)

    useEffect(() => {
        if (projectQuery.data) setProject(projectQuery.data.data)
    }, [projectQuery.data, setProject])

    useEffect(() => {
        if (sectionsQuery.data) setSections(sectionsQuery.data.data)
    }, [sectionsQuery.data, setSections])

    // selectors
    // const project = useProjectStore((s) => s.project)
    const selectedSectionId = useProjectStore((s) => s.selectedSectionId)
    const selectedSubsectionId = useProjectStore((s) => s.selectedSubsectionId)
    const isOutlineOpen = useProjectStore((s) => s.isOutlineOpen)
    const isDraftOpen = useProjectStore((s) => s.isDraftOpen)
    const setOutlineOpen = useProjectStore((s) => s.setOutlineOpen)
    const setDraftOpen = useProjectStore((s) => s.setDraftOpen)

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

    // pick pane
    let editorPane
    if (selectedSubsectionId) {
        editorPane = (
            <SubsectionEditor
                subsectionId={selectedSubsectionId}
                onBack={() => useProjectStore.getState().setSelectedSubsectionId(null)}
            />
        )
    } else if (selectedSectionId) {
        editorPane = (
            <SectionEditor
                sectionId={selectedSectionId}
                onBack={() => useProjectStore.getState().setSelectedSectionId(null)}
            />
        )
    } else {
        editorPane = <ProjectMetadataEditor projectId={id!} />
    }

    return (
        <>
            <div className="flex h-full">
                <OutlinePanel />

                <main className="flex-1 flex flex-col h-full overflow-hidden">
                    <TopBar />

                    {/* editor */}
                    <div className="flex-1 overflow-auto p-6">
                        {editorPane}
                    </div>
                </main>
            </div>

            <GenerateOutlineDialog
                open={isOutlineOpen}
                onClose={() => setOutlineOpen(false)}
            />
            <GenerateDraftDialog
                open={isDraftOpen}
                onClose={() => setDraftOpen(false)}
            />
        </>
    )
}
