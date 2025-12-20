// ts/commander/src/components/GenerateRewriteDialog.tsx
import type { FC } from "react"
import { RewriteWorkspace } from "@/components/rewrite/RewriteWorkspace"

export interface GenerateRewriteDialogProps {
    open: boolean
    onClose: () => void
}

// This stays mounted/unmounted by the parent; no hooks here.
export const GenerateRewriteDialog: FC<GenerateRewriteDialogProps> = ({
    open,
    onClose,
}) => {
    if (!open) return null
    return <RewriteWorkspace onClose={onClose} />
}

export default GenerateRewriteDialog
