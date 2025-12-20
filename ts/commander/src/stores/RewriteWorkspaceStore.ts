import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { ProviderType } from "@/stores/LLMConfigStore"

export type UnitKind = "section" | "subsection"
export type UnitKey = `${UnitKind}:${string}`

export type UnitStatus = "idle" | "pending" | "done" | "error"

export interface RewriteUnitState {
    selected: boolean
    status: UnitStatus
    /**
     * The currently accepted text for this unit.
     * Drives the "Current" panel on the right.
     */
    currentText: string
    /**
     * A proposed rewrite that has NOT been accepted yet.
     * Blank by default until the LLM/user fills it.
     */
    proposal: string
    /**
     * Extra instructions for this unit, appended to the global prompt.
     */
    lastPrompt: string
    error?: string
}

// Minimal shape we need from sections coming from the API/store.
export interface SectionInput {
    id: string
    title?: string | null
    introduction?: string | null
    subsections?: {
        id: string
        title?: string | null
        content?: string | null
    }[]
}

export interface RewriteWorkspaceState {
    projectId: string | null
    provider: ProviderType | null
    model: string
    globalPrompt: string
    unitStates: Record<UnitKey, RewriteUnitState>
    activeKey: UnitKey | null

    setProvider: (provider: ProviderType) => void
    setModel: (model: string) => void
    setGlobalPrompt: (prompt: string) => void

    initFromSections: (
        sections: SectionInput[],
        projectId: string,
        defaultProvider: ProviderType | null,
        defaultModel: string
    ) => void
    reset: () => void

    setActiveKey: (key: UnitKey | null) => void
    updateUnitState: (
        key: UnitKey,
        updater: (prev: RewriteUnitState) => RewriteUnitState
    ) => void
    selectAll: (selected: boolean) => void
}

// Pure helpers; shared by components
export const makeUnitKey = (kind: UnitKind, id: string): UnitKey =>
    `${kind}:${id}` as UnitKey

export const parseUnitKey = (key: UnitKey): { kind: UnitKind; id: string } => {
    const [kind, id] = key.split(":") as [UnitKind, string]
    return { kind, id }
}

/**
 * Helper to decide if a unit has an outstanding proposal that
 * differs from the current accepted text.
 */
export const hasPendingProposal = (state: RewriteUnitState): boolean => {
    const proposal = state.proposal?.trim() ?? ""
    const current = state.currentText?.trim() ?? ""
    return proposal.length > 0 && proposal !== current
}

export const useRewriteWorkspaceStore = create<RewriteWorkspaceState>()(
    persist(
        (set, _get) => ({
            projectId: null,
            provider: null,
            model: "",
            globalPrompt: "",
            unitStates: {},
            activeKey: null,

            setProvider(provider) {
                set({ provider })
            },
            setModel(model) {
                set({ model })
            },
            setGlobalPrompt(globalPrompt) {
                set({ globalPrompt })
            },

            initFromSections(sections, projectId, defaultProvider, defaultModel) {
                set((state) => {
                    const sameProject = state.projectId === projectId
                    const hadState = Object.keys(state.unitStates).length > 0

                    // If we already have state for this project, MERGE:
                    // - keep existing units (sticky proposals, prompts, selections)
                    // - add new sections/subsections
                    // - drop ones that no longer exist
                    if (sameProject && hadState) {
                        const nextUnitStates: Record<UnitKey, RewriteUnitState> = {}

                        for (const sec of sections) {
                            const secKey = makeUnitKey("section", sec.id)
                            const existingSec = state.unitStates[secKey]
                            const intro = sec.introduction ?? ""

                            nextUnitStates[secKey] = existingSec
                                ? {
                                    ...existingSec,
                                    // reset status on reload
                                    status: "idle",
                                    // if currentText was empty, seed from server
                                    currentText:
                                        existingSec.currentText || intro,
                                }
                                : {
                                    selected: true,
                                    status: "idle",
                                    currentText: intro,
                                    proposal: "",
                                    lastPrompt: "",
                                }

                            for (const sub of sec.subsections ?? []) {
                                const subKey = makeUnitKey("subsection", sub.id)
                                const existingSub = state.unitStates[subKey]
                                const content = sub.content ?? ""

                                nextUnitStates[subKey] = existingSub
                                    ? {
                                        ...existingSub,
                                        status: "idle",
                                        currentText:
                                            existingSub.currentText || content,
                                    }
                                    : {
                                        selected: true,
                                        status: "idle",
                                        currentText: content,
                                        proposal: "",
                                        lastPrompt: "",
                                    }
                            }
                        }

                        const keys = Object.keys(nextUnitStates) as UnitKey[]
                        const firstKey = keys[0] ?? null
                        const activeKey =
                            state.activeKey && nextUnitStates[state.activeKey]
                                ? state.activeKey
                                : firstKey

                        return {
                            unitStates: nextUnitStates,
                            projectId,
                            // keep provider/model/globalPrompt if set; otherwise fall back
                            provider:
                                state.provider ?? defaultProvider ?? null,
                            model: state.model || defaultModel,
                            activeKey,
                        }
                    }

                    // NEW project or no prior state: initialize from scratch
                    const unitStates: Record<UnitKey, RewriteUnitState> = {}

                    for (const sec of sections) {
                        const secKey = makeUnitKey("section", sec.id)
                        const intro = sec.introduction ?? ""
                        unitStates[secKey] = {
                            selected: true,
                            status: "idle",
                            currentText: intro,
                            proposal: "",
                            lastPrompt: "",
                        }
                        for (const sub of sec.subsections ?? []) {
                            const subKey = makeUnitKey("subsection", sub.id)
                            const content = sub.content ?? ""
                            unitStates[subKey] = {
                                selected: true,
                                status: "idle",
                                currentText: content,
                                proposal: "",
                                lastPrompt: "",
                            }
                        }
                    }

                    const keys = Object.keys(unitStates) as UnitKey[]
                    const firstKey = keys[0] ?? null

                    return {
                        unitStates,
                        activeKey: firstKey,
                        globalPrompt: "",
                        provider: defaultProvider,
                        model: defaultModel,
                        projectId,
                    }
                })
            },

            reset() {
                set({
                    projectId: null,
                    unitStates: {},
                    activeKey: null,
                    globalPrompt: "",
                    provider: null,
                    model: "",
                })
            },

            setActiveKey(activeKey) {
                set({ activeKey })
            },

            updateUnitState(key, updater) {
                set((state) => {
                    const current =
                        state.unitStates[key] ??
                        ({
                            selected: false,
                            status: "idle",
                            currentText: "",
                            proposal: "",
                            lastPrompt: "",
                        } as RewriteUnitState)

                    return {
                        unitStates: {
                            ...state.unitStates,
                            [key]: updater(current),
                        },
                    }
                })
            },

            selectAll(selected) {
                set((state) => {
                    const next: Record<UnitKey, RewriteUnitState> = {}
                    for (const [key, value] of Object.entries(state.unitStates)) {
                        next[key as UnitKey] = { ...value, selected }
                    }
                    return { unitStates: next }
                })
            },
        }),
        {
            name: "rewrite-workspace",
            storage: createJSONStorage(() => window.localStorage),
        }
    )
)
