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

  const current = steps
    .slice() // clone so we can sort safely
    .sort((a, b) => b.path.length - a.path.length)
    .find((s) => pathname.startsWith(s.path))
    ?.value ?? "welcome";

  return (
    <Tabs
      value={current}
      onValueChange={(value) => {
        const step = steps.find((s) => s.value === value);
        if (step) navigate(step.path);
      }}
      className="mb-8"
    >
      <TabsList className="grid grid-cols-5 gap-2 max-w-2xl mx-auto">
        {steps.map(({ label, value }) => (
          <TabsTrigger key={value} value={value} className="text-sm">
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
