import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon, FileText, BookOpen, PencilIcon, Menu } from "lucide-react"
import { useProjectStore } from "@/stores/ProjectStore"
import { ExportPdfButton } from "@/components/ExportPdfButton"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { OutlinePanel } from "./OutlinePanel"

export function TopBar() {
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
        <div className="border-b px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6 flex items-center justify-between gap-3 sm:gap-4">
            {/* Left: mobile burger + back + title */}
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0 flex-1">
                <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    aria-label="Back to projects"
                    className="flex-shrink-0"
                >
                    <Link to="/projects"><ArrowLeftIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></Link>
                </Button>
                <Sheet >
                    <SheetTrigger>
                        <Button
                            aria-label="Open outline" variant="ghost"
                            className="md:hidden"
                            size="icon">
                            <Menu className="w-4 h-4" />
                        </Button>
                    </SheetTrigger>

                    <SheetContent side="left">
                        <SheetHeader>
                            <SheetTitle>
                                Outline
                            </SheetTitle>
                        </SheetHeader>
                        <OutlinePanel />
                    </SheetContent>
                </Sheet>
                <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                        {project.title}
                    </h1>
                    {project.subtitle && (
                        <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gray-600 truncate">
                            {project.subtitle}
                        </p>
                    )}
                </div>
            </div>

            {/* Right: action buttons */}
            <div className="flex flex-col gap-1 sm:gap-2 flex-shrink-0">
                {!hasSections && (
                    <Button
                        onClick={() => setOutlineOpen(true)}
                        size="sm"
                        className="justify-start"
                    >
                        <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4   sm:mr-2" />
                        <span className="hidden sm:inline">Outline</span>
                    </Button>
                )}
                {hasSections && !hasContent && (
                    <Button
                        onClick={() => setDraftOpen(true)}
                        size="sm"
                        className="justify-start"
                    >
                        <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4  sm:mr-2" />
                        <span className="hidden sm:inline">Draft book</span>
                    </Button>
                )}
                {hasContent && (
                    <Button
                        onClick={() => setRewriteOpen(true)}
                        size="sm"
                        className="justify-start"

                    >
                        <PencilIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4  sm:mr-2" />
                        <span className="hidden sm:inline">Rewrite</span>
                    </Button>
                )}
                {hasSections && (
                    <ExportPdfButton projectId={project.id} />
                )}
            </div>
        </div>
    )
}
