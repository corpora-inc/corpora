// ts/commander/src/components/ProjectMetadataEditor.tsx
import { useProjectStore } from "@/stores/ProjectStore"
export function ProjectMetadataEditor({ projectId }: { projectId: string }) {
    const project = useProjectStore(s => s.project)
    return (
        <div>
            <h2 className="text-xl font-semibold">Project Settings</h2>
            {/* wire up a form to edit title, subtitle, metadata… */}
            <p className="mt-4 text-gray-600">Here you can edit your project-wide fields.</p>
            {/* … */}
        </div>
    )
}
