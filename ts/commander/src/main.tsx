import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./index.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";


import OnboardingLayout from "./layouts/OnboardingLayout";
import WizardWelcome from "./pages/onboarding/WizardWelcome";
import OpenAIConfigPage from "./pages/onboarding/OpenAIConfigPage";
import LMStudioConfigPage from "./pages/onboarding/LMStudioConfigPage";
import XAIConfigPage from "./pages/onboarding/XAIConfigPage";
import ClaudeConfigPage from "./pages/onboarding/ClaudeConfigPage";
import WizardComplete from "./pages/onboarding/WizardComplete";

import MainLayout from "./layouts/MainLayout";
import { RequireOnboarded } from "./components/RequireOnboarded";

import ProjectListPage from "./pages/ProjectListPage";
import NewProjectWizard from "./pages/NewProjectWizard";
import ProjectEditorPage from "./pages/ProjectEditorPage";
import HomeRedirectFallback from "./pages/HomeRedirectFallback";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>

        <Routes>
          {/* Onboarding */}
          <Route path="/onboarding" element={<OnboardingLayout />}>
            <Route index element={<WizardWelcome />} />
            <Route path="openai" element={<OpenAIConfigPage />} />
            <Route path="lmstudio" element={<LMStudioConfigPage />} />
            <Route path="xai" element={<XAIConfigPage />} />
            <Route path="claude" element={<ClaudeConfigPage />} />
            <Route path="complete" element={<WizardComplete />} />
          </Route>

          {/* Main app (guarded) */}
          <Route
            path="/*"
            element={
              <RequireOnboarded>
                <MainLayout />
              </RequireOnboarded>
            }
          >
            {/* Project listing */}
            <Route index element={<ProjectListPage />} />
            <Route path="projects" element={<ProjectListPage />} />

            {/* Create new project */}
            <Route path="projects/new" element={<NewProjectWizard />} />

            {/* Edit existing project */}
            <Route path="project/:id" element={<ProjectEditorPage />} />

            {/* Fallback for unknown routes */}
            <Route path="*" element={<HomeRedirectFallback />} />
          </Route>
        </Routes>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
