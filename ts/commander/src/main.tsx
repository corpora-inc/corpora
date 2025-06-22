import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./index.css";

import OnboardingLayout from "./layouts/OnboardingLayout";
import WizardWelcome from "./pages/onboarding/WizardWelcome";
import OpenAIConfigPage from "./pages/onboarding/OpenAIConfigPage";
import LMStudioConfigPage from "./pages/onboarding/LMStudioConfigPage";
import XAIConfigPage from "./pages/onboarding/XAIConfigPage";
import WizardComplete from "./pages/onboarding/WizardComplete";

import MainLayout from "./layouts/MainLayout";
import { RequireOnboarded } from "./components/RequireOnboarded";

// **You’ll need these two pages added**:
import NewProjectWizard from "./pages/NewProjectWizard";
// import ProjectListPage from "./pages/app/ProjectListPage";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Onboarding */}
        <Route path="/onboarding" element={<OnboardingLayout />}>
          <Route index element={<WizardWelcome />} />
          <Route path="openai" element={<OpenAIConfigPage />} />
          <Route path="lmstudio" element={<LMStudioConfigPage />} />
          <Route path="xai" element={<XAIConfigPage />} />
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
          {/* Eventually, your projects list */}
          {/* <Route path="projects" element={<ProjectListPage />} /> */}

          {/* New-project wizard */}
          <Route path="projects/new" element={<NewProjectWizard />} />

          {/* Catch-all: redirect to /projects/new when you have no list yet */}
          <Route index element={<NewProjectWizard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
