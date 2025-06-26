// ts/commander/src/components/ProjectMetadataEditor.tsx
import { ProjectForm, type ProjectFields } from "@/components/ProjectForm"
import { useProjectStore } from "@/stores/ProjectStore"
import { useCorporaCommanderApiProjectUpdateProject } from "@/api/commander/commander"


export function ProjectMetadataEditor({ projectId }: { projectId: string }) {
    // global project state
    const project = useProjectStore((s) => s.project)!
    const patchProject = useProjectStore((s) => s.patchProject)
    const setProject = useProjectStore((s) => s.setProject)

    // update mutation
    const update = useCorporaCommanderApiProjectUpdateProject()

    const isPending = update.isPending
    const isError = update.isError
    const errorMessage = (update.error as Error | null)?.message ?? null

    const handleSubmit = async () => {
        const res = await update.mutateAsync({
            projectId,
            data: project as unknown as Parameters<typeof update.mutateAsync>[0]["data"],
        })
        setProject(res.data)
    }

    if (!project) return null

    return (
        <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Project Settings</h2>

            <ProjectForm
                values={project as ProjectFields}
                onChange={(patch) => patchProject(patch)}
                onSubmit={handleSubmit}
                submitLabel={isPending ? "Saving…" : "Save Changes"}
                submitDisabled={isPending}
            />

            {isError && errorMessage && (
                <p className="mt-4 text-red-600">{errorMessage}</p>
            )}
        </div>
    )
}
