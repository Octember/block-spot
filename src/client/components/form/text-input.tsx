import { forwardRef, InputHTMLAttributes } from "react";

export const TextInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ ...props }, ref) => {
  return (
    <input
      {...props}
      ref={ref}
      className={`
        border border-gray-300 hover:border-gray-400 focus:border-teal-700 focus:border-2 focus:ring-0 focus:outline-none
         rounded-md px-2 py-1 text-md h-8 ${props.className}`}
    />
  );
});

TextInput.displayName = "TextInput";
