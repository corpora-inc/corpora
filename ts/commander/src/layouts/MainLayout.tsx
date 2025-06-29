// src/layouts/MainLayout.tsx
import { Outlet } from "react-router-dom";
// import { Sidebar } from "@/components/Sidebar";
// import { Toaster } from "@/components/ui/toaster";

export default function MainLayout() {
    return (
        <div className="flex h-screen">
            {/* <Sidebar className="hidden md:flex" /> */}
            <main className="flex-1 overflow-auto"><Outlet /></main>
            {/* <Toaster /> */}
        </div>
    );
}
