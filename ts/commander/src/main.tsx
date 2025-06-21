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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Onboarding flow */}
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
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
