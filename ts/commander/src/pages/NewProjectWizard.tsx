// ts/commander/src/pages/NewProjectWizard.tsx
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useCorporaCommanderApiProjectCreateProject } from "@/api/commander/commander"
import { ProjectForm, type ProjectFields } from "@/components/ProjectForm"

export default function NewProjectWizard() {
    const navigate = useNavigate()
    const createProject = useCorporaCommanderApiProjectCreateProject()

    const [formValues, setFormValues] = useState<ProjectFields>({
        title: "",
        subtitle: "",
        purpose: "",
        instructions: "",
        voice: "",
        has_images: false,
        author: "",
        publisher: "",
        isbn: "",
        language: "en-US",
        publication_date: "",
    })

    const isPending = createProject.isPending
    const isError = createProject.isError
    const errorMessage = (createProject.error as Error | null)?.message ?? null

    const handleSubmit = async () => {
        const res = await createProject.mutateAsync({
            data: formValues,
        })
        navigate(`/project/${res.data.id}`)
    }

    return (
        <div className="p-6 max-w-xl mx-auto">
            <h1 className="text-2xl font-semibold mb-6">Create New Project</h1>

            <ProjectForm
                values={formValues}
                onChange={(patch) => setFormValues((v) => ({ ...v, ...patch }))}
                submitLabel={isPending ? "Creating…" : "Create Project"}
                onCancel={() => navigate(-1)}
                onSubmit={handleSubmit}
            />

            {isError && errorMessage && (
                <p className="mt-4 text-red-600">{errorMessage}</p>
            )}
        </div>
    )
}
