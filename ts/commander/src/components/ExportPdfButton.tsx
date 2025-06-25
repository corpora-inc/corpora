// ts/commander/src/components/ExportPdfButton.tsx

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useProjectStore } from "@/stores/ProjectStore"
import { exportPdf } from "@/api/commander/commander"

export function ExportPdfButton() {
    const project = useProjectStore((s) => s.project)
    const [loading, setLoading] = useState(false)

    const handleDownload = async () => {
        if (!project) return
        setLoading(true)
        try {
            // call the orval‐generated client function
            const blob = await exportPdf({ projectId: project.id })
            // create URL and trigger download
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `${project.title}.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error("Export PDF failed", err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button onClick={handleDownload} disabled={loading || !project}>
            {loading ? <Loader2 className="animate-spin" /> : "Download PDF"}
        </Button>
    )
}
