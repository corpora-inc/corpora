import { create } from "zustand"
import type { ProjectOut } from "@/api/schemas/projectOut"
import type { SectionWithSubsections } from "@/api/schemas/sectionWithSubsections"
import type { SubsectionOut } from "@/api/schemas/subsectionOut"

interface ProjectStore {
    project?: ProjectOut
    sections: SectionWithSubsections[]

    // outline‐panel / editor UI state
    selectedSectionId: string | null
    selectedSubsectionId: string | null
    isOutlineOpen: boolean
    isDraftOpen: boolean
    isRewriteOpen: boolean

    // setters
    setProject: (proj: ProjectOut) => void
    setSections: (secs: SectionWithSubsections[]) => void
    setSelectedSectionId: (id: string | null) => void
    setSelectedSubsectionId: (id: string | null) => void
    setOutlineOpen: (open: boolean) => void
    setDraftOpen: (open: boolean) => void
    setRewriteOpen: (open: boolean) => void
    // drag and drop methods (these update local state only)
    reorderSections: (activeId: string, overId: string) => void
    reorderSubsections: (sectionId: string, activeId: string, overId: string) => void
    moveSubsectionToSection: (subsectionId: string, fromSectionId: string, toSectionId: string, position?: number) => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
    project: undefined,
    sections: [],

    selectedSectionId: null,
    selectedSubsectionId: null,
    isOutlineOpen: false,
    isDraftOpen: false,
    isRewriteOpen: false,

    setProject: (proj) => set({ project: proj }),
    setSections: (secs) => set({ sections: secs }),
    setSelectedSectionId: (id) => set({ selectedSectionId: id }),
    setSelectedSubsectionId: (id) => set({ selectedSubsectionId: id }),
    setOutlineOpen: (open) => set({ isOutlineOpen: open }),
    setDraftOpen: (open) => set({ isDraftOpen: open }),
    setRewriteOpen: (open) => set({ isRewriteOpen: open }),

    reorderSections: (activeId, overId) => set((state) => {
        const sections = [...state.sections]
        const activeIndex = sections.findIndex(s => s.id === activeId)
        const overIndex = sections.findIndex(s => s.id === overId)
        
        if (activeIndex !== -1 && overIndex !== -1) {
            const [removed] = sections.splice(activeIndex, 1)
            sections.splice(overIndex, 0, removed)
        }
        
        return { sections }
    }),

    reorderSubsections: (sectionId, activeId, overId) => set((state) => {
        const sections = state.sections.map(section => {
            if (section.id === sectionId) {
                const subsections = [...section.subsections]
                const activeIndex = subsections.findIndex(s => s.id === activeId)
                const overIndex = subsections.findIndex(s => s.id === overId)
                
                if (activeIndex !== -1 && overIndex !== -1) {
                    const [removed] = subsections.splice(activeIndex, 1)
                    subsections.splice(overIndex, 0, removed)
                }
                
                return { ...section, subsections }
            }
            return section
        })
        
        return { sections }
    }),

    moveSubsectionToSection: (subsectionId, fromSectionId, toSectionId, position = 0) => set((state) => {
        let subsectionToMove: SubsectionOut | null = null
        
        // Remove subsection from source section
        const sections = state.sections.map(section => {
            if (section.id === fromSectionId) {
                const subsections = section.subsections.filter(sub => {
                    if (sub.id === subsectionId) {
                        subsectionToMove = { ...sub, section_id: toSectionId }
                        return false
                    }
                    return true
                })
                return { ...section, subsections }
            }
            return section
        })
        
        // Add subsection to target section
        if (subsectionToMove) {
            const finalSections = sections.map(section => {
                if (section.id === toSectionId) {
                    const subsections = [...section.subsections]
                    subsections.splice(position, 0, subsectionToMove!)
                    return { ...section, subsections }
                }
                return section
            })
            return { sections: finalSections }
        }
        
        return { sections }
    }),
}))
