import React from "react"
import { X, Sparkles, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LLMModelSelector } from "@/components/LLMModelSelector"
import { useRewriteWorkspaceStore } from "@/stores/RewriteWorkspaceStore"

interface RewriteHeaderProps {
    projectTitle: string
    hasSelection: boolean
    hasPendingProposals: boolean
    pendingProposalCount: number
    isSaving: boolean
    onRunSelected: () => void
    onSaveAll: () => void
    onClose: () => void
}

export const RewriteHeader: React.FC<RewriteHeaderProps> = ({
    projectTitle,
    hasSelection,
    hasPendingProposals,
    pendingProposalCount,
    isSaving,
    onRunSelected,
    onSaveAll,
    onClose,
}) => {
    const provider = useRewriteWorkspaceStore((s) => s.provider)
    const model = useRewriteWorkspaceStore((s) => s.model)
    const setProvider = useRewriteWorkspaceStore((s) => s.setProvider)
    const setModel = useRewriteWorkspaceStore((s) => s.setModel)

    const canRun = Boolean(provider && model && hasSelection)
    const canSaveAll = hasPendingProposals && !isSaving

    const pendingLabel =
        pendingProposalCount === 1
            ? "1 proposal awaiting review"
            : `${pendingProposalCount} proposals awaiting review`

    return (
        <header className="flex items-center justify-between border-b px-4 py-2">
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    aria-label="Close rewrite workspace"
                >
                    <X className="h-5 w-5" />
                </Button>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-500" />
                        <h1 className="text-lg font-semibold">
                            Rewrite Workspace
                        </h1>
                        {/* Pending proposals badge – inline so header height never changes */}
                        {pendingProposalCount > 0 && (
                            <span
                                className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800"
                                title={pendingLabel}
                            >
                                {pendingProposalCount}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {projectTitle} · Choose sections, tweak prompts, and accept
                        rewrites as they come in.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {provider && model ? (
                    <LLMModelSelector
                        provider={provider}
                        model={model}
                        onProviderChange={setProvider}
                        onModelChange={setModel}
                    />
                ) : (
                    <span className="text-xs text-muted-foreground">
                        No LLM provider configured
                    </span>
                )}
                <Button onClick={onRunSelected} disabled={!canRun}>
                    Run for selected
                </Button>
                <Button
                    variant="outline"
                    onClick={onSaveAll}
                    disabled={!canSaveAll}
                >
                    {isSaving ? (
                        <Save className="mr-1 h-4 w-4 animate-pulse" />
                    ) : (
                        <Save className="mr-1 h-4 w-4" />
                    )}
                    Save all proposals
                </Button>
            </div>
        </header>
    )
}
