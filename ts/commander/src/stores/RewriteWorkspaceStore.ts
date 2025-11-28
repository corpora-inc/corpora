// ts/commander/src/stores/RewriteWorkspaceStore.ts
import { create } from "zustand"
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
     * Blank by default.
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

export const useRewriteWorkspaceStore = create<RewriteWorkspaceState>((set) => ({
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

    initFromSections(sections, defaultProvider, defaultModel) {
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

        const firstKey = (Object.keys(unitStates)[0] as UnitKey | undefined) ?? null

        set({
            unitStates,
            activeKey: firstKey,
            globalPrompt: "",
            provider: defaultProvider,
            model: defaultModel,
        })
    },

    reset() {
        set({
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
}))
