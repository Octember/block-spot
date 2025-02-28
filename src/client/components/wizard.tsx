import { FC, ReactNode, useMemo, useState } from "react";
import { Modal } from "./modal";
import { Button } from "./button";

export type WizardProps = {
  open: boolean;
  onClose: () => void;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  wizardSteps: (next: () => void, prev: () => void) => WizardStepType[];
  showStepsCount?: boolean;
};

type WizardStepType = {
  title: string;
  description?: string;
  content: ReactNode;
  actions?: ReactNode;
};

export const Wizard: FC<WizardProps> = ({
  open,
  onClose,
  size,
  wizardSteps,
  showStepsCount,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const steps = useMemo(() => wizardSteps(handleNext, handlePrevious), [wizardSteps, handleNext, handlePrevious]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size={size}
      heading={{
        title: steps[currentStep].title,
        description: steps[currentStep].description,
        right: showStepsCount ? (
          <div className="flex flex-col justify-start space-x-2">
            <ProgressBar currentStep={currentStep} numSteps={steps.length} />
          </div>
        ) : null,
      }}
      footer={
        <div className="flex items-center justify-end space-x-3 m-2">
          {steps[currentStep].actions}
        </div>
      }
    >
      {steps[currentStep].content}
    </Modal>
  );
};

const ProgressBar: FC<{
  currentStep: number;
  numSteps: number;
}> = ({ currentStep, numSteps }) => {
  return (
    <div className="flex flex-row items-center space-x-2">
      <div className="flex flex-row text-sm text-gray-400 whitespace-nowrap">
        Step {currentStep + 1} of {numSteps}
      </div>

      <div className="h-3 bg-gray-200 rounded-full min-w-24">
        <div
          className="h-full bg-sky-600 rounded-full"
          style={{ width: `${((currentStep + 1) / numSteps) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

export const DefaultWizardActions: FC<{
  next: () => void;
  prev: () => void;
  currentStep: number;
  onClose: () => void;
}> = ({ next, prev, currentStep, onClose }) => {
  return (
    <div className="flex items-center justify-end space-x-3 m-2">
      {currentStep === 0 ? (
        <Button
          ariaLabel="Cancel"
          variant="secondary"
          size="lg"
          onClick={onClose}
        >
          Cancel
        </Button>
      ) : (
        <Button
          ariaLabel="Previous"
          variant="secondary"
          size="lg"
          onClick={prev}
        >
          Previous
        </Button>
      )}
      <Button
        ariaLabel="Next"
        variant="primary"
        size="lg"
        onClick={next}
      >
        Next
      </Button>
    </div>
  );
};