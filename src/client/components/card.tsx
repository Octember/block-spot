import { FC, ReactNode } from "react";
import { cn } from "../cn";
import LoadingSpinner from "../../admin/layout/LoadingSpinner";
import { LoadingSpinnerSmall } from "../../admin/layout/LoadingSpinner";

interface CardProps {
  heading?: {
    title: string;
    description?: string;
  };
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
}

const width = "px-4 sm:px-6 lg:px-8";

export const Card: FC<CardProps> = ({
  children,
  className,
  heading,
  isLoading,
}) => {
  return (
    <div className={cn("card", className)}>
      {heading && <CardHeading {...heading} />}

      {isLoading ? (
        <LoadingSpinnerSmall />
      ) : (
        <div className="px-4 py-5 sm:px-6 lg:px-8">{children}</div>
      )}
    </div>
  );
};

export const CardHeading = ({
  title,
  description,
}: {
  title: string;
  description?: string;
}) => {
  return (
    <div
      className={cn(
        "py-5 border-b border-gray-900/10 dark:border-gray-100/10 bg-gray-100",
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
