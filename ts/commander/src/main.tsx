import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import OnboardingLayout from "./layouts/OnboardingLayout";
import WizardWelcome from "./pages/onboarding/WizardWelcome";
import WizardProviders from "./pages/onboarding/WizardProviders";
import WizardComplete from "./pages/onboarding/WizardComplete";

import MainLayout from "./layouts/MainLayout";
import { RequireOnboarded } from "./components/RequireOnboarded";
// import HomePage from "./pages/app/HomePage";
// import ProjectListPage from "./pages/app/ProjectListPage";
// import ProjectEditorPage from "./pages/app/ProjectEditorPage";

import "./index.css";


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Onboarding tree */}
        <Route path="/onboarding" element={<OnboardingLayout />}>
          <Route index element={<WizardWelcome />} />
          <Route path="providers" element={<WizardProviders />} />
          <Route path="complete" element={<WizardComplete />} />
        </Route>

        {/* Main app tree, all guarded */}
        <Route
          path="/*"
          element={
            <RequireOnboarded>
              <MainLayout />
            </RequireOnboarded>
          }
        >
          {/* <Route index element={<HomePage />} /> */}
          {/* <Route path="projects" element={<ProjectListPage />} /> */}
          {/* <Route path="project/:id" element={<ProjectEditorPage />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
