// ts/commander/src/components/rewrite/RewriteSidebar.tsx
import React, { useMemo } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Check, AlertCircle } from "lucide-react"
import {
    useRewriteWorkspaceStore,
    makeUnitKey,
    type UnitKey,
    type UnitStatus,
    hasPendingProposal,
} from "@/stores/RewriteWorkspaceStore"

interface RewriteSidebarProps {
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
}

const renderStatusIcon = (status: UnitStatus) => {
    if (status === "pending") {
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    }
    if (status === "error") {
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
    if (status === "done") {
        return <Check className="h-4 w-4 text-emerald-500" />
    }
    return <span className="h-4 w-4" />
}

export const RewriteSidebar: React.FC<RewriteSidebarProps> = ({
    sections,
}) => {
    const globalPrompt = useRewriteWorkspaceStore((s) => s.globalPrompt)
    const setGlobalPrompt = useRewriteWorkspaceStore((s) => s.setGlobalPrompt)
    const unitStates = useRewriteWorkspaceStore((s) => s.unitStates)
    const activeKey = useRewriteWorkspaceStore((s) => s.activeKey)
    const setActiveKey = useRewriteWorkspaceStore((s) => s.setActiveKey)
    const updateUnitState = useRewriteWorkspaceStore((s) => s.updateUnitState)
    const selectAll = useRewriteWorkspaceStore((s) => s.selectAll)

    const selectedCount = useMemo(
        () => Object.values(unitStates).filter((s) => s.selected).length,
        [unitStates]
    )
    const totalCount = useMemo(
        () => Object.keys(unitStates).length,
        [unitStates]
    )
    const pendingCount = useMemo(
        () => Object.values(unitStates).filter(hasPendingProposal).length,
        [unitStates]
    )

    // tri-state for the "All units" checkbox
    const allChecked = totalCount > 0 && selectedCount === totalCount
    const allCheckboxState: boolean | "indeterminate" =
        selectedCount === 0
            ? false
            : allChecked
                ? true
                : "indeterminate"

    const getUnitState = (key: UnitKey, fallback?: any) =>
        unitStates[key] ?? {
            selected: false,
            status: "idle",
            currentText: "",
            proposal: "",
            lastPrompt: "",
            ...fallback,
        }

    const handleRowKeyDown = (key: UnitKey, e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setActiveKey(key)
        }
    }

    return (
        <aside className="flex w-80 flex-col border-r">
            <div className="border-b p-3">
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    Global instructions
                </p>
                <Textarea
                    className="h-24 text-xs"
                    placeholder="Optional global rewrite instructions applied to all selected sections/subsections."
                    value={globalPrompt}
                    onChange={(e) => setGlobalPrompt(e.target.value)}
                />
            </div>

            <div className="flex items-center justify-between border-b px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                    <Checkbox
                        checked={allCheckboxState}
                        onCheckedChange={(c) => selectAll(Boolean(c))}
                    />
                    <span className="font-medium">All units</span>
                </div>
                <span className="text-muted-foreground">
                    {selectedCount} selected
                    {pendingCount > 0 && (
                        <>
                            {" · "}
                            <span className="text-amber-600">
                                {pendingCount} to review
                            </span>
                        </>
                    )}
                </span>
            </div>

            <ScrollArea className="flex-1">
                <div className="space-y-2 p-3">
                    {sections.map((sec) => {
                        const secKey = makeUnitKey("section", sec.id)
                        const secState = getUnitState(secKey, {
                            currentText: sec.introduction ?? "",
                        })
                        const subsections = sec.subsections ?? []
                        const sectionPending = hasPendingProposal(secState)

                        return (
                            <div
                                key={sec.id}
                                className={`rounded-md border bg-muted/40 ${sectionPending ? "border-amber-400" : ""
                                    }`}
                            >
                                {/* Section row */}
                                <div
                                    role="button"
                                    tabIndex={0}
                                    className={`flex w-full items-center justify-between gap-2 rounded-t-md px-3 py-2 text-left text-xs ${activeKey === secKey ? "bg-muted" : ""
                                        } ${sectionPending
                                            ? "bg-amber-50 dark:bg-amber-900/20"
                                            : ""
                                        }`}
                                    onClick={() => setActiveKey(secKey)}
                                    onKeyDown={(e) => handleRowKeyDown(secKey, e)}
                                >
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            checked={secState.selected}
                                            onCheckedChange={(c) => {
                                                const selected = Boolean(c)

                                                // update section itself
                                                updateUnitState(secKey, (prev) => ({
                                                    ...prev,
                                                    selected,
                                                }))

                                                // update all subsections under this section
                                                for (const sub of subsections) {
                                                    const subKey = makeUnitKey(
                                                        "subsection",
                                                        sub.id
                                                    ) as UnitKey
                                                    updateUnitState(subKey, (prev) => ({
                                                        ...prev,
                                                        selected,
                                                    }))
                                                }
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <span
                                            className={`font-medium ${sectionPending
                                                    ? "text-amber-700 dark:text-amber-300"
                                                    : ""
                                                }`}
                                        >
                                            {sec.title || "Untitled section"}
                                        </span>
                                    </div>
                                    {renderStatusIcon(secState.status)}
                                </div>

                                {subsections.length > 0 && (
                                    <div className="space-y-1 border-t bg-background px-3 py-2">
                                        {subsections.map((sub) => {
                                            const subKey = makeUnitKey(
                                                "subsection",
                                                sub.id
                                            ) as UnitKey
                                            const subState = getUnitState(subKey, {
                                                currentText: sub.content ?? "",
                                            })
                                            const subPending = hasPendingProposal(
                                                subState
                                            )

                                            return (
                                                <div
                                                    key={sub.id}
                                                    role="button"
                                                    tabIndex={0}
                                                    className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left text-xs ${activeKey === subKey
                                                            ? "bg-muted/60"
                                                            : ""
                                                        } ${subPending
                                                            ? "bg-amber-50 dark:bg-amber-900/20"
                                                            : ""
                                                        }`}
                                                    onClick={() => setActiveKey(subKey)}
                                                    onKeyDown={(e) =>
                                                        handleRowKeyDown(subKey, e)
                                                    }
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Checkbox
                                                            checked={subState.selected}
                                                            onCheckedChange={(c) =>
                                                                updateUnitState(
                                                                    subKey,
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        selected:
                                                                            Boolean(
                                                                                c
                                                                            ),
                                                                    })
                                                                )
                                                            }
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                        />
                                                        <span
                                                            className={`truncate ${subPending
                                                                    ? "text-amber-700 dark:text-amber-300"
                                                                    : ""
                                                                }`}
                                                        >
                                                            {sub.title ||
                                                                "Untitled subsection"}
                                                        </span>
                                                    </div>
                                                    {renderStatusIcon(
                                                        subState.status
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </ScrollArea>
        </aside>
    )
}
