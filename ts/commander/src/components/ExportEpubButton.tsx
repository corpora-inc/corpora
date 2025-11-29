// ts/commander/src/components/ExportEpubButton.tsx
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ExportEpubButtonProps {
    projectId: string
    /**
     * Optional override for the downloaded file name.
     * If not provided, we try to read it from Content-Disposition
     * and fall back to `${projectId}.epub`.
     */
    fileName?: string
}

export function ExportEpubButton({
    projectId,
    fileName,
}: ExportEpubButtonProps) {
    const [isDownloading, setIsDownloading] = useState(false)

    const handleDownload = async () => {
        setIsDownloading(true)
        try {
            const res = await fetch(
                `/api/commander/projects/${projectId}/export/epub`,
                { credentials: "include" }
            )

            if (!res.ok) {
                throw new Error(
                    `Download failed: ${res.status} ${res.statusText}`
                )
            }

            const blob = await res.blob()
            const url = URL.createObjectURL(blob)

            // Try to derive a filename from Content-Disposition if present
            let downloadName = fileName || `${projectId}.epub`
            const disposition = res.headers.get("Content-Disposition")
            if (disposition) {
                const match =
                    /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(disposition)
                if (match && match[1]) {
                    // decode RFC 5987 / percent-encoding if needed
                    try {
                        downloadName = decodeURIComponent(match[1])
                    } catch {
                        downloadName = match[1]
                    }
                }
            }

            const a = document.createElement("a")
            a.href = url
            a.download = downloadName
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
        } catch (e) {
            console.error("EPUB download error:", e)
        } finally {
            setIsDownloading(false)
        }
    }

    const label = "Download EPUB"

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
