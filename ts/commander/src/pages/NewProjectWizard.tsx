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

    const handleSaveAndContinue = async () => {
        const payload = {
            ...formValues,
            publication_date: formValues.publication_date?.trim()
                ? formValues.publication_date
                : undefined,
        }
        const res = await createProject.mutateAsync({ data: payload })
        navigate(`/project/${res.data.id}`)
    }

    const handleSaveAndAnother = async () => {
        const payload = {
            ...formValues,
            publication_date: formValues.publication_date?.trim()
                ? formValues.publication_date
                : undefined,
        }
        await createProject.mutateAsync({ data: payload })
        // keep metadata, only clear title
        setFormValues((v) => ({ ...v, title: "" }))
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-semibold mb-6">Create New Project</h1>

            <ProjectForm
                values={formValues}
                onChange={(patch) => setFormValues((v) => ({ ...v, ...patch }))}
                submitLabel={isPending ? "Saving…" : "Save & Continue"}
                submitDisabled={isPending}
                onSubmit={handleSaveAndContinue}
                onCancel={() => navigate(-1)}
                secondaryAction={{
                    label: isPending ? "Saving & Another…" : "Save & Create Another",
                    action: handleSaveAndAnother,
                    disabled: isPending,
                }}
            />

            {isError && (
                <p className="mt-4 text-red-600">{errorMessage}</p>
            )}
        </div>
    )
}
