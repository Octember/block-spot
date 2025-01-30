import { FC, ReactNode } from "react";
import { cn } from "../cn";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card: FC<CardProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        "bg-white dark:bg-boxdark rounded-lg shadow-sm  p-4 border border-gray-200",
        className,
      )}
    >
      {children}
    </div>
  );
};
