import { useEffect, useState } from "react"
import { useProjectStore } from "@/stores/ProjectStore"
import { useQueryClient } from "@tanstack/react-query"
import {
    getCorporaCommanderApiProjectGetProjectQueryKey,
    getCorporaCommanderApiSectionListSectionsQueryKey,
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

type Snapshot = {
    id: string
    name?: string
    description?: string
    snapshot: object
    created_at: string
}

export default function HistoryPanel() {
    const project = useProjectStore((s) => s.project)
    const setSelectedSectionId = useProjectStore((s) => s.setSelectedSectionId)
    const setSelectedSubsectionId = useProjectStore((s) => s.setSelectedSubsectionId)
    const queryClient = useQueryClient()
    const [snaps, setSnaps] = useState<Snapshot[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
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
    }, [project])

    if (!project) return null

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline">History</Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
                <SheetHeader>
                    <SheetTitle>History</SheetTitle>
                </SheetHeader>


                <div className="overflow-auto p-2 flex-1 space-y-4">
                    <Button
                    className="w-full"
                        onClick={async () => {
                            setLoading(true)
                            await createSnapshot(project.id)
                            const list = await listSnapshots(project.id)
                            setSnaps(list as Snapshot[])
                            setLoading(false)
                        }}
                    >
                        New snapshot
                    </Button>
                    {loading && <div className="p-2">Loading…</div>}
                    {!loading && snaps.length === 0 && (
                        <p className="p-2 text-sm text-gray-500">No snapshots</p>
                    )}
                    <ul>
                        {snaps.map((s) => (
                            <li key={s.id} className="p-2 border rounded mb-2">
                                <div className="flex justify-between">
                                    <div>
                                        <div className="text-sm font-medium">{s.name || "Snapshot"}</div>
                                        <div className="text-xs text-gray-500">{new Date(s.created_at).toLocaleString()}</div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <button
                                            className="btn-sm"
                                            onClick={async () => {
                                                if (!confirm("Restore this snapshot? This will overwrite current content.")) return
                                                setLoading(true)
                                                // clear selection to avoid components fetching old IDs
                                                setSelectedSectionId(null)
                                                setSelectedSubsectionId(null)
                                                // also clear persisted selection in localStorage for this project
                                                try {
                                                    if (project?.id) {
                                                        const key = `commander.project.${project.id}.selection`
                                                        localStorage.removeItem(key)
                                                    }
                                                } catch {
                                                    /* ignore localStorage errors */
                                                }
                                                await restoreSnapshot(s.id)
                                                // invalidate and refetch project + sections
                                                if (project) {
                                                    queryClient.invalidateQueries({ queryKey: getCorporaCommanderApiProjectGetProjectQueryKey(project.id) })
                                                    queryClient.invalidateQueries({ queryKey: getCorporaCommanderApiSectionListSectionsQueryKey(project.id) })
                                                }
                                                setLoading(false)
                                            }}
                                        >
                                            Restore
                                        </button>
                                        <button
                                            className="btn-sm text-red-600"
                                            onClick={async () => {
                                                if (!confirm("Delete this snapshot?")) return
                                                setLoading(true)
                                                await deleteSnapshot(s.id)
                                                const list = await listSnapshots(project.id)
                                                setSnaps(list as Snapshot[])
                                                setLoading(false)
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <SheetFooter>
                    <div className="text-xs text-muted-foreground">Snapshots are stored on the server.</div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
