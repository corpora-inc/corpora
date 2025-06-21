import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import "./index.css";

import OnboardingPage from "./pages/OnboardingPage";
import NewProjectWizard from "./pages/NewProjectWizard";
import ProjectEditorPage from "./pages/ProjectEditorPage";
import HomeRedirectFallback from "./pages/HomeRedirectFallback";


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route path="onboarding" element={<OnboardingPage />} />
          <Route path="new-project" element={<NewProjectWizard />} />
          <Route path="project/:id" element={<ProjectEditorPage />} />
          <Route index element={<HomeRedirectFallback />} />
        </Route>

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
