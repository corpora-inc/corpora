// ts/commander/src/components/rewrite/RewriteHeader.tsx
import React from "react"
import { X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LLMModelSelector } from "@/components/LLMModelSelector"
import { useRewriteWorkspaceStore } from "@/stores/RewriteWorkspaceStore"

interface RewriteHeaderProps {
    projectTitle: string
    hasSelection: boolean
    onRunSelected: () => void
    onClose: () => void
}

export const RewriteHeader: React.FC<RewriteHeaderProps> = ({
    projectTitle,
    hasSelection,
    onRunSelected,
    onClose,
}) => {
    const provider = useRewriteWorkspaceStore((s) => s.provider)
    const model = useRewriteWorkspaceStore((s) => s.model)
    const setProvider = useRewriteWorkspaceStore((s) => s.setProvider)
    const setModel = useRewriteWorkspaceStore((s) => s.setModel)

    const canRun = Boolean(provider && model && hasSelection)

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
                <div>
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-500" />
                        <h1 className="text-lg font-semibold">Rewrite Workspace</h1>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {projectTitle} · Choose sections, tweak prompts, and accept rewrites as they come in.
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
            </div>
        </header>
    )
}
