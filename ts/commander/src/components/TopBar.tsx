// src/components/TopBar.tsx
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon, ImagePlus, Menu } from "lucide-react"
import { useProjectStore } from "@/stores/ProjectStore"
import { useImageStore } from "@/stores/ImageStore"
import { ExportPdfButton } from "@/components/ExportPdfButton"
import { SettingsDialog } from "@/components/SettingsDialog"
import { ExportEpubButton } from "@/components/ExportEpubButton"
import HistoryPanel from "./HistoryPanel"

export interface TopBarProps {
    /** Show mobile outline drawer */
    onToggleOutlinePanel?: () => void
    /** Show mobile history drawer */
}

export function TopBar({ onToggleOutlinePanel, }: TopBarProps) {
    const project = useProjectStore((s) => s.project)
    const sections = useProjectStore((s) => s.sections)
    const setOutlineOpen = useProjectStore((s) => s.setOutlineOpen)
    const setDraftOpen = useProjectStore((s) => s.setDraftOpen)
    const setRewriteOpen = useProjectStore((s) => s.setRewriteOpen) // new store action
    const setImageDrawerOpen = useImageStore((s) => s.setDrawerOpen)
    const setSelectedSectionId = useProjectStore((s) => s.setSelectedSectionId)
    const setSelectedSubsectionId = useProjectStore((s) => s.setSelectedSubsectionId)

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
                    <Link to="/projects"><ArrowLeftIcon className="w-4 h-4" /></Link>
                </Button>
                <div>
                    <Link
                        to={`/project/${project.id}`}
                        onClick={() => {
                            setSelectedSectionId(null)
                            setSelectedSubsectionId(null)
                        }}
                        className="inline-flex items-baseline gap-2 group"
                        aria-label="Open project details"
                    >
                        <h1 className="text-2xl font-bold group-hover:text-gray-800">
                            {project.title}
                        </h1>
                    </Link>
                    {project.subtitle && (
                        <p className="mt-1 text-gray-600">{project.subtitle}</p>
                    )}
                </div>
            </div>

            {/* Right: action buttons + settings */}
            <div className="flex items-center space-x-2">
                <HistoryPanel />
                {!hasSections && (
                    <Button onClick={() => setOutlineOpen(true)}>Outline</Button>
                )}
                {hasSections && !hasContent && (
                    <Button onClick={() => setDraftOpen(true)}>Draft book</Button>
                )}
                {hasContent && (
                    <Button onClick={() => setRewriteOpen(true)}>Rewrite</Button>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setImageDrawerOpen(true)}
                    aria-label="Open Image Manager"
                >
                    <ImagePlus className="h-5 w-5" />
                </Button>
                {hasSections && (
                    <ExportPdfButton projectId={project.id} />
                )}
                {hasSections && (
                    <ExportEpubButton projectId={project.id} />
                )}
                <SettingsDialog />
            </div>
        </div>
    )
}
