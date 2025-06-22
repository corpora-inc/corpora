// src/pages/NewProjectWizard.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    useCorporaCommanderApiProjectCreateProject,
} from "@/api/commander/commander";
import type { ProjectIn } from "@/api/schemas/projectIn";

export default function NewProjectWizard() {
    const navigate = useNavigate();
    const createProject = useCorporaCommanderApiProjectCreateProject();

    // form fields
    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [purpose, setPurpose] = useState("");
    const [author, setAuthor] = useState("");
    const [publisher, setPublisher] = useState("");
    const [isbn, setIsbn] = useState("");
    const [language, setLanguage] = useState("en-US");
    const [publicationDate, setPublicationDate] = useState(""); // keep as string
    const [instructions, setInstructions] = useState("");
    const [voice, setVoice] = useState("");

    // derive our loading / error flags from the mutation status
    const isPending = createProject.status === "pending";
    const isError = createProject.status === "error";
    const errorMessage =
        (createProject.error as Error | null)?.message ?? null;

    const handleCreate = async () => {
        const payload: ProjectIn = {
            title,
            subtitle,
            purpose,
            author,
            publisher,
            isbn,
            language,
            publication_date: publicationDate || undefined, // string or undefined
            instructions,
            voice,
        };

        try {
            const res = await createProject.mutateAsync({ data: payload });
            const id = res.data.id;
            navigate(`/project/${id}`);
        } catch {
            // nothing here—errorMessage will show below
        }
    };

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

                {/* Author / Publisher */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Author</label>
                        <Input
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            placeholder="Jane Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Publisher</label>
                        <Input
                            value={publisher}
                            onChange={(e) => setPublisher(e.target.value)}
                            placeholder="Corpora Inc."
                        />
                    </div>
                </div>

                {/* ISBN / Language */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">ISBN</label>
                        <Input
                            value={isbn}
                            onChange={(e) => setIsbn(e.target.value)}
                            placeholder="978-3-16-148410-0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Language</label>
                        <Input
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            placeholder="en-US"
                        />
                    </div>
                </div>

                {/* Publication Date */}
                <div>
                    <label className="block text-sm font-medium">Publication Date</label>
                    <Input
                        type="date"
                        value={publicationDate}
                        onChange={(e) => setPublicationDate(e.target.value)}
                        className="w-full"
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
            </div>

            {/* API error */}
            {isError && errorMessage && (
                <p className="text-red-600">{errorMessage}</p>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-2">
                <Button
                    variant="secondary"
                    onClick={() => navigate(-1)}
                    disabled={isPending}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleCreate}
                    disabled={!title.trim() || isPending}
                >
                    {isPending ? "Creating…" : "Create Project"}
                </Button>
            </div>
        </div>
    );
}
