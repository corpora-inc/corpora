// src/components/OnboardingStepper.tsx
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const steps = [
  { label: "Welcome", value: "welcome", path: "/onboarding" },
  { label: "OpenAI", value: "openai", path: "/onboarding/openai" },
  { label: "LM Studio", value: "lmstudio", path: "/onboarding/lmstudio" },
  { label: "XAI", value: "xai", path: "/onboarding/xai" },
  { label: "Done", value: "complete", path: "/onboarding/complete" },
];

export function OnboardingStepper() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // pick the longest‐matching path so deeper routes win
  const current = steps
    .slice()
    .sort((a, b) => b.path.length - a.path.length)
    .find((s) => pathname.startsWith(s.path))
    ?.value ?? "welcome";

  return (
    <Tabs
      value={current}
      onValueChange={(v) => {
        const step = steps.find((s) => s.value === v);
        if (step) navigate(step.path);
      }}
    >
      {/*
        wrapper with bg + rounding, always fits all rows
        flex-wrap on mobile, grid on md+
      */}
      <div
        className="
          mb-8
          w-full max-w-2xl mx-auto
          bg-neutral-200 rounded-2xl p-2
          flex flex-wrap justify-center gap-2
          md:grid md:grid-cols-5 md:gap-2
        "
      >
        <TabsList className="w-full !p-0 !bg-transparent !grid !grid-cols-5 !gap-0">
          {steps.map(({ label, value }) => (
            <TabsTrigger key={value} value={value} className="flex-shrink-0 text-sm">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    </Tabs>
  );
}
