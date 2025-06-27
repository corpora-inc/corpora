import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { useProjectStore } from "@/stores/ProjectStore"
import { ExportPdfButton } from "@/components/ExportPdfButton"

export interface TopBarProps {
    /** Show mobile outline drawer */
    onToggleOutlinePanel?: () => void
}

export function TopBar({ onToggleOutlinePanel }: TopBarProps) {
    const project = useProjectStore((s) => s.project)
    const sections = useProjectStore((s) => s.sections)
    const setOutlineOpen = useProjectStore((s) => s.setOutlineOpen)
    const setDraftOpen = useProjectStore((s) => s.setDraftOpen)

    if (!project) return null

    return (
        <div className="border-b p-6 flex items-center justify-between">
            {/* Left: mobile burger + back + title */}
            <div className="flex items-center space-x-4">
                {onToggleOutlinePanel && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleOutlinePanel}
                        className="md:hidden"
                        aria-label="Open outline"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                )}
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

            {/* Right: action buttons */}
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
