import { useParams } from "react-router-dom";
// import { SectionTree } from "@/components/SectionTree";
// import { MarkdownEditor } from "@/components/MarkdownEditor";
// import { ImageDrawer } from "@/components/ImageDrawer";

export default function ProjectEditorPage() {
    const { id } = useParams<{ id: string }>();

    if (!id) return <p className="p-4">No project ID.</p>;

    return (
        <div className="flex h-full">
            <aside className="hidden w-64 border-r p-4 md:block">
                {/* <SectionTree projectId={id} /> */}
            </aside>
            <main className="flex-1 overflow-y-auto">
                {/* <MarkdownEditor projectId={id} /> */}
            </main>
            {/* <ImageDrawer projectId={id} /> */}
        </div>
    );
}
