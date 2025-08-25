// src/pages/ProjectListPage.tsx
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Trash } from "lucide-react";
import { SettingsDialog } from "@/components/SettingsDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
    useCorporaCommanderApiProjectListProjects,
    useCorporaCommanderApiProjectDeleteProject,
    getCorporaCommanderApiProjectListProjectsQueryKey,
} from "@/api/commander/commander";
import type { ProjectOut } from "@/api/schemas/projectOut";
import { useQueryClient } from "@tanstack/react-query";

export default function ProjectListPage() {
    console.log("mounted ProjectListPage")
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const {
        data: response,
        isLoading,
        isError,
        error,
    } = useCorporaCommanderApiProjectListProjects();

    const deleteProject = useCorporaCommanderApiProjectDeleteProject();
    const [projectToDelete, setProjectToDelete] = useState<ProjectOut | null>(null);

    const confirmDelete = (p: ProjectOut) => {
        const queryKey = getCorporaCommanderApiProjectListProjectsQueryKey();
        const previous = queryClient.getQueryData<{ data: ProjectOut[] } | undefined>(queryKey);

        // optimistic update
        queryClient.setQueryData<{ data: ProjectOut[] } | undefined>(
            queryKey,
            (old) => {
                if (!old) return old;
                return { ...old, data: old.data.filter((item) => item.id !== p.id) };
            }
        );

        deleteProject.mutate(
            { projectId: p.id },
            {
                onError() {
                    // rollback
                    queryClient.setQueryData(queryKey, previous);
                    console.error("Failed to delete project");
                    // close dialog
                    setProjectToDelete(null);
                },
                onSuccess() {
                    // ensure fresh data
                    queryClient.invalidateQueries({ queryKey });
                    setProjectToDelete(null);
                },
            }
        );
    };

    // Orval hook returns an AxiosResponse<ProjectOut[]>
    const projects = useMemo<ProjectOut[]>(() => response?.data ?? [], [response?.data]);

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
    } if (isError) {
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
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Projects</h1>
                    <SettingsDialog />
                </div>
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
                            className="flex flex-col justify-between cursor-pointer rounded-lg border p-4 hover:shadow-md transition"
                        >
                            <div className="self-end ">
                                <Button
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setProjectToDelete(proj);
                                    }}
                                >
                                    <Trash className="h-4 w-4 text-red-600" />
                                </Button>
                            </div>
                            <div
                                onClick={() => navigate(`/project/${proj.id}`)}
                                className="space-y-1"
                            >
                                <h3 className="text-lg font-medium">{proj.title}</h3>
                                {proj.subtitle && (
                                    <p
                                        className="text-sm text-neutral-600 mt-1"
                                        title={proj.subtitle}
                                    >
                                        {proj.subtitle.length > 100
                                            ? proj.subtitle.slice(0, 100) + "…"
                                            : proj.subtitle}
                                    </p>
                                )}
                                <p className="text-xs text-neutral-500 mt-2">
                                    Created {new Date(proj.created_at).toLocaleDateString()}
                                </p>
                            </div>


                        </li>
                    ))}
                </ul>
            )}

            <Dialog open={!!projectToDelete} onOpenChange={(open) => { if (!open) setProjectToDelete(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete project</DialogTitle>
                    </DialogHeader>
                    <DialogDescription>
                        Are you sure you want to delete <strong>{projectToDelete?.title}</strong>? This will remove the project and related data.
                    </DialogDescription>
                    {projectToDelete?.subtitle && (
                        <p className="mt-2 text-sm text-neutral-600">{projectToDelete.subtitle}</p>
                    )}
                    {deleteProject.isError && (
                        <p className="mt-2 text-sm text-red-600">{(deleteProject.error as Error | null)?.message}</p>
                    )}
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setProjectToDelete(null)} disabled={deleteProject.isPending}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-red-600 text-white"
                            onClick={() => projectToDelete && confirmDelete(projectToDelete)}
                            disabled={deleteProject.isPending}
                        >
                            {deleteProject.isPending ? "Deleting…" : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
