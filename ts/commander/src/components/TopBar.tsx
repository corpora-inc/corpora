// src/components/TopBar.tsx
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon, Menu } from "lucide-react"
import { useProjectStore } from "@/stores/ProjectStore"
import { ExportPdfButton } from "@/components/ExportPdfButton"
import { SettingsDialog } from "@/components/SettingsDialog"

export interface TopBarProps {
    /** Show mobile outline drawer */
    onToggleOutlinePanel?: () => void
    /** Show mobile history drawer */
    onToggleHistoryPanel?: () => void
}

export function TopBar({ onToggleOutlinePanel, onToggleHistoryPanel }: TopBarProps) {
    const project = useProjectStore((s) => s.project)
    const sections = useProjectStore((s) => s.sections)
    const setOutlineOpen = useProjectStore((s) => s.setOutlineOpen)
    const setDraftOpen = useProjectStore((s) => s.setDraftOpen)
    const setRewriteOpen = useProjectStore((s) => s.setRewriteOpen) // new store action

    if (!project) return null

    const hasSections = sections.length > 0
    const hasContent = sections.some(
        (sec) =>
            (sec.introduction?.trim() ?? "") !== "" ||
            sec.subsections?.some((sub) => (sub.content?.trim() ?? "") !== "")
    )

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
                    <Link to="/projects"><ArrowLeftIcon className="w-4 h-4"/></Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{project.title}</h1>
                    {project.subtitle && (
                        <p className="mt-1 text-gray-600">{project.subtitle}</p>
                    )}
                </div>
            </div>

            {/* Right: action buttons + settings */}
            <div className="flex items-center space-x-2">
                <button
                    className="hidden md:inline-flex"
                    onClick={() => onToggleHistoryPanel?.()}
                >
                    History
                </button>
                {!hasSections && (
                    <Button onClick={() => setOutlineOpen(true)}>Outline</Button>
                )}
                {hasSections && !hasContent && (
                    <Button onClick={() => setDraftOpen(true)}>Draft book</Button>
                )}
                {hasContent && (
                    <Button onClick={() => setRewriteOpen(true)}>Rewrite</Button>
                )}
                {hasSections && (
                    <ExportPdfButton projectId={project.id} />
                )}
                <SettingsDialog />
            </div>
        </div>
    )
}
