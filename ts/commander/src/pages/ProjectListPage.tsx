// src/pages/ProjectListPage.tsx
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
    useCorporaCommanderApiProjectListProjects,
} from "@/api/commander/commander";
import type { ProjectOut } from "@/api/schemas/projectOut";

export default function ProjectListPage() {
    console.log("mounted ProjectListPage")
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const {
        data: response,
        isLoading,
        isError,
        error,
    } = useCorporaCommanderApiProjectListProjects();

    // Orval hook returns an AxiosResponse<ProjectOut[]>
    const projects: ProjectOut[] = response?.data ?? [];
    
    // Performant search filtering using useMemo
    const filteredProjects = useMemo(() => {
        if (!searchQuery.trim()) {
            return projects;
        }

        const query = searchQuery.toLowerCase().trim();
        return projects.filter((project) => {
            // search trough multiple fields, 
            return (
                project.title.toLowerCase().includes(query) ||
                project.subtitle?.toLowerCase().includes(query) ||
                project.author?.toLowerCase().includes(query) ||
                project.publisher?.toLowerCase().includes(query)
            );
        });
    }, [projects, searchQuery]);   
     if (isLoading) {
        return (
            <div className="p-6 text-center">
                Loading projects…
            </div>
        );
    }   if (isError) {
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
            <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
                <h1 className="text-2xl font-semibold">Projects</h1>
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            type="text"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-full sm:w-64"
                        />
                    </div>
                    <Button onClick={() => navigate("/projects/new")}>
                        New Project
                    </Button>
                </div>
            </div>

            {filteredProjects.length === 0 && searchQuery ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">No projects found matching "{searchQuery}"</p>
                    <Button 
                        variant="outline" 
                        onClick={() => setSearchQuery("")}
                        className="mt-2"
                    >
                        Clear search
                    </Button>
                </div>
            ) : (
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProjects.map((proj) => (
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
            )}
        </div>
    );
}
