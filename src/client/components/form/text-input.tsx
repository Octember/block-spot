import { forwardRef, InputHTMLAttributes } from "react";

export const TextInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ ...props }, ref) => {
  return (
    <input
      ref={ref}
      className="border border-gray-300 hover:border-gray-400 rounded-md px-2 py-1 text-md"
      {...props}
    />
  );
});
