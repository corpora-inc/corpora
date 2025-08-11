import { useState } from "react";
import { useProjectStore } from "@/stores/ProjectStore";
import { useUploadImage } from "@/hooks/useImages";

export default function ImageUploadDropzone() {
    const projectId = useProjectStore((s) => s.project?.id);
    const upload = useUploadImage(projectId || "");
    const [caption, setCaption] = useState("");
    const [file, setFile] = useState<File | null>(null);
    if (!projectId) return null;

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) setFile(f);
    };

    const onBrowse = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = () => {
            const f = input.files?.[0];
            if (f) setFile(f);
        };
        input.click();
    };

    const onUpload = () => {
        if (file && caption.trim()) {
            upload.mutate(caption.trim(), file);
            setFile(null);
            setCaption("");
        }
    };

    return (
        <div className="space-y-3">
            <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                className="w-full p-4 border-2 border-dashed rounded text-center text-sm"
            >
                {file ? (
                    <span>{file.name}</span>
                ) : (
                    <span>Drag & drop an image here, or</span>
                )}
                <button className="ml-1 text-blue-600 hover:underline" onClick={onBrowse}>
                    browse
                </button>
            </div>
            <input
                type="text"
                placeholder="Caption for this image token"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full border rounded px-2 py-1"
            />
            <button
                className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
                onClick={onUpload}
                disabled={!file || !caption.trim() || upload.isPending}
            >
                {upload.isPending ? "Uploading…" : "Upload"}
            </button>
        </div>
    );
}
