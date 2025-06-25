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

export default function ProjectEditorPage() {
    const { id } = useParams<{ id: string }>()
    const projectQuery = useCorporaCommanderApiProjectGetProject(id!, {
        query: { enabled: !!id },
    })
    const sectionsQuery = useCorporaCommanderApiSectionListSections(id!, {
        query: { enabled: !!id },
    })

    const setProject = useProjectStore((s) => s.setProject)
    const setSections = useProjectStore((s) => s.setSections)
    const project = useProjectStore((s) => s.project)
    const sections = useProjectStore((s) => s.sections)

    const [isOutlineOpen, setIsOutlineOpen] = useState(false)
    const [isDraftOpen, setIsDraftOpen] = useState(false)

    // Sync query results to global store
    useEffect(() => {
        if (projectQuery.data) {
            setProject(projectQuery.data.data)
        }
    }, [projectQuery.data, setProject])

    useEffect(() => {
        if (sectionsQuery.data) {
            setSections(sectionsQuery.data.data)
        }
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

    return (
        <>
            <div className="flex h-full">
                <aside className="hidden w-64 border-r p-4 md:block">
                    <h2 className="mb-4 text-lg font-semibold">Outline</h2>
                    {sections.length === 0 ? (
                        <div className="space-y-2">
                            <p className="text-sm text-gray-600">
                                You haven't created any sections yet.
                            </p>
                            <Button onClick={() => setIsOutlineOpen(true)}>
                                Generate outline
                            </Button>
                        </div>
                    ) : (
                        <ul className="space-y-1">
                            {sections.map((sec) => (
                                <li
                                    key={sec.id}
                                    className="cursor-pointer rounded px-2 py-1 hover:bg-gray-100"
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

                <main className="flex-1 overflow-y-auto p-6">
                    <header className="mb-6 border-b pb-4 flex items-center justify-between">
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
                            {sections.length > 0 && <ExportPdfButton />}
                        </div>
                    </header>

                    {/* Section editor, etc. */}
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
