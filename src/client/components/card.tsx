import { FC, ReactNode } from "react";
import { cn } from "../cn";

interface CardProps {
  heading?: {
    title: string;
    description?: string;
  };
  children: ReactNode;
  className?: string;
}

export const Card: FC<CardProps> = ({ children, className, heading }) => {
  return (
    <div className={cn("card", className)}>
      {heading && (
        <div className="px-4 py-5 sm:px-6 lg:px-8 border-b border-gray-900/10 dark:border-gray-100/10">
          <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            {heading.title}
          </h3>
          {heading.description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {heading.description}
            </p>
          )}
        </div>
      )}

      <div className="px-4 py-5 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
};
