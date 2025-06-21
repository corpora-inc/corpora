import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
// import { createProject } from "@/lib/api"; // TODO: replace with real API

export default function NewProjectWizard() {
    const [name, setName] = useState("");
    const navigate = useNavigate();

    const handleCreate = async () => {
        // const project = await createProject(name);
        // navigate(`/project/${project.id}`);
    };

    return (
        <div className="p-6 max-w-xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
            <input
                className="w-full border rounded p-2 mb-4"
                placeholder="Project title"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <Button onClick={handleCreate} disabled={!name.trim()}>
                Create Project
            </Button>
        </div>
    );
}
