import { create } from "zustand"
import type { ProjectOut } from "@/api/schemas/projectOut"
import type { SectionWithSubsections } from "@/api/schemas/sectionWithSubsections"

interface ProjectStore {
    project?: ProjectOut
    sections: SectionWithSubsections[]

    // outline‐panel / editor UI state
    selectedSectionId: string | null
    selectedSubsectionId: string | null
    isOutlineOpen: boolean
    isDraftOpen: boolean

    // setters
    setProject: (proj: ProjectOut) => void
    setSections: (secs: SectionWithSubsections[]) => void
    setSelectedSectionId: (id: string | null) => void
    setSelectedSubsectionId: (id: string | null) => void
    setOutlineOpen: (open: boolean) => void
    setDraftOpen: (open: boolean) => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
    project: undefined,
    sections: [],

    selectedSectionId: null,
    selectedSubsectionId: null,
    isOutlineOpen: false,
    isDraftOpen: false,

    setProject: (proj) => set({ project: proj }),
    setSections: (secs) => set({ sections: secs }),
    setSelectedSectionId: (id) => set({ selectedSectionId: id }),
    setSelectedSubsectionId: (id) => set({ selectedSubsectionId: id }),
    setOutlineOpen: (open) => set({ isOutlineOpen: open }),
    setDraftOpen: (open) => set({ isDraftOpen: open }),
}))
