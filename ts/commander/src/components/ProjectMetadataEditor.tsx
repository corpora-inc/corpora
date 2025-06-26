// ts/commander/src/components/ProjectMetadataEditor.tsx

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import {
    useCorporaCommanderApiProjectGetProject,
    useCorporaCommanderApiProjectUpdateProject,
} from "@/api/commander/commander"
import { ProjectForm, type ProjectFields } from "./ProjectForm"
import { useProjectStore } from "@/stores/ProjectStore"

export function ProjectMetadataEditor({ projectId }: { projectId: string }) {
    const setProject = useProjectStore((s) => s.setProject)
    const projQ = useCorporaCommanderApiProjectGetProject(projectId)
    const updateProject = useCorporaCommanderApiProjectUpdateProject()

    const [values, setValues] = useState<ProjectFields | null>(null)

    // seed local form state once
    useEffect(() => {
        if (projQ.data && values === null) {
            const p = projQ.data.data
            setValues({
                title: p.title,
                subtitle: p.subtitle ?? "",
                purpose: p.purpose ?? "",
                instructions: p.instructions ?? "",
                voice: p.voice ?? "",
                has_images: p.has_images || false,
                author: p.author ?? "",
                publisher: p.publisher ?? "",
                isbn: p.isbn ?? "",
                language: p.language ?? "",
                publication_date: p.publication_date ?? "",
            })
        }
    }, [projQ.data])

    if (projQ.isLoading || values === null) {
        return <Loader2 className="animate-spin" />
    }
    if (projQ.isError) {
        return <p className="text-red-600">{projQ.error!.message}</p>
    }

    const handleChange = (patch: Partial<ProjectFields>) => {
        setValues((v) => ({ ...v!, ...patch }))
    }

    const handleSubmit = () => {
        updateProject.mutate(
            {
                projectId,
                data: {
                    title: values!.title,
                    subtitle: values!.subtitle || undefined,
                    purpose: values!.purpose || undefined,
                    instructions: values!.instructions || undefined,
                    voice: values!.voice || undefined,
                    has_images: values!.has_images,
                    author: values!.author || undefined,
                    publisher: values!.publisher || undefined,
                    isbn: values!.isbn || undefined,
                    language: values!.language || undefined,
                    publication_date: values!.publication_date || undefined,
                },
            },
            {
                onSuccess(res) {
                    setProject(res.data)
                },
            }
        )
    }

    return (
        <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Project Settings</h2>
            <ProjectForm
                values={values!}
                onChange={handleChange}
                onSubmit={handleSubmit}
                submitLabel={updateProject.isPending ? "Saving…" : "Save Changes"}
                submitDisabled={updateProject.isPending}
            />
            {updateProject.isError && (
                <p className="mt-4 text-red-600">{updateProject.error!.message}</p>
            )}
        </div>
    )
}
