import { useState } from "react";
import { useProjectStore } from "@/stores/ProjectStore";
import { useUploadImage } from "@/hooks/useImages";

export default function ImageUploadDropzone() {
    const projectId = useProjectStore((s) => s.project?.id!);
    const upload = useUploadImage(projectId);
    const [caption, setCaption] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (file && caption) {
            upload.mutate(caption, file);
            setCaption("");
            setFile(null);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-2">
            <label className="block text-sm font-medium">Caption</label>
            <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full border rounded p-2"
                placeholder="Enter caption"
            />

            <label className="block text-sm font-medium">Select Image</label>
            <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full"
            />

            <button
                type="submit"
                disabled={!caption || !file || upload.isPending}
                className="mt-2 w-full bg-green-600 text-white p-2 rounded disabled:opacity-50"
            >
                {upload.isPending ? "Uploading..." : "Upload Image"}
            </button>
        </form>
    );
}
