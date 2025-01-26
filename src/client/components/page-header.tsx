import { FC, ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export const PageHeader: FC<PageHeaderProps> = ({ title, description, actions }) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-black dark:text-white">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-4">{actions}</div>}
    </div>
  );
}; 