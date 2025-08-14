import { useImageStore } from "@/stores/ImageStore";
import { useProjectStore } from "@/stores/ProjectStore";
import { useDeleteImage } from "@/hooks/useImages";
import { Loader2, Trash2 } from "lucide-react";
import type { ProjectImageOut } from "@/api/schemas/projectImageOut";

export default function ImageGallery() {
    const images = useImageStore((s) => s.images);
    const projectId = useProjectStore((s) => s.project?.id);
    if (!projectId) return null;
    console.log(images)

    return (
        <div>
            <h3 className="text-lg font-semibold mb-2">Image Gallery</h3>
            <div className="grid grid-cols-3 gap-2">
                {images.map((img) => (
                    <ImageCard key={img.id} img={img} projectId={projectId} />
                ))}
            </div>
        </div>
    );
}

interface ImageCardProps {
    img: ProjectImageOut;
    projectId: string;
}

function ImageCard({ img, projectId }: ImageCardProps) {
    const del = useDeleteImage(projectId, img.id);

    return (
        <div className="relative group">
            <img
                src={img.image}
                alt={img.caption}
                className="w-full h-24 object-cover rounded"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <button
                    className="p-1 bg-red-600 text-white rounded flex items-center gap-1 disabled:opacity-50"
                    onClick={() => {
                        if (confirm(`Delete image for caption "${img.caption}"?`)) {
                            del.mutate();
                        }
                    }}
                    disabled={del.isPending}
                >
                    {del.isPending ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Deleting…
                        </>
                    ) : (
                        <>
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </>
                    )}
                </button>
            </div>
            <p className="text-sm mt-1 text-center truncate">{img.caption}</p>
        </div>
    );
}
