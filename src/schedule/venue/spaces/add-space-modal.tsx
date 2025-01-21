import { useState } from "react";
import { Modal } from "../../../client/components/modal";
import { Button } from "../../../client/components/button";
import { TextInput } from "../../../client/components/form/text-input";
import { Select } from "../../../client/components/form/select";
import { FormField } from "../../../client/components/form/form-field";

export const AddSpaceModal = ({
  open,
  onClose,
  venueId,
}: {
  open: boolean;
  onClose: () => void;
  venueId: string;
}) => {
  const [formData, setFormData] = useState({
    name: "",
    capacity: 1,
    type: { value: "pottery-wheel", label: "Pottery Wheel" },
  });

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

  const handleSubmit = () => {
    // TODO: Implement space creation
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      heading={{
        title: "Add Space",
        description: "Add a new space to your venue",
      }}
    >
      <div className="space-y-4">
        <FormField label="Space Name">
          <TextInput
            type="text"
            placeholder="e.g., Pottery Wheel 1"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />
        </FormField>

        <FormField label="Space Type">
          <Select
            options={spaceTypeOptions}
            value={formData.type}
            onChange={(value) => handleChange("type", value.value)}
          />
        </FormField>

        <FormField label="Capacity">
          <TextInput
            type="number"
            min="1"
            value={formData.capacity}
            onChange={(e) => handleChange("capacity", parseInt(e.target.value))}
          />
        </FormField>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={onClose} ariaLabel="Cancel">
            Cancel
          </Button>
          <Button onClick={handleSubmit} ariaLabel="Add Space">
            Add Space
          </Button>
        </div>
      </div>
    </Modal>
  );
};
