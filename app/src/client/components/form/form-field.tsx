import { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  description?: string;
  children: ReactNode;
};

export const FormField = ({ label, description, children }: FormFieldProps) => {
  return (
    <div className="flex flex-col gap-y-1">
      <label className="text-md font-bold text-gray-700">{label}</label>
      {description && (
        <p className="text-sm text-gray-500 pb-1">{description}</p>
      )}
      {children}
    </div>
  );
};
