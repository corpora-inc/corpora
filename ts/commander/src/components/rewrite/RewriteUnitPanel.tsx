import React, { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import {
    useRewriteWorkspaceStore,
    type UnitKey,
    type RewriteUnitState,
} from "@/stores/RewriteWorkspaceStore"
import { ScrollArea } from "../ui/scroll-area"

interface ActiveUnitMeta {
    kind: "section" | "subsection"
    key: UnitKey
    title: string
    parentTitle: string
    originalText: string
}

interface RewriteUnitPanelProps {
    sections: {
        id: string
        title?: string | null
        introduction?: string | null
        subsections?: {
            id: string
            title?: string | null
            content?: string | null
        }[]
    }[]
    activeUnit: ActiveUnitMeta | null
    isRewriting: boolean
    isSaving: boolean
    onRewriteActive: () => void
    onAcceptActive: () => void
}

export const RewriteUnitPanel: React.FC<RewriteUnitPanelProps> = ({
    // sections,
    activeUnit,
    isRewriting,
    isSaving,
    onRewriteActive,
    onAcceptActive,
}) => {
    const activeKey = useRewriteWorkspaceStore((s) => s.activeKey)
    const unitStates = useRewriteWorkspaceStore((s) => s.unitStates)
    const updateUnitState = useRewriteWorkspaceStore((s) => s.updateUnitState)

    const state: RewriteUnitState | null = useMemo(() => {
        if (!activeUnit) return null
        const raw = unitStates[activeUnit.key]
        return (
            raw ?? {
                selected: false,
                status: "idle",
                currentText: activeUnit.originalText ?? "",
                proposal: "",
                lastPrompt: "",
            }
        )
    }, [activeUnit, unitStates])

    if (!activeUnit || !state) {
        return (
            <section className="flex flex-1 flex-col">
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Select a section or subsection to start rewriting.
                </div>
            </section>
        )
    }

    const isActive = activeKey === activeUnit.key

    return (
        <section className="flex flex-1 flex-col">
            <div className="flex items-center justify-between border-b px-4 py-2">
                <div>
                    <p className="text-xs uppercase text-muted-foreground">
                        {activeUnit.kind === "section" ? "Section" : "Subsection"}
                    </p>
                    <h2 className="text-sm font-semibold">{activeUnit.title}</h2>
                    {activeUnit.parentTitle && (
                        <p className="text-xs text-muted-foreground">
                            in {activeUnit.parentTitle}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRewriteActive}
                        disabled={isRewriting}
                    >
                        {isRewriting && isActive ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : null}
                        Rewrite this {activeUnit.kind}
                    </Button>
                    <Button
                        size="sm"
                        onClick={onAcceptActive}
                        disabled={isSaving}
                    >
                        {isSaving && isActive ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : null}
                        Accept & Save
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 gap-4 overflow-hidden p-4">
                {/* Current text */}
                <div className="flex w-1/2 flex-col overflow-hidden">
                    <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                        Current
                    </p>
                    <div className="flex-1 overflow-auto rounded-md border bg-muted/40 p-2 text-xs whitespace-pre-wrap">
                        {state.currentText ? (
                            state.currentText
                        ) : (
                            <span className="text-muted-foreground">
                                (No content yet)
                            </span>
                        )}
                    </div>
                </div>

                {/* Proposed rewrite + per-unit prompt */}
                <div className="flex w-1/2 flex-col overflow-hidden">
                    <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                        Proposed rewrite
                    </p>
                    <ScrollArea>
                        <Textarea
                            className="flex-1 text-xs"
                            value={state.proposal}
                            onChange={(e) =>
                                updateUnitState(activeUnit.key, (prev) => ({
                                    ...prev,
                                    proposal: e.target.value,
                                }))
                            }
                        />
                        <div className="mt-3">
                            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                                Extra instructions just for this {activeUnit.kind}
                            </p>
                            <Textarea
                                className="h-20 text-xs"
                                placeholder="Optional notes that will be added on top of the global prompt when rewriting this specific unit."
                                value={state.lastPrompt}
                                onChange={(e) =>
                                    updateUnitState(activeUnit.key, (prev) => ({
                                        ...prev,
                                        lastPrompt: e.target.value,
                                    }))
                                }
                            />
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </section>
    )
}
