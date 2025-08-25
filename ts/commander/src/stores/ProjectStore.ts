// src/stores/ProjectStore.ts
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
    isRewriteOpen: boolean

    // setters
    setProject: (proj: ProjectOut) => void
    setSections: (secs: SectionWithSubsections[]) => void
    setSelectedSectionId: (id: string | null) => void
    setSelectedSubsectionId: (id: string | null) => void
    setOutlineOpen: (open: boolean) => void
    setDraftOpen: (open: boolean) => void
    setRewriteOpen: (open: boolean) => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
    project: undefined,
    sections: [],

    selectedSectionId: null,
    selectedSubsectionId: null,
    isOutlineOpen: false,
    isDraftOpen: false,
    isRewriteOpen: false,
    setProject: (proj) => {
        // when a project is set, try to restore selection from localStorage
        try {
            const key = `commander.project.${proj.id}.selection`
            const raw = localStorage.getItem(key)
            if (raw) {
                const parsed = JSON.parse(raw) as {
                    sectionId?: string | null
                    subsectionId?: string | null
                }
                set({
                    project: proj,
                    selectedSectionId: parsed.sectionId ?? null,
                    selectedSubsectionId: parsed.subsectionId ?? null,
                })
                return
            }
        } catch {
            // ignore localStorage errors and fall back
        }
        set({ project: proj })
    },
    setSections: (secs) => set({ sections: secs }),
    setSelectedSectionId: (id) => {
        set({ selectedSectionId: id })
        try {
            const projId = useProjectStore.getState().project?.id
            if (projId) {
                const key = `commander.project.${projId}.selection`
                const prev = JSON.parse(localStorage.getItem(key) ?? "{}")
                localStorage.setItem(
                    key,
                    JSON.stringify({ ...prev, sectionId: id })
                )
            }
        } catch {
            /* ignore */
        }
    },
    setSelectedSubsectionId: (id) => {
        set({ selectedSubsectionId: id })
        try {
            const projId = useProjectStore.getState().project?.id
            if (projId) {
                const key = `commander.project.${projId}.selection`
                const prev = JSON.parse(localStorage.getItem(key) ?? "{}")
                localStorage.setItem(
                    key,
                    JSON.stringify({ ...prev, subsectionId: id })
                )
            }
        } catch {
            /* ignore */
        }
    },
    setOutlineOpen: (open) => set({ isOutlineOpen: open }),
    setDraftOpen: (open) => set({ isDraftOpen: open }),
    setRewriteOpen: (open) => set({ isRewriteOpen: open }),
}))
