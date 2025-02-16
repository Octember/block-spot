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

const width = "px-4 sm:px-6 lg:px-8";

export const Card: FC<CardProps> = ({ children, className, heading }) => {
  return (
    <div className={cn("card", className)}>
      {heading && <CardHeading {...heading} />}

      <div className="px-4 py-5 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
};

export const CardHeading = ({ title, description }: { title: string; description?: string }) => {
  return (
    <div
      className={cn(
        "py-5 border-b border-gray-900/10 dark:border-gray-100/10",
        width,
      )}
    >
      <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
    </div>
  );
};