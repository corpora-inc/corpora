import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ExportPdfButtonProps {
    projectId: string
}

export function ExportPdfButton({ projectId }: ExportPdfButtonProps) {
    const [isDownloading, setIsDownloading] = useState(false)

    const handleDownload = async () => {
        setIsDownloading(true)
        try {
            // hit our PDF-export endpoint
            const res = await fetch(
                `/api/commander/projects/${projectId}/export/pdf`,
                {
                    credentials: "include",
                }
            )
            if (!res.ok) {
                throw new Error(`Download failed: ${res.status} ${res.statusText}`)
            }
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `${projectId}.pdf`
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
        } catch (e) {
            console.error("PDF download error:", e)
        } finally {
            setIsDownloading(false)
        }
    }

    return (
        <Button onClick={handleDownload} disabled={isDownloading}>
            {isDownloading ? <Loader2 className="animate-spin h-4 w-4" /> : "Download PDF"}
        </Button>
    )
}
