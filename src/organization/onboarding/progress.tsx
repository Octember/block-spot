import { ONBOARDING_STEPS } from "./constants";

export function OnboardingProgress({ currentStep }: { currentStep: string }) {
  const steps = Object.values(ONBOARDING_STEPS);

  return (
    <nav aria-label="Progress" className="w-full px-8">
      <ol role="list" className="flex items-center">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={`relative ${index !== steps.length - 1 ? "pr-32" : ""}`}
          >
            <div className="flex items-center">
              <div
                className={`relative flex h-8 w-8 items-center justify-center rounded-full
                  ${currentStep === step.id
                    ? "border-2 border-indigo-600 bg-white"
                    : Object.values(ONBOARDING_STEPS).findIndex(
                      (s) => s.id === currentStep,
                    ) > index
                      ? "bg-indigo-600"
                      : "border-2 border-gray-300 bg-white"
                  }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${currentStep === step.id ? "bg-indigo-600" : ""}`}
                />
              </div>
              {index !== steps.length - 1 && (
                <div className="absolute left-8 top-4 w-full h-0.5 -translate-y-1/2 bg-gray-300" />
              )}
            </div>
            <span className="absolute -bottom-6 w-max text-sm font-medium text-gray-500">
              {step.name}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
