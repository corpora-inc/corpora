import { useEffect, useState } from "react";
import { useImageStore } from "@/stores/ImageStore";
import { useProjectStore } from "@/stores/ProjectStore";
import { useUploadImage } from "@/hooks/useImages";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

export default function ImageTokenList() {
    const [pendingCaption, setPendingCaption] = useState<string | null>(null);
    const tokens = useImageStore((s) => s.tokens);
    const projectId = useProjectStore((s) => s.project?.id);
    const upload = useUploadImage(projectId || "");

    useEffect(() => {
        if (!upload.isPending) {
            setPendingCaption(null);
        }
    }, [upload.isPending]);

    if (!projectId) return null;
    return (
        <div>
            <h3 className="text-lg font-semibold mb-2">Image Tokens</h3>
            <ul className="space-y-2">
                {tokens.map((token) => (
                    <li key={token.caption} className="flex items-center justify-between">
                        <span className="flex-1 truncate">{token.caption}</span>
                        {token.fulfilled ? (
                            <CheckCircle className="h-5 w-5 text-green-500" aria-label="Fulfilled" />
                        ) : (
                            <button
                                className="flex items-center space-x-1 text-blue-600 hover:underline disabled:opacity-50"
                                disabled={upload.isPending}
                                onClick={() => {
                                    const fileInput = document.createElement("input");
                                    fileInput.type = "file";
                                    fileInput.accept = "image/*";
                                    fileInput.onchange = () => {
                                        const file = fileInput.files?.[0];
                                        if (file) {
                                            setPendingCaption(token.caption);
                                            upload.mutate(token.caption, file);
                                        }
                                    };
                                    fileInput.click();
                                }}
                            >
                                {pendingCaption === token.caption && upload.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Uploading…</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="h-5 w-5" />
                                        <span>Upload</span>
                                    </>
                                )}
                            </button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
