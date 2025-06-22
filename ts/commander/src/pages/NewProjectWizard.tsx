// src/pages/NewProjectWizard.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    useCorporaCommanderApiProjectCreateProject,
} from "@/api/commander/commander";
import type { ProjectIn } from "@/api/schemas/projectIn";
import { LLMEnhanceModal } from "@/components/LLMEnhanceModal";

export default function NewProjectWizard() {
    const navigate = useNavigate();
    const createProject = useCorporaCommanderApiProjectCreateProject();

    // form fields
    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [purpose, setPurpose] = useState("");
    const [instructions, setInstructions] = useState("");
    const [voice, setVoice] = useState("");
    const [hasImages, setHasImages] = useState(false);

    // other metadata (optional, out of scope for AI enhancement)
    const [author, setAuthor] = useState("");
    const [publisher, setPublisher] = useState("");
    const [isbn, setIsbn] = useState("");
    const [language, setLanguage] = useState("en-US");
    const [publicationDate, setPublicationDate] = useState("");

    // modal open?
    const [enhanceOpen, setEnhanceOpen] = useState(false);

    // derive loading / error from the createProject mutation
    const isPending = createProject.status === "pending";
    const isError = createProject.status === "error";
    const errorMessage = (createProject.error as Error | null)?.message ?? null;

    const handleCreate = async () => {
        const payload: ProjectIn = {
            title,
            subtitle,
            purpose,
            author,
            publisher,
            isbn,
            language,
            publication_date: publicationDate || undefined,
            instructions,
            voice,
        };
        try {
            const res = await createProject.mutateAsync({ data: payload });
            navigate(`/project/${res.data.id}`);
        } catch {
            // errorMessage will render below
        }
    };

    // keys we want AI to fill or refine:
    const enhanceSchema = {
        subtitle: "str",
        purpose: "str",
        instructions: "str",
        voice: "str",
        has_images: "bool",
    } as const;

    return (
        <div className="p-6 max-w-xl mx-auto space-y-6">
            <h1 className="text-2xl font-semibold">Create New Project</h1>

            <div className="space-y-4">
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium">Title*</label>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="My Great Book"
                    />
                </div>

                {/* Subtitle */}
                <div>
                    <label className="block text-sm font-medium">Subtitle</label>
                    <Input
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder="A Journey into Foo"
                    />
                </div>

                {/* Purpose */}
                <div>
                    <label className="block text-sm font-medium">Purpose</label>
                    <textarea
                        className="w-full border rounded p-2 h-24"
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        placeholder="Describe the purpose of this project..."
                    />
                </div>

                {/* LLM Instructions */}
                <div>
                    <label className="block text-sm font-medium">LLM Instructions</label>
                    <textarea
                        className="w-full border rounded p-2 h-24"
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="E.g., write in an enthusiastic tone…"
                    />
                </div>

                {/* Voice */}
                <div>
                    <label className="block text-sm font-medium">Voice</label>
                    <textarea
                        className="w-full border rounded p-2 h-24"
                        value={voice}
                        onChange={(e) => setVoice(e.target.value)}
                        placeholder="E.g., formal, conversational…"
                    />
                </div>

                {/* Has Images */}
                <div className="flex items-center space-x-2">
                    <input
                        id="hasImages"
                        type="checkbox"
                        checked={hasImages}
                        onChange={(e) => setHasImages(e.target.checked)}
                    />
                    <label htmlFor="hasImages" className="text-sm">
                        Will include images?
                    </label>
                </div>

                {/* Other metadata (optional) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Author</label>
                        <Input
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Publisher</label>
                        <Input
                            value={publisher}
                            onChange={(e) => setPublisher(e.target.value)}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">ISBN</label>
                        <Input value={isbn} onChange={(e) => setIsbn(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Language</label>
                        <Input
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium">Publication Date</label>
                    <Input
                        type="date"
                        value={publicationDate}
                        onChange={(e) => setPublicationDate(e.target.value)}
                        className="w-full"
                    />
                </div>
            </div>

            {/* AI-Enhance button */}
            <div className="flex justify-end">
                <Button
                    variant="outline"
                    onClick={() => setEnhanceOpen(true)}
                    disabled={!title.trim()}
                >
                    Enhance with AI
                </Button>
            </div>

            {/* API error */}
            {isError && errorMessage && (
                <p className="text-red-600">{errorMessage}</p>
            )}

            {/* Create / Cancel */}
            <div className="flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => navigate(-1)} disabled={isPending}>
                    Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!title.trim() || isPending}>
                    {isPending ? "Creating…" : "Create Project"}
                </Button>
            </div>

            {/* ——— AI Enhance Modal ——— */}
            <LLMEnhanceModal<{
                subtitle: string;
                purpose: string;
                instructions: string;
                voice: string;
                has_images: boolean;
            }>
                open={enhanceOpen}
                schema={enhanceSchema}
                initialData={{
                    subtitle,
                    purpose,
                    instructions,
                    voice,
                    has_images: hasImages,
                }}
                onAccept={(suggested) => {
                    if (typeof suggested.subtitle === "string") setSubtitle(suggested.subtitle);
                    if (typeof suggested.purpose === "string") setPurpose(suggested.purpose);
                    if (typeof suggested.instructions === "string") setInstructions(suggested.instructions);
                    if (typeof suggested.voice === "string") setVoice(suggested.voice);
                    if (typeof suggested.has_images === "boolean") setHasImages(suggested.has_images);
                    setEnhanceOpen(false);
                }}
                onClose={() => setEnhanceOpen(false)}
            />
        </div>
    );
}
