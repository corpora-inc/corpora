// ts/commander/src/components/rewrite/RewriteWorkspace.tsx
import React, { useEffect, useMemo } from "react"
import { useProjectStore } from "@/stores/ProjectStore"
import { useLLMConfigStore } from "@/stores/LLMConfigStore"
import {
    useCorporaCommanderApiRewriteRewriteSingleSection,
    useCorporaCommanderApiRewriteRewriteSingleSubsection,
    useCorporaCommanderApiSectionUpdateSection,
    useCorporaCommanderApiSubsectionUpdateSubsection,
} from "@/api/commander/commander"
import type { RewriteRequest, RewriteSection, RewriteSubsection } from "@/api/schemas"
import {
    useRewriteWorkspaceStore,
    // makeUnitKey,
    parseUnitKey,
    type UnitKey,
    type RewriteUnitState,
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
    const reset = useRewriteWorkspaceStore((s) => s.reset)
    const globalPrompt = useRewriteWorkspaceStore((s) => s.globalPrompt)
    const provider = useRewriteWorkspaceStore((s) => s.provider)
    const model = useRewriteWorkspaceStore((s) => s.model)
    const updateUnitState = useRewriteWorkspaceStore((s) => s.updateUnitState)

    const rewriteSection = useCorporaCommanderApiRewriteRewriteSingleSection()
    const rewriteSubsection = useCorporaCommanderApiRewriteRewriteSingleSubsection()
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

    // Init/reset store when sections or defaults change
    useEffect(() => {
        if (sections.length && resolvedProvider) {
            initFromSections(sections as any, resolvedProvider, resolvedModel)
        } else if (sections.length) {
            // no provider configured but we at least clear workspace
            initFromSections(sections as any, null, "")
        } else {
            reset()
        }

        return () => {
            reset()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sections, resolvedProvider, resolvedModel])

    const getUnitState = (key: UnitKey, fallback?: Partial<RewriteUnitState>) =>
        unitStates[key] ?? {
            selected: false,
            status: "idle",
            proposal: "",
            lastPrompt: "",
            ...fallback,
        }

    const hasSelection = useMemo(
        () => Object.values(unitStates).some((s) => s.selected),
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

    const handleRewriteActive = async () => {
        if (!activeUnit) return
        await runRewriteForKey(activeUnit.key)
    }

    const handleAcceptActive = async () => {
        if (!activeUnit) return
        const state = getUnitState(activeUnit.key)
        if (!state.proposal || !project) return

        try {
            if (activeUnit.kind === "section") {
                await updateSection.mutateAsync({
                    sectionId: parseUnitKey(activeUnit.key).id,
                    data: { introduction: state.proposal },
                })
            } else {
                await updateSub.mutateAsync({
                    subsectionId: parseUnitKey(activeUnit.key).id,
                    data: { content: state.proposal },
                })
            }
            updateUnitState(activeUnit.key, (prev) => ({
                ...prev,
                status: "done",
            }))
        } catch (e) {
            console.error("Accept rewrite failed", e)
        }
    }

    return (
        <div className="fixed inset-0 z-40 flex flex-col bg-background">
            <RewriteHeader
                projectTitle={project?.title ?? "Project"}
                hasSelection={hasSelection}
                onRunSelected={handleRunSelected}
                onClose={onClose}
            />
            <div className="flex flex-1 overflow-hidden">
                <RewriteSidebar sections={sections as any} hasSelection={hasSelection} />
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
