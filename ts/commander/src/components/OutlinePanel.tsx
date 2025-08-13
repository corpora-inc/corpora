import type { FC } from "react"
import { Button } from "@/components/ui/button"
import { useProjectStore } from "@/stores/ProjectStore"
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from "@dnd-kit/core"
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core"
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
    useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useState } from "react"
import type { SectionWithSubsections } from "@/api/schemas/sectionWithSubsections"
import type { SubsectionOut } from "@/api/schemas/subsectionOut"
import { useDragDropPersistence } from "@/hooks/useDragDropPersistence"


// Sortable Section Component
interface SortableSectionProps {
    section: SectionWithSubsections
    selectedSectionId: string | null
    selectedSubsectionId: string | null
    setSelectedSectionId: (id: string | null) => void
    setSelectedSubsectionId: (id: string | null) => void
}

const SortableSection: FC<SortableSectionProps> = ({
    section,
    selectedSectionId,
    selectedSubsectionId,
    setSelectedSectionId,
    setSelectedSubsectionId,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: section.id, data: { type: "section", section } })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <li ref={setNodeRef} style={style} {...attributes}>
            <div
                {...listeners}
                className={
                    "cursor-pointer rounded px-2 py-1 " +
                    (section.id === selectedSectionId
                        ? "bg-blue-100"
                        : "hover:bg-gray-100")
                }
                onClick={() => {
                    // select section *and* clear any subsection
                    setSelectedSectionId(section.id)
                    setSelectedSubsectionId(null)
                }}
            >
                {section.title}
            </div>

            {section.id === selectedSectionId && section.subsections.length > 0 && (
                <SortableContext
                    items={section.subsections.map(sub => sub.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <ul className="pl-4 mt-1 space-y-1">
                        {section.subsections.map((sub) => (
                            <SortableSubsection
                                key={sub.id}
                                subsection={sub}
                                sectionId={section.id}
                                selectedSubsectionId={selectedSubsectionId}
                                setSelectedSubsectionId={setSelectedSubsectionId}
                            />
                        ))}
                    </ul>
                </SortableContext>
            )}
        </li>
    )
}

// Sortable Subsection Component
interface SortableSubsectionProps {
    subsection: SubsectionOut
    sectionId: string
    selectedSubsectionId: string | null
    setSelectedSubsectionId: (id: string | null) => void
}

const SortableSubsection: FC<SortableSubsectionProps> = ({
    subsection,
    sectionId,
    selectedSubsectionId,
    setSelectedSubsectionId,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ 
        id: subsection.id, 
        data: { type: "subsection", subsection, sectionId } 
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <li ref={setNodeRef} style={style} {...attributes}>
            <div
                {...listeners}
                className={
                    "cursor-pointer rounded px-2 py-1 " +
                    (subsection.id === selectedSubsectionId
                        ? "bg-blue-50"
                        : "hover:bg-gray-100")
                }
                onClick={() => setSelectedSubsectionId(subsection.id)}
            >
                {subsection.title}
            </div>
        </li>
    )
}

export const OutlinePanel: FC = () => {
    // grab everything we need from the store
    const sections = useProjectStore((s) => s.sections)
    const selectedSectionId = useProjectStore((s) => s.selectedSectionId)
    const selectedSubsectionId = useProjectStore((s) => s.selectedSubsectionId)
    const setSelectedSectionId = useProjectStore((s) => s.setSelectedSectionId)
    const setSelectedSubsectionId = useProjectStore(
        (s) => s.setSelectedSubsectionId
    )
    const setOutlineOpen = useProjectStore((s) => s.setOutlineOpen)
    const reorderSections = useProjectStore((s) => s.reorderSections)
    const reorderSubsections = useProjectStore((s) => s.reorderSubsections)
    const moveSubsectionToSection = useProjectStore((s) => s.moveSubsectionToSection)

    // Persistence hook
    const {
        persistSectionReorder,
        persistSubsectionReorder,
        persistMoveSubsectionToSection,
        isLoading: isPersisting
    } = useDragDropPersistence()

    // Drag and drop state
    const [activeItem, setActiveItem] = useState<{
        id: string
        type: "section" | "subsection"
        data: SectionWithSubsections | SubsectionOut
    } | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    )

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event
        const data = active.data.current
        if (data) {
            setActiveItem({
                id: active.id as string,
                type: data.type,
                data: data.type === "section" ? data.section : data.subsection,
            })
        }
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        setActiveItem(null)

        if (!over) return

        const activeData = active.data.current
        const overData = over.data.current

        // Section to section reordering
        if (activeData?.type === "section" && overData?.type === "section") {
            if (active.id !== over.id) {
                // Update local state immediately for responsive UI
                reorderSections(active.id as string, over.id as string)
                // Persist changes to API
                persistSectionReorder(active.id as string, over.id as string)
            }
        }
        // Subsection to subsection reordering within same section
        else if (
            activeData?.type === "subsection" &&
            overData?.type === "subsection" &&
            activeData.sectionId === overData.sectionId
        ) {
            if (active.id !== over.id) {
                // Update local state immediately
                reorderSubsections(
                    activeData.sectionId,
                    active.id as string,
                    over.id as string
                )
                // Persist changes to API
                persistSubsectionReorder(
                    activeData.sectionId,
                    active.id as string,
                    over.id as string
                )
            }
        }
        // Subsection to different section
        else if (
            activeData?.type === "subsection" &&
            overData?.type === "section"
        ) {
            // Update local state immediately
            moveSubsectionToSection(
                active.id as string,
                activeData.sectionId,
                over.id as string,
                0 // Add at the beginning
            )
            // Persist changes to API
            persistMoveSubsectionToSection(
                active.id as string,
                activeData.sectionId,
                over.id as string,
                0
            )
        }
        // Subsection to different section via another subsection
        else if (
            activeData?.type === "subsection" &&
            overData?.type === "subsection" &&
            activeData.sectionId !== overData.sectionId
        ) {
            const targetSection = sections.find(s => 
                s.subsections.some(sub => sub.id === over.id)
            )
            if (targetSection) {
                const targetIndex = targetSection.subsections.findIndex(
                    sub => sub.id === over.id
                )
                // Update local state immediately
                moveSubsectionToSection(
                    active.id as string,
                    activeData.sectionId,
                    targetSection.id,
                    targetIndex
                )
                // Persist changes to API
                persistMoveSubsectionToSection(
                    active.id as string,
                    activeData.sectionId,
                    targetSection.id,
                    targetIndex
                )
            }
        }
    }

    return (
        <aside className="w-full md:w-64 md:border-r flex flex-col h-full">
            {sections.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <Button onClick={() => setOutlineOpen(true)}>
                        Generate Outline
                    </Button>
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={sections.map(section => section.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <ul className="flex-1 overflow-y-auto space-y-1 p-3">
                            {sections.map((sec) => (
                                <SortableSection
                                    key={sec.id}
                                    section={sec}
                                    selectedSectionId={selectedSectionId}
                                    selectedSubsectionId={selectedSubsectionId}
                                    setSelectedSectionId={setSelectedSectionId}
                                    setSelectedSubsectionId={setSelectedSubsectionId}
                                />
                            ))}
                        </ul>
                    </SortableContext>

                    <DragOverlay>
                        {activeItem ? (
                            <div className={`bg-white border rounded px-2 py-1 shadow-lg ${isPersisting ? 'opacity-75' : ''}`}>
                                <span className="flex items-center gap-2">
                                    {activeItem.type === "section"
                                        ? (activeItem.data as SectionWithSubsections).title
                                        : (activeItem.data as SubsectionOut).title}
                                    {isPersisting && (
                                        <span className="text-xs text-gray-500">Saving...</span>
                                    )}
                                </span>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            )}
        </aside>
    )
}
