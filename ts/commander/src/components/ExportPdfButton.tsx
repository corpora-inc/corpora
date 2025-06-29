// ts/commander/src/components/ExportPdfButton.tsx
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
            const res = await fetch(
                `/api/commander/projects/${projectId}/export/pdf`,
                { credentials: "include" }
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

    const label = "Download PDF"

    return (
        <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="relative inline-flex items-center justify-center"
        >
            {/* Invisible label keeps the button width constant */}
            <span className={isDownloading ? "invisible" : ""}>{label}</span>
            {isDownloading && (
                <Loader2 className="absolute animate-spin h-4 w-4" />
            )}
        </Button>
    )
}
