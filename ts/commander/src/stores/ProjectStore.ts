// ts/commander/src/stores/ProjectStore.ts

import { create } from "zustand"
import type { ProjectOut } from "@/api/schemas/projectOut"
import type { SectionWithSubsections } from "@/api/schemas/sectionWithSubsections"

interface ProjectStore {
    project?: ProjectOut
    sections: SectionWithSubsections[]
    setProject: (proj: ProjectOut) => void
    setSections: (secs: SectionWithSubsections[]) => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
    project: undefined,
    sections: [],
    setProject: (proj) => set({ project: proj }),
    setSections: (secs) => set({ sections: secs }),
}))
