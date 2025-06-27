import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useProjectStore } from "@/stores/ProjectStore"
import { ExportPdfButton } from "@/components/ExportPdfButton"

export function TopBar() {
    const project = useProjectStore((s) => s.project)
    const sections = useProjectStore((s) => s.sections)
    const setOutlineOpen = useProjectStore((s) => s.setOutlineOpen)
    const setDraftOpen = useProjectStore((s) => s.setDraftOpen)

    if (!project) return null

    return (
        <div className="border-b p-6 flex items-center justify-between">
            {/* back + title */}
            <div className="flex items-center space-x-4">
                <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    aria-label="Back to projects"
                >
                    <Link to="/projects">←</Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{project.title}</h1>
                    {project.subtitle && (
                        <p className="mt-1 text-gray-600">{project.subtitle}</p>
                    )}
                </div>
            </div>

            {/* actions */}
            <div className="space-x-2">
                {sections.length > 0 && (
                    <Button onClick={() => setDraftOpen(true)}>Draft book</Button>
                )}
                <Button onClick={() => setOutlineOpen(true)}>Outline</Button>
                {sections.length > 0 && (
                    <ExportPdfButton projectId={project.id} />
                )}
            </div>
        </div>
    )
}
