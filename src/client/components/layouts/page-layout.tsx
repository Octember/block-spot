import { ReactNode } from "react";

type PageLayoutProps = {
  children: ReactNode;
  header?: {
    title: string;
    description?: string;
    actions?: ReactNode;
  };
};

export const PageLayout = ({ children, header }: PageLayoutProps) => {
  return (
    <div className="my-8 lg:w-[80%] xl:w-[70%] mx-auto">
      {header && <PageHeader {...header} />}
      {children}
    </div>
  );
};

export const PageHeader = ({
  title,
  description,
  actions,
}: NonNullable<PageLayoutProps["header"]>) => {
  return (
    <div className="px-6 lg:px-8 py-4 flex flex-row justify-between">
      <div>
        <h2 className="font-semibold text-2xl text-navy-900">{title}</h2>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      {actions && (
        <div className="flex flex-row items-center gap-2">{actions}</div>
      )}
    </div>
  );
};
