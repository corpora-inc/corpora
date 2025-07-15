// ts/commander/src/pages/ProjectEditorPage.tsx
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
// import { Button } from "@/components/ui/button"
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
import { GenerateRewriteDialog } from "@/components/GenerateRewriteDialog"
import ImageDrawer from "@/components/ImageDrawer"

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
    const selectedSectionId = useProjectStore((s) => s.selectedSectionId)
    const selectedSubsectionId = useProjectStore((s) => s.selectedSubsectionId)
    const isOutlineOpen = useProjectStore((s) => s.isOutlineOpen)
    const isDraftOpen = useProjectStore((s) => s.isDraftOpen)
    const isRewriteOpen = useProjectStore((s) => s.isRewriteOpen)
    const setOutlineOpen = useProjectStore((s) => s.setOutlineOpen)
    const setDraftOpen = useProjectStore((s) => s.setDraftOpen)
    const setRewriteOpen = useProjectStore((s) => s.setRewriteOpen)

    // mobile drawer state
    const [mobileOutlineOpen, setMobileOutlineOpen] = useState(false)

    useEffect(() => {
        // close the mobile outline when the selected section or subsection changes
        if (selectedSectionId || selectedSubsectionId) {
            setMobileOutlineOpen(false)
        }
    }, [selectedSectionId, selectedSubsectionId])

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

    // choose editor pane
    let editorPane
    if (selectedSubsectionId) {
        editorPane = (
            <SubsectionEditor
                subsectionId={selectedSubsectionId}
                onBack={() =>
                    useProjectStore.getState().setSelectedSubsectionId(null)
                }
            />
        )
    } else if (selectedSectionId) {
        editorPane = (
            <SectionEditor
                sectionId={selectedSectionId}
                onBack={() =>
                    useProjectStore.getState().setSelectedSectionId(null)
                }
            />
        )
    } else {
        editorPane = <ProjectMetadataEditor projectId={id!} />
    }

    return (
        <>
            <div className="flex h-full">
                {/* Desktop outline sidebar */}
                <div className="hidden md:flex">
                    <OutlinePanel />
                </div>

                {/* Mobile outline drawer */}
                {mobileOutlineOpen && (
                    <div className="fixed inset-0 z-50 bg-white">
                        <div className="h-full overflow-auto">
                            <OutlinePanel />
                        </div>
                    </div>
                )}

                <main className="flex-1 flex flex-col h-full overflow-hidden">
                    <TopBar onToggleOutlinePanel={() => setMobileOutlineOpen(true)} />

                    <div className="flex-1 overflow-auto p-6">
                        {editorPane}
                    </div>
                </main>
            </div>

            <GenerateOutlineDialog
                open={isOutlineOpen}
                onClose={() => {
                    setOutlineOpen(false)
                    // invalidate the sections query to refresh the outline
                    sectionsQuery.refetch()
                }}
            />
            <GenerateDraftDialog
                open={isDraftOpen}
                onClose={() => {
                    setDraftOpen(false)
                    // invalidate the sections query to refresh the draft
                    sectionsQuery.refetch()
                }}
            />
            <GenerateRewriteDialog
                open={isRewriteOpen}
                onClose={() => {
                    setRewriteOpen(false)
                    // invalidate the sections query to refresh the rewrite
                    sectionsQuery.refetch()
                }}
            />
            <ImageDrawer projectId={id!} />
        </>
    )
}
