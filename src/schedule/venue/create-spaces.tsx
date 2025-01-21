import {
  ArrowRightIcon,
  DocumentDuplicateIcon,
  MinusCircleIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";
import React, { useState } from "react";
import { Modal } from "../../client/components/modal";
import { Button } from "../../client/components/button";

export const BulkSpaceCreator = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button onClick={() => setShowModal(true)} ariaLabel="Create Spaces">
        Create Spaces
      </Button>
      <BulkSpaceCreatorModal
        open={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};

const BulkSpaceCreatorModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    baseName: "",
    numberingStyle: "number",
    spaceType: "pottery-wheel",
    capacity: 1,
    quantity: 10,
  });

  const handleChange = (
    field: keyof typeof formData,
    value: string | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, formData.quantity + delta);
    handleChange("quantity", newQuantity);
  };

  const generatePreview = () => {
    const items = [];
    for (let i = 1; i <= formData.quantity; i++) {
      items.push(`${formData.baseName} ${i}`);
    }
    return items;
  };

  const handleSubmit = () => {
    // TODO: Implement space creation
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="bg-white rounded-lg w-full max-w-4xl">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Create Multiple Spaces</h2>
          <p className="text-sm text-gray-600 mt-1">
            Quickly add multiple similar spaces
          </p>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Space Template
            </h3>
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="e.g., Pottery Wheel"
                    value={formData.baseName}
                    onChange={(e) => handleChange("baseName", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numbering Style
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-md bg-white"
                    value={formData.numberingStyle}
                    onChange={(e) =>
                      handleChange("numberingStyle", e.target.value)
                    }
                  >
                    <option value="number">Number (1, 2, 3)</option>
                    <option value="letter">Letter (A, B, C)</option>
                    <option value="custom">Custom...</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Space Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-md bg-white"
                    value={formData.spaceType}
                    onChange={(e) => handleChange("spaceType", e.target.value)}
                  >
                    <option value="pottery-wheel">Pottery Wheel</option>
                    <option value="workstation">Workstation</option>
                    <option value="custom">Custom...</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity (per space)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="1"
                    value={formData.capacity}
                    onChange={(e) =>
                      handleChange("capacity", parseInt(e.target.value))
                    }
                    min={1}
                  />
                </div>
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
              <input
                type="number"
                className="w-20 px-3 py-2 border rounded-md text-center"
                value={formData.quantity}
                onChange={(e) =>
                  handleChange("quantity", parseInt(e.target.value))
                }
                min={1}
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
                {generatePreview().map((name, i) => (
                  <div key={i} className="text-sm text-gray-600">
                    {name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

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
              ariaLabel="Create Spaces"
            >
              Create Spaces
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
