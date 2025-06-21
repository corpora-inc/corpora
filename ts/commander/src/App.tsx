import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAppState } from "@/stores/AppState";
// import { Toaster } from "@/components/Toaster";
// import { CommandMenu } from "@/components/CommandMenu";
// import { Sidebar } from "@/components/Sidebar";
// import { MobileSidebar } from "@/components/MobileSidebar";
// import { getProjectList } from "@/lib/api"; // TODO: stubbed or real API

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    onboarded,
    lastRoute,
    setLastRoute,
    lastProjectId,
    // setLastProjectId,
  } = useAppState();

  useEffect(() => {
    // Persist the current route every time it changes
    setLastRoute(location.pathname);
  }, [location.pathname, setLastRoute]);

  useEffect(() => {
    // Only on first load
    const init = async () => {
      if (!onboarded) {
        navigate("/onboarding", { replace: true });
        return;
      }

      // const projects = await getProjectList(); // assume it returns []
      const projects = []; // TODO: replace with real API call

      if (projects.length === 0) {
        navigate("/new-project", { replace: true });
      } else if (lastRoute && lastRoute !== "/") {
        navigate(lastRoute, { replace: true });
      } else if (lastProjectId) {
        navigate(`/project/${lastProjectId}`, { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    };

    init();
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* <Sidebar className="hidden md:flex" />
      <MobileSidebar /> */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      {/* <Toaster />
      <CommandMenu /> */}
    </div>
  );
}
