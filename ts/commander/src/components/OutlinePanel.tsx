// ts/commander/src/components/OutlinePanel.tsx
import {
    useCorporaCommanderApiSectionUpdateSection,
    useCorporaCommanderApiSectionCreateSection,
    useCorporaCommanderApiSectionDeleteSection,
    useCorporaCommanderApiSubsectionUpdateSubsection,
    useCorporaCommanderApiSubsectionCreateSubsection,
    useCorporaCommanderApiSubsectionDeleteSubsection,
    getCorporaCommanderApiSectionListSectionsQueryKey,
} from "@/api/commander/commander";

import * as React from "react";
import { useState } from "react";
import type { FC } from "react";
import type { SectionWithSubsections } from "@/api/schemas/sectionWithSubsections";
import type { SubsectionOut } from "@/api/schemas/subsectionOut";
import { useProjectStore } from "@/stores/ProjectStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Trash2 } from "lucide-react";


// Sortable Section wrapper
function SortableSection({ id, children }: { id: string, children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 'auto',
    };
    return (
        <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </li>
    );
}

// Sortable Subsection wrapper
function SortableSubsection({ id, children }: { id: string, children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 'auto',
    };
    return (
        <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </li>
    );
}

export const OutlinePanel: FC = () => {
    // grab everything we need from the store
    const sections = useProjectStore((s) => s.sections as SectionWithSubsections[]);
    const setSections = useProjectStore((s) => s.setSections as (secs: SectionWithSubsections[]) => void);
    const selectedSectionId = useProjectStore((s) => s.selectedSectionId as string | null);
    const selectedSubsectionId = useProjectStore((s) => s.selectedSubsectionId as string | null);
    const setSelectedSectionId = useProjectStore((s) => s.setSelectedSectionId as (id: string | null) => void);
    const setSelectedSubsectionId = useProjectStore((s) => s.setSelectedSubsectionId as (id: string | null) => void);
    const setOutlineOpen = useProjectStore((s) => s.setOutlineOpen as (open: boolean) => void);
    // dnd-kit sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    // Helper: find section/subsection by id
    function findSectionBySubId(subId: string): SectionWithSubsections | undefined {
        return sections.find((sec: SectionWithSubsections) => sec.subsections.some((sub: SubsectionOut) => sub.id === subId));
    }

    // Drag end handler
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        // SECTION REORDER
        if (String(active.id).startsWith('section-') && String(over.id).startsWith('section-')) {
            const oldIdx = sections.findIndex((s: SectionWithSubsections) => `section-${s.id}` === active.id);
            const newIdx = sections.findIndex((s: SectionWithSubsections) => `section-${s.id}` === over.id);
            if (oldIdx === -1 || newIdx === -1) return;
            const newSections = arrayMove(sections, oldIdx, newIdx);
            setSections(newSections);
            // Persist new order
            (newSections as SectionWithSubsections[]).forEach((sec, idx) => {
                if (sec.order !== idx) {
                    updateSection.mutate({ sectionId: sec.id, data: { order: idx } });
                }
            });
            return;
        }

        // SUBSECTION REORDER or MOVE
        if (String(active.id).startsWith('sub-')) {
            const activeSubId = String(active.id).replace('sub-', '');
            const overSubId = String(over.id).replace('sub-', '');
            const fromSection = findSectionBySubId(activeSubId);
            const toSection = findSectionBySubId(overSubId);
            if (!fromSection || !toSection) return;
            const fromIdx = fromSection.subsections.findIndex((sub: SubsectionOut) => sub.id === activeSubId);
            const toIdx = toSection.subsections.findIndex((sub: SubsectionOut) => sub.id === overSubId);
            if (fromIdx === -1 || toIdx === -1) return;

            // Remove from old section
            const moved = { ...fromSection.subsections[fromIdx] };
            let newSections = (sections as SectionWithSubsections[]).map((sec) => ({ ...sec, subsections: [...sec.subsections] }));
            newSections = newSections.map((sec) => {
                if (sec.id === fromSection.id) {
                    const subs = [...sec.subsections];
                    subs.splice(fromIdx, 1);
                    return { ...sec, subsections: subs };
                }
                return sec;
            });
            // Insert into new section
            newSections = newSections.map((sec) => {
                if (sec.id === toSection.id) {
                    const subs = [...sec.subsections];
                    subs.splice(toIdx, 0, moved);
                    return { ...sec, subsections: subs };
                }
                return sec;
            });
            setSections(newSections);
            // Persist new order and parent
            (newSections as SectionWithSubsections[]).forEach((sec) => {
                sec.subsections.forEach((sub, idx) => {
                    // TODO: If sub.section_id !== sec.id, this is a move between sections. Backend must support this.
                    if (sub.order !== idx) {
                        updateSubsection.mutate({ subsectionId: sub.id, data: { order: idx } });
                    }
                    // If sub.section_id !== sec.id, you may need to call a move endpoint or recreate the subsection in the new section.
                });
            });
            return;
        }
    };

    // editing state
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
    const [editingSubsectionId, setEditingSubsectionId] = useState<string | null>(null)
    const [tempTitle, setTempTitle] = useState("")

    // adding state
    const [addingSection, setAddingSection] = useState(false)
    const [addingSubsectionTo, setAddingSubsectionTo] = useState<string | null>(null)

    // hooks
    const queryClient = useQueryClient()
    const updateSection = useCorporaCommanderApiSectionUpdateSection()
    const updateSubsection = useCorporaCommanderApiSubsectionUpdateSubsection()
    const createSection = useCorporaCommanderApiSectionCreateSection()
    const deleteSection = useCorporaCommanderApiSectionDeleteSection()
    const createSubsection = useCorporaCommanderApiSubsectionCreateSubsection()
    const deleteSubsection = useCorporaCommanderApiSubsectionDeleteSubsection()
    const project = useProjectStore((s) => s.project)

    // handlers
    const startEditingSection = (sectionId: string, currentTitle: string) => {
        setEditingSectionId(sectionId)
        setTempTitle(currentTitle)
    }

    const startEditingSubsection = (subsectionId: string, currentTitle: string) => {
        setEditingSubsectionId(subsectionId)
        setTempTitle(currentTitle)
    }

    const saveSectionTitle = () => {
        if (editingSectionId && project) {
            updateSection.mutate(
                {
                    sectionId: editingSectionId,
                    data: { title: tempTitle },
                },
                {
                    onSuccess: () => {
                        queryClient.invalidateQueries({
                            queryKey: getCorporaCommanderApiSectionListSectionsQueryKey(project.id),
                        })
                        setEditingSectionId(null)
                        setTempTitle("")
                    },
                }
            )
        }
    }

    const saveSubsectionTitle = () => {
        if (editingSubsectionId) {
            updateSubsection.mutate(
                {
                    subsectionId: editingSubsectionId,
                    data: { title: tempTitle },
                },
                {
                    onSuccess: () => {
                        if (project) {
                            queryClient.invalidateQueries({
                                queryKey: getCorporaCommanderApiSectionListSectionsQueryKey(project.id),
                            })
                        }
                        setEditingSubsectionId(null)
                        setTempTitle("")
                    },
                }
            )
        }
    }

    const cancelEdit = () => {
        setEditingSectionId(null)
        setEditingSubsectionId(null)
        setTempTitle("")
    }

    // add handlers
    const startAddingSection = () => {
        setAddingSection(true)
        setTempTitle("")
    }

    const startAddingSubsection = (sectionId: string) => {
        setAddingSubsectionTo(sectionId)
        setTempTitle("")
    }

    const saveNewSection = () => {
        if (project && tempTitle.trim()) {
            createSection.mutate(
                {
                    projectId: project.id,
                    data: { title: tempTitle, order: sections.length },
                },
                {
                    onSuccess: () => {
                        queryClient.invalidateQueries({
                            queryKey: getCorporaCommanderApiSectionListSectionsQueryKey(project.id),
                        })
                        setAddingSection(false)
                        setTempTitle("")
                    },
                }
            )
        }
    }

    const saveNewSubsection = () => {
        if (addingSubsectionTo && tempTitle.trim()) {
            const section = sections.find(s => s.id === addingSubsectionTo)
            if (section) {
                createSubsection.mutate(
                    {
                        sectionId: addingSubsectionTo,
                        data: { title: tempTitle, order: section.subsections.length },
                    },
                    {
                        onSuccess: () => {
                            if (project) {
                                queryClient.invalidateQueries({
                                    queryKey: getCorporaCommanderApiSectionListSectionsQueryKey(project.id),
                                })
                            }
                            setAddingSubsectionTo(null)
                            setTempTitle("")
                        },
                    }
                )
            }
        }
    }

    const handleDeleteSection = (sectionId: string) => {
        deleteSection.mutate(
            { sectionId },
            {
                onSuccess: () => {
                    if (project) {
                        queryClient.invalidateQueries({
                            queryKey: getCorporaCommanderApiSectionListSectionsQueryKey(project.id),
                        })
                    }
                    if (selectedSectionId === sectionId) {
                        setSelectedSectionId(null)
                        setSelectedSubsectionId(null)
                    }
                },
            }
        )
    }

    const handleDeleteSubsection = (subsectionId: string) => {
        deleteSubsection.mutate(
            { subsectionId },
            {
                onSuccess: () => {
                    if (project) {
                        queryClient.invalidateQueries({
                            queryKey: getCorporaCommanderApiSectionListSectionsQueryKey(project.id),
                        })
                    }
                    if (selectedSubsectionId === subsectionId) {
                        setSelectedSubsectionId(null)
                    }
                },
            }
        )
    }

    const cancelAdd = () => {
        setAddingSection(false)
        setAddingSubsectionTo(null)
        setTempTitle("")
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
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <div className="p-3 border-b">
                        <Button
                            onClick={startAddingSection}
                            variant="outline"
                            size="sm"
                            className="w-full"
                            disabled={addingSection}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Section
                        </Button>
                        {addingSection && (
                            <div className="mt-2">
                                <Input
                                    value={tempTitle}
                                    onChange={(e) => setTempTitle(e.target.value)}
                                    onBlur={saveNewSection}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") saveNewSection();
                                        if (e.key === "Escape") cancelAdd();
                                    }}
                                    placeholder="Section title"
                                    className="text-sm"
                                    autoFocus
                                />
                            </div>
                        )}
                    </div>
                    <SortableContext
                        items={sections.map((s) => `section-${s.id}`)}
                        strategy={verticalListSortingStrategy}
                    >
                        <ul className="flex-1 overflow-y-auto space-y-1 p-3">
                            {sections.map((sec) => (
                                <SortableSection key={sec.id} id={`section-${sec.id}`}>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={
                                                "cursor-pointer rounded px-2 py-1 flex-1 " +
                                                (sec.id === selectedSectionId ? "bg-blue-100" : "hover:bg-gray-100")
                                            }
                                            onClick={() => {
                                                if (editingSectionId === sec.id) return;
                                                setSelectedSectionId(sec.id);
                                                setSelectedSubsectionId(null);
                                            }}
                                            onDoubleClick={() => startEditingSection(sec.id, sec.title)}
                                        >
                                            {editingSectionId === sec.id ? (
                                                <Input
                                                    value={tempTitle}
                                                    onChange={(e) => setTempTitle(e.target.value)}
                                                    onBlur={saveSectionTitle}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") saveSectionTitle();
                                                        if (e.key === "Escape") cancelEdit();
                                                    }}
                                                    className=" px-1 text-sm"
                                                    autoFocus
                                                />
                                            ) : (
                                                sec.title
                                            )}
                                        </div>
                                        <Button
                                            onClick={() => startAddingSubsection(sec.id)}
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            disabled={addingSubsectionTo === sec.id}
                                        >
                                            <Plus className="w-3 h-3" />
                                        </Button>
                                        <Button
                                            onClick={() => handleDeleteSection(sec.id)}
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                    {addingSubsectionTo === sec.id && (
                                        <div className="ml-6 mt-1">
                                            <Input
                                                value={tempTitle}
                                                onChange={(e) => setTempTitle(e.target.value)}
                                                onBlur={saveNewSubsection}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") saveNewSubsection();
                                                    if (e.key === "Escape") cancelAdd();
                                                }}
                                                placeholder="Subsection title"
                                                className="text-sm"
                                                autoFocus
                                            />
                                        </div>
                                    )}
                                    {sec.id === selectedSectionId && sec.subsections.length > 0 && (
                                        <SortableContext
                                            items={sec.subsections.map((sub) => `sub-${sub.id}`)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            <ul className="pl-4 mt-1 space-y-1">
                                                {sec.subsections.map((sub) => (
                                                    <SortableSubsection key={sub.id} id={`sub-${sub.id}`}>
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className={
                                                                    "cursor-pointer rounded px-2 py-1 flex-1 " +
                                                                    (sub.id === selectedSubsectionId ? "bg-blue-50" : "hover:bg-gray-100")
                                                                }
                                                                onClick={() => {
                                                                    if (editingSubsectionId === sub.id) return;
                                                                    setSelectedSubsectionId(sub.id);
                                                                }}
                                                                onDoubleClick={() => startEditingSubsection(sub.id, sub.title)}
                                                            >
                                                                {editingSubsectionId === sub.id ? (
                                                                    <Input
                                                                        value={tempTitle}
                                                                        onChange={(e) => setTempTitle(e.target.value)}
                                                                        onBlur={saveSubsectionTitle}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === "Enter") saveSubsectionTitle();
                                                                            if (e.key === "Escape") cancelEdit();
                                                                        }}
                                                                        className="px-1  text-sm"
                                                                        autoFocus
                                                                    />
                                                                ) : (
                                                                    sub.title
                                                                )}
                                                            </div>
                                                            <Button
                                                                onClick={() => handleDeleteSubsection(sub.id)}
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    </SortableSubsection>
                                                ))}
                                            </ul>
                                        </SortableContext>
                                    )}
                                </SortableSection>
                            ))}
                        </ul>
                    </SortableContext>
                </DndContext>
            )}
        </aside>
    );
}
