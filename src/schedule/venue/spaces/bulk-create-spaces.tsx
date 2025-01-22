import {
  ArrowRightIcon,
  DocumentDuplicateIcon,
  MinusCircleIcon,
  PlusCircleIcon,
  QueueListIcon,
} from "@heroicons/react/24/outline";
import React, { useState } from "react";
import { Modal } from "../../../client/components/modal";
import { Button } from "../../../client/components/button";
import { TextInput } from "../../../client/components/form/text-input";
import { Select } from "../../../client/components/form/select";
import { FormField } from "../../../client/components/form/form-field";
import { createSpaces } from "wasp/client/operations";
import { useToast } from "../../../client/toast";

export const BulkSpaceCreator = ({ venueId }: { venueId: string }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        ariaLabel="Create Spaces"
        variant="secondary"
        icon={<QueueListIcon className="size-4" />}
      >
        Create Spaces
      </Button>
      <BulkSpaceCreatorModal
        open={showModal}
        onClose={() => setShowModal(false)}
        venueId={venueId}
      />
    </>
  );
};

const BulkSpaceCreatorModal = ({
  open,
  onClose,
  venueId,
}: {
  open: boolean;
  onClose: () => void;
  venueId: string;
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const [formData, setFormData] = useState({
    baseName: "",
    numberingStyle: { value: "number", label: "Number (1, 2, 3)" },
    spaceType: { value: "pottery-wheel", label: "Pottery Wheel" },
    capacity: 1,
    quantity: 10,
  });

  const numberingStyleOptions = [
    { value: "number", label: "Number (1, 2, 3)" },
    { value: "letter", label: "Letter (A, B, C)" },
    { value: "custom", label: "Custom..." },
  ];

  const spaceTypeOptions = [
    { value: "pottery-wheel", label: "Pottery Wheel" },
    { value: "workstation", label: "Workstation" },
    { value: "custom", label: "Custom..." },
  ];

  const handleChange = (
    field: keyof typeof formData,
    value: string | number | { value: string; label: string },
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, Math.min(100, formData.quantity + delta));
    handleChange("quantity", newQuantity);
  };

  const generateSpaceNames = () => {
    const items = [];
    for (let i = 1; i <= formData.quantity; i++) {
      items.push(`${formData.baseName} ${i}`);
    }
    return items;
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const spaceNames = generateSpaceNames();

      await createSpaces({
        venueId,
        spaces: spaceNames.map((name) => ({
          name,
          capacity: formData.capacity,
          type: formData.spaceType.value,
        })),
      });

      toast({
        title: "Spaces created",
        description: `Successfully created ${formData.quantity} spaces`,
      });
      onClose();
    } catch (err: any) {
      toast({
        title: "Error creating spaces",
        description: err.message || "Please try again",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      heading={{
        title: "Create Multiple Spaces",
        description: "Quickly add multiple similar spaces",
      }}
      footer={
        <div className="flex justify-between items-center p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            This will create {formData.quantity} spaces
          </div>
          <div className="flex gap-3">
            <Button onClick={onClose} variant="tertiary" ariaLabel="Cancel">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              icon={<ArrowRightIcon className="size-5" />}
              disabled={isSubmitting || !formData.baseName}
              ariaLabel="Create Spaces"
            >
              {isSubmitting ? "Creating..." : "Create Spaces"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="bg-white rounded-lg w-full max-w-4xl">
        <div className="">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Space Template
            </h3>
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Base Name">
                  <TextInput
                    type="text"
                    placeholder="e.g., Pottery Wheel"
                    value={formData.baseName}
                    onChange={(e) => handleChange("baseName", e.target.value)}
                  />
                </FormField>
                <FormField label="Numbering Style">
                  <Select
                    options={numberingStyleOptions}
                    value={formData.numberingStyle}
                    onChange={(value) =>
                      handleChange("numberingStyle", value.value)
                    }
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Space Type">
                  <Select
                    options={spaceTypeOptions}
                    value={formData.spaceType}
                    onChange={(value) => handleChange("spaceType", value.value)}
                  />
                </FormField>
                <FormField label="Capacity (per space)">
                  <TextInput
                    type="number"
                    placeholder="1"
                    value={formData.capacity}
                    onChange={(e) =>
                      handleChange("capacity", parseInt(e.target.value))
                    }
                    min={1}
                  />
                </FormField>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              How many spaces?
            </h3>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => handleQuantityChange(-1)}
                variant="tertiary"
                icon={<MinusCircleIcon className="size-5" />}
                ariaLabel="Decrease quantity"
              />
              <TextInput
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  handleChange(
                    "quantity",
                    Math.min(100, parseInt(e.target.value)) || 1,
                  )
                }
                min={1}
                max={100}
              />
              <Button
                onClick={() => handleQuantityChange(1)}
                variant="tertiary"
                icon={<PlusCircleIcon className="size-5" />}
                ariaLabel="Increase quantity"
              />
            </div>
          </div>

          <Button
            onClick={() => setShowPreview(!showPreview)}
            variant="tertiary"
            icon={<DocumentDuplicateIcon className="size-5" />}
            ariaLabel="Preview Generated Spaces"
          >
            Preview Generated Spaces
          </Button>

          {showPreview && (
            <div className="mt-4 p-4 border rounded-lg max-h-48 overflow-y-auto">
              <div className="space-y-2">
                {generateSpaceNames().map((name, i) => (
                  <div key={i} className="text-sm text-gray-600">
                    {name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
