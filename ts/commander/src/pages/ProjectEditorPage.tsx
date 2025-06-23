// src/pages/ProjectEditorPage.tsx
import { useState } from "react"
import { useParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import {
    useCorporaCommanderApiProjectGetProject,
} from "@/api/commander/commander"
import { Button } from "@/components/ui/button"

export default function ProjectEditorPage() {
    const { id } = useParams<{ id: string }>()

    const projectQuery = useCorporaCommanderApiProjectGetProject(
        id!, // now a string UUID
        { query: { enabled: !!id } }
    )

    const [sections, setSections] = useState<
        Array<{ id: string; title: string }>
    >([])

    if (!id) {
        return <p className="p-4 text-red-600">No project ID provided.</p>
    }

    if (projectQuery.isLoading) {
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

    // the hook returns AxiosResponse<ProjectOut>[] shape under `.data`
    const project = projectQuery.data!.data

    return (
        <div className="flex h-full">
            {/* Sidebar */}
            <aside className="hidden w-64 border-r p-4 md:block">
                <h2 className="mb-4 text-lg font-semibold">Outline</h2>

                {sections.length === 0 ? (
                    <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                            You haven’t created any sections yet.
                        </p>
                        <Button
                            onClick={() => {
                                // TODO: wire up your “generate outline” flow
                                alert("Generate outline with AI…")
                            }}
                        >
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

                {project.has_images && (
                    <div className="mt-6">
                        <h3 className="mb-2 text-sm font-medium">Images</h3>
                        {/* <ImageDrawer projectId={project.id} /> */}
                    </div>
                )}
            </aside>

            {/* Main editor area */}
            <main className="flex-1 overflow-y-auto p-6">
                <header className="mb-6 border-b pb-4">
                    <h1 className="text-2xl font-bold">{project.title}</h1>
                    {project.subtitle && (
                        <p className="mt-1 text-gray-600">{project.subtitle}</p>
                    )}
                </header>

                {/* TODO: dynamic command/edit area? */}
            </main>
        </div>
    )
}
