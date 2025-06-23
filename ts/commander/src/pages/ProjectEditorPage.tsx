import { useState } from "react"
import { useParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    useCorporaCommanderApiProjectGetProject,
    useCorporaCommanderApiSectionListSections,
    useCorporaCommanderApiSectionCreateSection,
    useCorporaCommanderApiSubsectionCreateSubsection,
} from "@/api/commander/commander"
import { GenerateOutlineDialog } from "@/components/GenerateOutlineDialog"

import type { SectionOut } from "@/api/schemas/sectionOut"
import type { OutlineResponse } from "@/api/schemas/outlineResponse"

export default function ProjectEditorPage() {
    const { id } = useParams<{ id: string }>()
    const projectQuery = useCorporaCommanderApiProjectGetProject(
        id!, { query: { enabled: !!id } }
    )
    const sectionsQuery = useCorporaCommanderApiSectionListSections(
        id!, { query: { enabled: !!id } }
    )
    const createSection = useCorporaCommanderApiSectionCreateSection()
    const createSubsection = useCorporaCommanderApiSubsectionCreateSubsection()

    const [isOutlineOpen, setIsOutlineOpen] = useState(false)

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

    const project = projectQuery.data!.data
    const sections = sectionsQuery.data!.data!

    // Accept an outline: create all sections and subsections, then refresh
    const handleAcceptOutline = async (outline: OutlineResponse) => {
        for (const sec of outline.sections) {
            const secRes = await createSection.mutateAsync({
                projectId: id!,
                data: {
                    title: sec.title,
                    order: sec.order,
                    introduction: "",
                    instructions: sec.instructions,
                },
            })
            const createdSec = secRes.data
            for (const sub of sec.subsections) {
                await createSubsection.mutateAsync({
                    sectionId: createdSec.id,
                    data: {
                        title: sub.title,
                        order: sub.order,
                        content: "",
                        instructions: sub.instructions,
                    },
                })
            }
        }
        await sectionsQuery.refetch()
        setIsOutlineOpen(false)
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
                            {sections.map((sec: SectionOut) => (
                                <li
                                    key={sec.id}
                                    className="cursor-pointer rounded px-2 py-1 hover:bg-gray-100"
                                >
                                    {sec.title}
                                </li>
                            ))}
                        </ul>
                    )}

                    {project.has_images && (
                        <div className="mt-6">
                            <h3 className="mb-2 text-sm font-medium">Images</h3>
                            {/* <ImageDrawer projectId={project.id} /> */}
                        </div>
                    )}
                </aside>

                <main className="flex-1 overflow-y-auto p-6">
                    <header className="mb-6 border-b pb-4">
                        <h1 className="text-2xl font-bold">{project.title}</h1>
                        {project.subtitle && (
                            <p className="mt-1 text-gray-600">{project.subtitle}</p>
                        )}
                    </header>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Draft content
                        </label>
                        <textarea
                            className="mt-1 w-full rounded border p-2 min-h-[300px] text-sm"
                            placeholder="Start writing or use the outline…"
                            disabled
                        />
                    </div>
                </main>
            </div>

            <GenerateOutlineDialog
                open={isOutlineOpen}
                onClose={() => setIsOutlineOpen(false)}
                projectMeta={{
                    id,
                    title: project.title,
                    subtitle: project.subtitle,
                    purpose: project.purpose,
                    has_images: project.has_images,
                    instructions: project.instructions,
                    voice: project.voice,

                }}
                onAccept={handleAcceptOutline}
            />
        </>
    )
}
