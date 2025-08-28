const base = "/api/commander"

export async function listSnapshots(projectId: string) {
    const res = await fetch(`${base}/projects/${projectId}/snapshots`)
    if (!res.ok) throw new Error("failed to list snapshots")
    return res.json()
}

export async function createSnapshot(projectId: string) {
    const res = await fetch(`${base}/projects/${projectId}/snapshots`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
    })
    if (!res.ok) throw new Error("failed to create snapshot")
    return res.json()
}

export async function restoreSnapshot(snapshotId: string) {
    const res = await fetch(`${base}/snapshots/${snapshotId}/restore`, {
        method: "POST",
    })
    if (!res.ok) throw new Error("failed to restore snapshot")
    return res.json()
}

export async function deleteSnapshot(snapshotId: string) {
    const res = await fetch(`${base}/snapshots/${snapshotId}`, { method: "DELETE" })
    if (!res.ok) throw new Error("failed to delete snapshot")
    return true
}
