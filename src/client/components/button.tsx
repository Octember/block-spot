import { ReactNode } from "react";
import { cn } from "../cn";

type ButtonProps = {
  ariaLabel: string;
  icon?: ReactNode;
  children?: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "tertiary" | "danger" | "warning";
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
};

export const Button = ({
  ariaLabel,
  icon,
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  className,
  size = "md",
}: ButtonProps) => {
  const variantClasses = {
    primary: "bg-blue-500 hover:bg-blue-600 text-white",
    secondary:
      "bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 hover:border-gray-400",
    tertiary: "bg-white hover:bg-gray-50 text-gray-800",
    danger: "bg-red-500 hover:bg-red-600 text-white",
    warning: "bg-white hover:bg-red-100 border border-red-600 text-red-800",
  };

  const disabledClasses = disabled ? "opacity-75 cursor-not-allowed" : "";

  const sizeClasses = {
    sm: "px-2 py-1 text-sm",
    md: "px-2 py-1 text-sm",
    lg: "px-4 py-2 text-md",
  };

  return (
    <button
      aria-label={ariaLabel}
      disabled={disabled}
      type={type}
      className={cn(
        `inline-flex items-center gap-x-1 rounded-md ${sizeClasses[size]} font-medium shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2  focus-visible:outline-blue-600 ${variantClasses[variant]} ${disabledClasses}`,
        className,
      )}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
};
