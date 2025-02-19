import { forwardRef, InputHTMLAttributes } from "react";

const HeightMap = {
  // sm: "h-6",
  md: "h-8",
  lg: "h-12",
} as const;

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ReactNode;
  size?: keyof typeof HeightMap;
};

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ size, icon, ...props }, ref) => {
    const height = size ? HeightMap[size] : HeightMap["md"];

    return (
      <div className="relative flex flex-row">
        <input
          {...props}
          ref={ref}
          className={`
          flex flex-grow
        border border-gray-300 hover:border-gray-400 focus:border-teal-700 focus:border-2 focus:ring-0 focus:outline-none
         rounded-md px-2 py-1 text-md ${height} ${props.className}
      `}
        ></input>
        {icon && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {icon}
          </div>
        )}
      </div>
    );
  },
);

TextInput.displayName = "TextInput";
