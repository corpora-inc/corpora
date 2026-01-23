import { useEffect, useMemo, useState } from "react"
import { useProjectStore } from "@/stores/ProjectStore"
import { useQueryClient } from "@tanstack/react-query"
import type { ProjectOut } from "@/api/schemas/projectOut"
import type { SectionWithSubsections } from "@/api/schemas/sectionWithSubsections"
import type { SubsectionOut } from "@/api/schemas/subsectionOut"
import {
    getCorporaCommanderApiProjectGetProjectQueryKey,
    getCorporaCommanderApiSectionListSectionsQueryKey,
    useCorporaCommanderApiProjectUpdateProject,
    useCorporaCommanderApiSectionUpdateSection,
    useCorporaCommanderApiSubsectionUpdateSubsection,
} from "@/api/commander/commander"
import { listSnapshots, createSnapshot, restoreSnapshot, deleteSnapshot } from "@/api/snapshots"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { RotateCcw } from "lucide-react"

type Snapshot = {
    id: string
    name?: string
    description?: string
    snapshot: object
    created_at: string
}

type SnapshotSubsection = {
    id?: SubsectionOut["id"]
    order?: SubsectionOut["order"]
    title?: SubsectionOut["title"]
    content?: SubsectionOut["content"]
    instructions?: SubsectionOut["instructions"]
}

type SnapshotSection = {
    id?: SectionWithSubsections["id"]
    order?: SectionWithSubsections["order"]
    title?: SectionWithSubsections["title"]
    introduction?: SectionWithSubsections["introduction"]
    instructions?: SectionWithSubsections["instructions"]
    subsections?: SnapshotSubsection[]
}

type SnapshotData = {
    project?: Partial<ProjectOut>
    sections?: SnapshotSection[]
}

export default function HistoryPanel() {
    const project = useProjectStore((s) => s.project)
    const setSelectedSectionId = useProjectStore((s) => s.setSelectedSectionId)
    const setSelectedSubsectionId = useProjectStore((s) => s.setSelectedSubsectionId)
    const queryClient = useQueryClient()
    const sections = useProjectStore((s) => s.sections)
    const [snaps, setSnaps] = useState<Snapshot[]>([])
    const [loading, setLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [newName, setNewName] = useState("")
    const [activeSnapshot, setActiveSnapshot] = useState<Snapshot | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)
    const updateProject = useCorporaCommanderApiProjectUpdateProject()
    const updateSection = useCorporaCommanderApiSectionUpdateSection()
    const updateSubsection = useCorporaCommanderApiSubsectionUpdateSubsection()

    const refreshSnapshots = () => {
        if (!project) return
        let mounted = true
        setLoading(true)
        listSnapshots(project.id)
            .then((r: Snapshot[]) => {
                if (mounted) setSnaps(r)
            })
            .finally(() => mounted && setLoading(false))
        return () => {
            mounted = false
        }
    }

    useEffect(() => {
        if (!isOpen) return
        const cleanup = refreshSnapshots()
        return () => {
            if (cleanup) cleanup()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, project?.id])

    if (!project) return null

    const applyProjectField = (field: string, value: unknown) => {
        updateProject.mutate(
            {
                projectId: project.id,
                data: { [field]: value },
            },
            {
                onSuccess: () => {
                    queryClient.invalidateQueries({
                        queryKey: getCorporaCommanderApiProjectGetProjectQueryKey(project.id),
                    })
                },
            },
        )
    }

    const applySectionField = (sectionId: string, field: string, value: unknown) => {
        updateSection.mutate(
            {
                sectionId,
                data: { [field]: value },
            },
            {
                onSuccess: () => {
                    queryClient.invalidateQueries({
                        queryKey: getCorporaCommanderApiSectionListSectionsQueryKey(project.id),
                    })
                },
            },
        )
    }

    const applySubsectionField = (
        subsectionId: string,
        field: string,
        value: unknown,
    ) => {
        updateSubsection.mutate(
            {
                subsectionId,
                data: { [field]: value },
            },
            {
                onSuccess: () => {
                    queryClient.invalidateQueries({
                        queryKey: getCorporaCommanderApiSectionListSectionsQueryKey(project.id),
                    })
                },
            },
        )
    }

    const currentSnapshot = useMemo<SnapshotData>(() => {
        return {
            project: {
                id: project.id,
                title: project.title,
                subtitle: project.subtitle,
                purpose: project.purpose,
                author: project.author,
                publisher: project.publisher,
                isbn: project.isbn,
                language: project.language,
                publication_date: project.publication_date,
                instructions: project.instructions,
                voice: project.voice,
                has_images: project.has_images,
                book_size: project.book_size,
                font_size: project.font_size,
            },
            sections: sections.map((sec) => ({
                id: sec.id,
                order: sec.order,
                title: sec.title,
                introduction: sec.introduction,
                instructions: sec.instructions,
                subsections: (sec.subsections ?? []).map((sub) => ({
                    id: sub.id,
                    order: sub.order,
                    title: sub.title,
                    content: sub.content,
                    instructions: sub.instructions,
                })),
            })),
        }
    }, [project, sections])

    const snapshotData = (activeSnapshot?.snapshot ?? {}) as SnapshotData
    const projectDiffs = useMemo(() => {
        const fields = [
            "title",
            "subtitle",
            "purpose",
            "author",
            "publisher",
            "isbn",
            "language",
            "publication_date",
            "instructions",
            "voice",
            "has_images",
            "book_size",
            "font_size",
        ]
        return fields
            .map((field) => {
                const currentValue = currentSnapshot.project?.[field]
                const snapshotValue = snapshotData.project?.[field]
                const changed = currentValue !== snapshotValue
                return { field, currentValue, snapshotValue, changed }
            })
            .filter((row) => row.changed)
    }, [currentSnapshot, snapshotData])

    const sectionDiffs = useMemo(() => {
        const currentSections = currentSnapshot.sections ?? []
        const snapshotSections = snapshotData.sections ?? []
        const currentById = new Map(currentSections.map((s) => [s.id, s]))
        const snapshotById = new Map(snapshotSections.map((s) => [s.id, s]))
        const allIds = new Set([
            ...currentSections.map((s) => s.id),
            ...snapshotSections.map((s) => s.id),
        ])

        return Array.from(allIds).map((id) => {
            const current = currentById.get(id)
            const snapshot = snapshotById.get(id)
            const fieldDiffs = [
                "order",
                "title",
                "introduction",
                "instructions",
            ].map((field) => ({
                field,
                currentValue: current?.[field as keyof typeof current],
                snapshotValue: snapshot?.[field as keyof typeof snapshot],
                changed:
                    current?.[field as keyof typeof current] !==
                    snapshot?.[field as keyof typeof snapshot],
            }))
            const subsectionDiffs = buildSubsectionDiffs(
                current?.subsections ?? [],
                snapshot?.subsections ?? [],
            )

            return {
                id,
                title: snapshot?.title || current?.title || "Untitled section",
                fieldDiffs: fieldDiffs.filter((row) => row.changed),
                subsectionDiffs,
            }
        })
    }, [currentSnapshot, snapshotData])

    return (
        <>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="outline">History</Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[420px] sm:max-w-[520px]">
                <SheetHeader>
                    <SheetTitle>History</SheetTitle>
                </SheetHeader>


                <div className="overflow-auto p-2 flex-1 space-y-4">
                    <div className="space-y-2">
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Snapshot name (optional)"
                        />
                        <Button
                            className="w-full"
                            onClick={async () => {
                                setLoading(true)
                                await createSnapshot(project.id, {
                                    name: newName.trim() || undefined,
                                })
                                setNewName("")
                                const list = await listSnapshots(project.id)
                                setSnaps(list as Snapshot[])
                                setLoading(false)
                            }}
                        >
                            New snapshot
                        </Button>
                    </div>
                    {loading && <div className="p-2">Loading…</div>}
                    {!loading && snaps.length === 0 && (
                        <p className="p-2 text-sm text-gray-500">No snapshots</p>
                    )}
                    <ul>
                        {snaps.map((s) => (
                            <li key={s.id}>
                                <button
                                    type="button"
                                    className="w-full text-left p-3 border rounded mb-2 hover:bg-gray-50 cursor-pointer"
                                    onClick={() => {
                                        setActiveSnapshot(s)
                                        setDetailOpen(true)
                                    }}
                                >
                                    <div className="text-sm font-medium">
                                        {s.name || "Snapshot"}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {new Date(s.created_at).toLocaleString()}
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <SheetFooter>
                    <div className="text-xs text-muted-foreground">Snapshots are stored on the server.</div>
                </SheetFooter>
            </SheetContent>
        </Sheet>

        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
            <DialogContent className="sm:max-w-5xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        {activeSnapshot?.name || "Snapshot"}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-auto space-y-6">
                    <section className="space-y-2">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Project
                        </div>
                        {projectDiffs.length === 0 ? (
                            <div className="text-sm text-gray-500">
                                No project metadata changes.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {projectDiffs.map((diff) => (
                                    <div
                                        key={diff.field}
                                        className="rounded border bg-white p-3"
                                    >
                                        <div className="flex items-center justify-between text-xs font-medium text-gray-500">
                                            <span>{diff.field}</span>
                                            <RestoreButton
                                                onClick={() => {
                                                    if (diff.snapshotValue === undefined) return
                                                    applyProjectField(diff.field, diff.snapshotValue)
                                                }}
                                            />
                                        </div>
                                        <div className="mt-2 grid gap-2 text-xs md:grid-cols-2">
                                            <DiffValue
                                                label="Current"
                                                value={diff.currentValue}
                                                compareValue={diff.snapshotValue}
                                                diffMode="current"
                                            />
                                            <DiffValue
                                                label="Snapshot"
                                                value={diff.snapshotValue}
                                                compareValue={diff.currentValue}
                                                diffMode="snapshot"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="space-y-2">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Sections
                        </div>
                        <div className="space-y-3">
                            {sectionDiffs.map((section) => (
                                <details
                                    key={section.id}
                                    className="rounded border bg-white p-3 open:shadow-sm"
                                >
                                    <summary className="flex cursor-pointer items-center justify-between text-sm font-medium">
                                        <span>{section.title}</span>
                                        <span className="text-xs text-gray-500">
                                            {section.fieldDiffs.length +
                                                section.subsectionDiffs.length}{" "}
                                            changes
                                        </span>
                                    </summary>
                                    <div className="mt-3 space-y-3">
                                        {section.fieldDiffs.length === 0 ? (
                                            <div className="text-xs text-gray-500">
                                                No section-level changes.
                                            </div>
                                        ) : (
                                            section.fieldDiffs.map((diff) => (
                                                <div key={diff.field} className="rounded border p-3">
                                                    <div className="flex items-center justify-between text-xs font-medium text-gray-500">
                                                        <span>{diff.field}</span>
                                                        <RestoreButton
                                                            onClick={() => {
                                                                if (!section.id || diff.snapshotValue === undefined) return
                                                                applySectionField(section.id, diff.field, diff.snapshotValue)
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="mt-2 grid gap-2 text-xs md:grid-cols-2">
                                                        <DiffValue
                                                            label="Current"
                                                            value={diff.currentValue}
                                                            compareValue={diff.snapshotValue}
                                                            diffMode="current"
                                                        />
                                                        <DiffValue
                                                            label="Snapshot"
                                                            value={diff.snapshotValue}
                                                            compareValue={diff.currentValue}
                                                            diffMode="snapshot"
                                                        />
                                                    </div>
                                                </div>
                                            ))
                                        )}

                                        {section.subsectionDiffs.length > 0 && (
                                            <div className="space-y-3">
                                                {section.subsectionDiffs.map((sub) => (
                                                    <details
                                                        key={sub.id}
                                                        className="rounded border p-3"
                                                    >
                                                        <summary className="flex cursor-pointer items-center justify-between text-xs font-semibold">
                                                            <span>{sub.title}</span>
                                                            <span className="text-[0.65rem] text-gray-500">
                                                                {sub.fieldDiffs.length} changes
                                                            </span>
                                                        </summary>
                                                        <div className="mt-3 space-y-2">
                                                            {sub.fieldDiffs.map((diff) => (
                                                                <div
                                                                    key={diff.field}
                                                                    className="rounded border p-3"
                                                                >
                                                                    <div className="flex items-center justify-between text-xs font-medium text-gray-500">
                                                                        <span>{diff.field}</span>
                                                                        <RestoreButton
                                                                            onClick={() => {
                                                                                if (!sub.id || diff.snapshotValue === undefined) return
                                                                                applySubsectionField(sub.id, diff.field, diff.snapshotValue)
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <div className="mt-2 grid gap-2 text-xs md:grid-cols-2">
                                                                        <DiffValue
                                                                            label="Current"
                                                                            value={diff.currentValue}
                                                                            compareValue={diff.snapshotValue}
                                                                            diffMode="current"
                                                                        />
                                                                        <DiffValue
                                                                            label="Snapshot"
                                                                            value={diff.snapshotValue}
                                                                            compareValue={diff.currentValue}
                                                                            diffMode="snapshot"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </details>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </details>
                            ))}
                        </div>
                    </section>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setDetailOpen(false)}
                    >
                        Close
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={async () => {
                            if (!activeSnapshot) return
                            if (!confirm("Delete this snapshot?")) return
                            setLoading(true)
                            await deleteSnapshot(activeSnapshot.id)
                            const list = await listSnapshots(project.id)
                            setSnaps(list as Snapshot[])
                            setLoading(false)
                            setDetailOpen(false)
                        }}
                    >
                        Delete
                    </Button>
                    <Button
                        onClick={async () => {
                            if (!activeSnapshot) return
                            if (!confirm("Restore this snapshot? This will overwrite current content.")) return
                            setLoading(true)
                            setSelectedSectionId(null)
                            setSelectedSubsectionId(null)
                            try {
                                if (project?.id) {
                                    const key = `commander.project.${project.id}.selection`
                                    localStorage.removeItem(key)
                                }
                            } catch {
                                /* ignore localStorage errors */
                            }
                            await restoreSnapshot(activeSnapshot.id)
                            if (project) {
                                queryClient.invalidateQueries({
                                    queryKey: getCorporaCommanderApiProjectGetProjectQueryKey(project.id),
                                })
                                queryClient.invalidateQueries({
                                    queryKey: getCorporaCommanderApiSectionListSectionsQueryKey(project.id),
                                })
                            }
                            setLoading(false)
                            setDetailOpen(false)
                        }}
                    >
                        Restore
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    )
}

function DiffValue({
    label,
    value,
    compareValue,
    diffMode,
}: {
    label: string
    value: unknown
    compareValue?: unknown
    diffMode?: "current" | "snapshot"
}) {
    const shouldDiff =
        typeof value === "string" &&
        typeof compareValue === "string" &&
        value !== compareValue
    const renderedValue = useMemo(() => {
        if (!shouldDiff || !diffMode) return formatDiffValue(value)
        const currentText =
            diffMode === "current"
                ? (value as string)
                : (compareValue as string)
        const snapshotText =
            diffMode === "current"
                ? (compareValue as string)
                : (value as string)
        return renderDiff(currentText, snapshotText, diffMode)
    }, [compareValue, diffMode, shouldDiff, value])
    return (
        <div className="rounded border bg-gray-50 p-2">
            <div className="text-[0.65rem] uppercase text-gray-400">{label}</div>
            <div className="mt-1 whitespace-pre-wrap text-xs text-gray-900">
                {renderedValue}
            </div>
        </div>
    )
}

function formatDiffValue(value: unknown) {
    if (value === null || value === undefined) return "—"
    if (typeof value === "boolean") return value ? "true" : "false"
    if (typeof value === "string") return value.trim() ? value : "—"
    return JSON.stringify(value, null, 2)
}

function renderDiff(
    current: string,
    snapshot: string,
    mode: "current" | "snapshot",
) {
    const maxChars = 20000
    if (current.length + snapshot.length > maxChars) {
        return formatDiffValue(mode === "current" ? current : snapshot)
    }

    const oldTokens = tokenizeForDiff(current)
    const newTokens = tokenizeForDiff(snapshot)
    const maxTokens = 2000
    if (oldTokens.length + newTokens.length > maxTokens) {
        return formatDiffValue(mode === "current" ? current : snapshot)
    }
    const ops = diffTokens(oldTokens, newTokens)

    return ops
        .filter((op) => {
            if (mode === "current") return op.type !== "insert"
            return op.type !== "delete"
        })
        .map((op, idx) => {
            const className =
                op.type === "equal"
                    ? ""
                    : mode === "current"
                      ? "bg-rose-100 text-rose-900"
                      : "bg-emerald-100 text-emerald-900"
            return (
                <span key={`${mode}-${idx}`} className={className}>
                    {op.value}
                </span>
            )
        })
}

function tokenizeForDiff(text: string) {
    return text.split(/(\n)/).filter((token) => token.length > 0)
}

function diffTokens(oldTokens: string[], newTokens: string[]) {
    const N = oldTokens.length
    const M = newTokens.length
    const max = N + M
    const trace: Map<number, number>[] = []
    let v = new Map<number, number>()
    v.set(1, 0)

    for (let d = 0; d <= max; d += 1) {
        const vNext = new Map<number, number>()
        for (let k = -d; k <= d; k += 2) {
            let x: number
            if (k === -d || (k !== d && (v.get(k - 1) ?? 0) < (v.get(k + 1) ?? 0))) {
                x = v.get(k + 1) ?? 0
            } else {
                x = (v.get(k - 1) ?? 0) + 1
            }
            let y = x - k
            while (x < N && y < M && oldTokens[x] === newTokens[y]) {
                x += 1
                y += 1
            }
            vNext.set(k, x)
            if (x >= N && y >= M) {
                trace.push(vNext)
                return buildDiff(oldTokens, newTokens, trace)
            }
        }
        trace.push(vNext)
        v = vNext
    }

    return buildDiff(oldTokens, newTokens, trace)
}

function buildDiff(
    oldTokens: string[],
    newTokens: string[],
    trace: Map<number, number>[],
) {
    const ops: Array<{ type: "equal" | "insert" | "delete"; value: string }> = []
    let x = oldTokens.length
    let y = newTokens.length

    for (let d = trace.length - 1; d >= 0; d -= 1) {
    const k = x - y
        const prevV = d > 0 ? trace[d - 1] : new Map<number, number>()
        let prevK: number
        if (k === -d || (k !== d && (prevV.get(k - 1) ?? 0) < (prevV.get(k + 1) ?? 0))) {
            prevK = k + 1
        } else {
            prevK = k - 1
        }
        const prevX = prevV.get(prevK) ?? 0
        const prevY = prevX - prevK

        while (x > prevX && y > prevY) {
            ops.push({ type: "equal", value: oldTokens[x - 1] })
            x -= 1
            y -= 1
        }

        if (d === 0) break

        if (x === prevX) {
            ops.push({ type: "insert", value: newTokens[y - 1] })
            y -= 1
        } else {
            ops.push({ type: "delete", value: oldTokens[x - 1] })
            x -= 1
        }
    }

    return ops.reverse()
}

function buildSubsectionDiffs(
    currentSubs: SnapshotSubsection[],
    snapshotSubs: SnapshotSubsection[],
) {
    const currentById = new Map(currentSubs.map((s) => [s.id, s]))
    const snapshotById = new Map(snapshotSubs.map((s) => [s.id, s]))
    const allIds = new Set([
        ...currentSubs.map((s) => s.id),
        ...snapshotSubs.map((s) => s.id),
    ])

    return Array.from(allIds)
        .map((id) => {
            const current = currentById.get(id)
            const snapshot = snapshotById.get(id)
            const fieldDiffs = [
                "order",
                "title",
                "content",
                "instructions",
            ].map((field) => ({
                field,
                currentValue: current?.[field as keyof typeof current],
                snapshotValue: snapshot?.[field as keyof typeof snapshot],
                changed:
                    current?.[field as keyof typeof current] !==
                    snapshot?.[field as keyof typeof snapshot],
            }))
            return {
                id,
                title: snapshot?.title || current?.title || "Untitled subsection",
                fieldDiffs: fieldDiffs.filter((row) => row.changed),
            }
        })
        .filter((sub) => sub.fieldDiffs.length > 0)
}

function RestoreButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-[0.65rem] text-gray-500 hover:text-gray-900 cursor-pointer"
            title="Restore this field from snapshot"
        >
            <RotateCcw className="h-3 w-3" />
            Restore
        </button>
    )
}
