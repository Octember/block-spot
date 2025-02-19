import { FC, ReactNode, useState } from "react";
import { Modal } from "./modal";
import { Button } from "./button";
import { ArrowRightCircleIcon } from "@heroicons/react/24/outline";

export type WizardProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  steps: WizardStepType[];
  isSubmitting: boolean;
};

type WizardStepType = {
  title: string;
  description?: string;
  content: ReactNode;
};

export const Wizard: FC<WizardProps> = ({
  open,
  onClose,
  size,
  onSubmit,
  isSubmitting,
  steps,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const ActionSection = () => {
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
            onClick={handlePrevious}
          >
            Previous
          </Button>
        )}
        {currentStep < steps.length - 1 ? (
          <Button
            ariaLabel="Next"
            variant="primary"
            size="lg"
            onClick={handleNext}
          >
            Next
          </Button>
        ) : (
          <Button
            ariaLabel="Submit"
            variant="primary"
            size="lg"
            icon={<ArrowRightCircleIcon className="w-6 h-6" />}
            isLoading={isSubmitting}
            onClick={onSubmit}
          >
            Submit
          </Button>
        )}
      </div>
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size={size}
      heading={{
        title: steps[currentStep].title,
        description: steps[currentStep].description,
        right: (
          <div className="flex flex-col justify-start space-x-2">
            <ProgressBar currentStep={currentStep} numSteps={steps.length} />
          </div>
        ),
      }}
      footer={<ActionSection />}
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
