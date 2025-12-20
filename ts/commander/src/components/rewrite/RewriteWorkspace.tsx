import React, { useEffect, useMemo } from "react"
import { useProjectStore } from "@/stores/ProjectStore"
import { useLLMConfigStore } from "@/stores/LLMConfigStore"
import {
    useCorporaCommanderApiRewriteRewriteSingleSection,
    useCorporaCommanderApiRewriteRewriteSingleSubsection,
    useCorporaCommanderApiSectionUpdateSection,
    useCorporaCommanderApiSubsectionUpdateSubsection,
} from "@/api/commander/commander"
import type {
    RewriteRequest,
    RewriteSection,
    RewriteSubsection,
} from "@/api/schemas"
import {
    useRewriteWorkspaceStore,
    parseUnitKey,
    type UnitKey,
    type RewriteUnitState,
    hasPendingProposal,
} from "@/stores/RewriteWorkspaceStore"
import { RewriteHeader } from "./RewriteHeader"
import { RewriteSidebar } from "./RewriteSidebar"
import { RewriteUnitPanel } from "./RewriteUnitPanel"

export interface RewriteWorkspaceProps {
    onClose: () => void
}

export const RewriteWorkspace: React.FC<RewriteWorkspaceProps> = ({ onClose }) => {
    const project = useProjectStore((s) => s.project)
    const sections = useProjectStore((s) => s.sections) ?? []

    const { configs, defaultProvider, availableModels } = useLLMConfigStore()

    const unitStates = useRewriteWorkspaceStore((s) => s.unitStates)
    const activeKey = useRewriteWorkspaceStore((s) => s.activeKey)
    const initFromSections = useRewriteWorkspaceStore((s) => s.initFromSections)
    const globalPrompt = useRewriteWorkspaceStore((s) => s.globalPrompt)
    const provider = useRewriteWorkspaceStore((s) => s.provider)
    const model = useRewriteWorkspaceStore((s) => s.model)
    const updateUnitState = useRewriteWorkspaceStore((s) => s.updateUnitState)

    const rewriteSection = useCorporaCommanderApiRewriteRewriteSingleSection()
    const rewriteSubsection =
        useCorporaCommanderApiRewriteRewriteSingleSubsection()
    const updateSection = useCorporaCommanderApiSectionUpdateSection()
    const updateSub = useCorporaCommanderApiSubsectionUpdateSubsection()

    // Resolve default provider/model for init
    const resolvedProvider = useMemo(() => {
        const providers = (Object.keys(configs) as (typeof defaultProvider)[]).filter(
            (p) => p && configs[p] != null
        )
        return defaultProvider ?? providers[0] ?? null
    }, [configs, defaultProvider])

    const resolvedModel = useMemo(() => {
        if (!resolvedProvider) return ""
        return (
            configs[resolvedProvider]?.defaultModel ??
            availableModels[resolvedProvider]?.[0] ??
            ""
        )
    }, [configs, availableModels, resolvedProvider])

    // Init/merge store when project/sections/defaults change.
    // Because the store is persisted, this will MERGE with existing
    // state for the same project (keeping proposals & prompts).
    useEffect(() => {
        if (!project || !project.id || !sections.length) return

        initFromSections(
            sections as any,
            project.id,
            resolvedProvider,
            resolvedModel
        )
    }, [project?.id, sections, resolvedProvider, resolvedModel, initFromSections])

    const getUnitState = (key: UnitKey, fallback?: Partial<RewriteUnitState>) =>
        unitStates[key] ?? {
            selected: false,
            status: "idle",
            currentText: "",
            proposal: "",
            lastPrompt: "",
            ...fallback,
        }

    const hasSelection = useMemo(
        () => Object.values(unitStates).some((s) => s.selected),
        [unitStates]
    )

    const pendingProposalCount = useMemo(
        () => Object.values(unitStates).filter(hasPendingProposal).length,
        [unitStates]
    )

    const activeUnit = useMemo(() => {
        if (!activeKey) return null
        const { kind, id } = parseUnitKey(activeKey)

        if (kind === "section") {
            const sec = sections.find((s) => s.id === id)
            if (!sec) return null
            return {
                kind,
                key: activeKey,
                title: sec.title || "Untitled section",
                parentTitle: "",
                originalText: sec.introduction ?? "",
            }
        }

        for (const sec of sections) {
            const sub = (sec.subsections ?? []).find((sub) => sub.id === id)
            if (sub) {
                return {
                    kind,
                    key: activeKey,
                    title: sub.title || "Untitled subsection",
                    parentTitle: sec.title || "",
                    originalText: sub.content ?? "",
                }
            }
        }

        return null
    }, [activeKey, sections])

    const isSaving = updateSection.isPending || updateSub.isPending
    const isRewriting =
        rewriteSection.isPending || rewriteSubsection.isPending

    const buildPayload = (unitKey: UnitKey): RewriteRequest | null => {
        if (!project || !provider || !model) return null

        const state = getUnitState(unitKey)
        const combinedPrompt = [globalPrompt, state.lastPrompt]
            .map((s) => s?.trim())
            .filter(Boolean)
            .join("\n\n")

        return {
            provider,
            config: { ...(configs[provider] || {}), defaultModel: model },
            prompt: combinedPrompt,
        }
    }

    const runRewriteForKey = async (key: UnitKey) => {
        if (!project) return
        const payload = buildPayload(key)
        if (!payload) return

        const { kind, id } = parseUnitKey(key)

        updateUnitState(key, (prev) => ({
            ...prev,
            status: "pending",
            error: undefined,
        }))

        try {
            if (kind === "section") {
                const res = await rewriteSection.mutateAsync({
                    projectId: project.id,
                    sectionId: id,
                    data: payload,
                })
                const rewrite = res.data as RewriteSection
                updateUnitState(key, (prev) => ({
                    ...prev,
                    status: "done",
                    // keep currentText as-is; proposal is the new suggestion
                    proposal: rewrite.introduction,
                }))
            } else {
                const res = await rewriteSubsection.mutateAsync({
                    projectId: project.id,
                    subsectionId: id,
                    data: payload,
                })
                const rewrite = res.data as RewriteSubsection
                updateUnitState(key, (prev) => ({
                    ...prev,
                    status: "done",
                    proposal: rewrite.content,
                }))
            }
        } catch (e: any) {
            console.error("Rewrite failed", e)
            updateUnitState(key, (prev) => ({
                ...prev,
                status: "error",
                error: e?.message ?? "Rewrite failed",
            }))
        }
    }

    const handleRunSelected = async () => {
        const keys = Object.entries(unitStates)
            .filter(([_, s]) => s.selected)
            .map(([key]) => key as UnitKey)

        for (const key of keys) {
            // sequential for now
            // eslint-disable-next-line no-await-in-loop
            await runRewriteForKey(key)
        }
    }

    const acceptKey = async (key: UnitKey) => {
        if (!project) return
        const { kind, id } = parseUnitKey(key)
        const state = getUnitState(key)

        // no proposal or same as current => nothing to do
        if (!hasPendingProposal(state)) return

        const newText = state.proposal

        if (kind === "section") {
            await updateSection.mutateAsync({
                sectionId: id,
                data: { introduction: newText },
            })
        } else {
            await updateSub.mutateAsync({
                subsectionId: id,
                data: { content: newText },
            })
        }

        // update local workspace: current <- proposal, proposal cleared
        updateUnitState(key, (prev) => ({
            ...prev,
            currentText: newText,
            proposal: "",
            status: "idle",
        }))
    }

    const handleRewriteActive = async () => {
        if (!activeUnit) return
        await runRewriteForKey(activeUnit.key)
    }

    const handleAcceptActive = async () => {
        if (!activeUnit) return
        try {
            await acceptKey(activeUnit.key)
        } catch (e) {
            console.error("Accept rewrite failed", e)
        }
    }

    const handleSaveAll = async () => {
        const keysWithPending = Object.entries(unitStates)
            .filter(([_, s]) => hasPendingProposal(s))
            .map(([key]) => key as UnitKey)

        for (const key of keysWithPending) {
            // eslint-disable-next-line no-await-in-loop
            try {
                await acceptKey(key)
            } catch (e) {
                console.error("Save all: accept failed for", key, e)
            }
        }
    }

    return (
        <div className="fixed inset-0 z-40 flex flex-col bg-background">
            <RewriteHeader
                projectTitle={project?.title ?? "Project"}
                hasSelection={hasSelection}
                hasPendingProposals={pendingProposalCount > 0}
                pendingProposalCount={pendingProposalCount}
                isSaving={isSaving}
                onRunSelected={handleRunSelected}
                onSaveAll={handleSaveAll}
                onClose={onClose}
            />
            <div className="flex flex-1 overflow-hidden">
                <RewriteSidebar sections={sections as any} />
                <RewriteUnitPanel
                    sections={sections as any}
                    activeUnit={activeUnit}
                    isRewriting={isRewriting}
                    isSaving={isSaving}
                    onRewriteActive={handleRewriteActive}
                    onAcceptActive={handleAcceptActive}
                />
            </div>
        </div>
    )
}
