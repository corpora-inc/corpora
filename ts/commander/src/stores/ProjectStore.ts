import { create } from "zustand"
import type { ProjectOut } from "@/api/schemas/projectOut"
import type { SectionWithSubsections } from "@/api/schemas/sectionWithSubsections"

interface ProjectStore {
    project?: ProjectOut
    sections: SectionWithSubsections[]
    /** --- Outline UI state --- */
    selectedSectionId: string | null
    selectedSubsectionId: string | null

    setProject: (proj: ProjectOut) => void
    setSections: (secs: SectionWithSubsections[]) => void
    setSelectedSectionId: (id: string | null) => void
    setSelectedSubsectionId: (id: string | null) => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
    project: undefined,
    sections: [],
    selectedSectionId: null,
    selectedSubsectionId: null,

    setProject: (proj) => set({ project: proj }),
    setSections: (secs) => set({ sections: secs }),

    // when you pick a section, clear any subsection
    setSelectedSectionId: (id) =>
        set({ selectedSectionId: id, selectedSubsectionId: null }),
    setSelectedSubsectionId: (id) => set({ selectedSubsectionId: id }),
}))
