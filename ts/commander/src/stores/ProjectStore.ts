// ts/commander/src/stores/ProjectStore.ts
import { create } from "zustand"
import type { ProjectOut } from "@/api/schemas/projectOut"
import type { SectionWithSubsections } from "@/api/schemas/sectionWithSubsections"

interface ProjectStore {
    project?: ProjectOut
    sections: SectionWithSubsections[]

    // ➡️ NEW editor UI state:
    selectedSectionId: string | null
    selectedSubsectionId: string | null

    setProject: (proj: ProjectOut) => void
    setSections: (secs: SectionWithSubsections[]) => void
    setSelectedSectionId: (id: string | null) => void
    setSelectedSubsectionId: (id: string | null) => void

    patchProject: (patch: Partial<ProjectOut>) => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
    project: undefined,
    sections: [],

    selectedSectionId: null,
    selectedSubsectionId: null,

    setProject: (project) => set({ project }),
    setSections: (sections) => set({ sections }),
    setSelectedSectionId: (selectedSectionId) => set({ selectedSectionId }),
    setSelectedSubsectionId: (selectedSubsectionId) => set({ selectedSubsectionId }),

    patchProject: (patch) =>
        set((s) => ({
            project: s.project ? { ...s.project, ...patch } : undefined,
        })),
}))
