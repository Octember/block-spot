import { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  children: ReactNode;
};

export const FormField = ({ label, children }: FormFieldProps) => {
  return (
    <div className="flex flex-col gap-y-1">
      <label className="text-md font-bold text-gray-700">{label}</label>
      {children}
    </div>
  );
};
