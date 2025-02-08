import { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  description?: string;
  required?: boolean;
  children: ReactNode;
};

export const FormField = ({
  label,
  description,
  required,
  children,
}: FormFieldProps) => {
  return (
    <div className="flex flex-col gap-y-1">
      <label className="text-md font-bold text-gray-700">
        {label}
        {required && <span className="text-red-500 pl-1">*</span>}
      </label>
      {description && (
        <p className="text-sm text-gray-500 pb-1">{description}</p>
      )}
      {children}
    </div>
  );
};
