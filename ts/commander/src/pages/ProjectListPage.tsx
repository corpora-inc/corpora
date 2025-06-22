// src/pages/ProjectListPage.tsx
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    useCorporaCommanderApiProjectListProjects,
} from "@/api/commander/commander";
import type { ProjectOut } from "@/api/schemas/projectOut";

export default function ProjectListPage() {
    console.log("mounted ProjectListPage")
    const navigate = useNavigate();
    const {
        data: response,
        isLoading,
        isError,
        error,
    } = useCorporaCommanderApiProjectListProjects();

    // Orval hook returns an AxiosResponse<ProjectOut[]>
    const projects: ProjectOut[] = response?.data ?? [];

    if (isLoading) {
        return (
            <div className="p-6 text-center">
                Loading projects…
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-6 text-center text-red-600">
                Error loading projects: {(error as Error).message}
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="p-6 text-center space-y-4">
                <h2 className="text-xl font-semibold">No projects yet</h2>
                <p>Create your first book project to get started.</p>
                <Button onClick={() => navigate("/projects/new")}>
                    New Project
                </Button>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">Projects</h1>
                <Button onClick={() => navigate("/projects/new")}>
                    New Project
                </Button>
            </div>

            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((proj) => (
                    <li
                        key={proj.id}
                        onClick={() => navigate(`/project/${proj.id}`)}
                        className="cursor-pointer rounded-lg border p-4 hover:shadow-md transition"
                    >
                        <h3 className="text-lg font-medium">{proj.title}</h3>
                        {proj.subtitle && (
                            <p className="text-sm text-neutral-600 mt-1">
                                {proj.subtitle}
                            </p>
                        )}
                        <p className="text-xs text-neutral-500 mt-2">
                            Created {new Date(proj.created_at).toLocaleDateString()}
                        </p>
                    </li>
                ))}
            </ul>
        </div>
    );
}
