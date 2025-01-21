import { ReactNode } from "react";

export const PageCard = ({ children }: { children: ReactNode }) => {
  return (
    <div className="my-8 border rounded-3xl bg-white dark:bg-boxdark-2 lg:w-[80%] xl:w-[70%] mx-auto">
      {children}
    </div>
  );
};

export const CardContent = ({ children }: { children: ReactNode }) => {
  return <div className="sm:px-6 lg:px-8 py-6">{children}</div>;
};

export const CardHeader = ({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) => {
  return (
    <header className="px-6 lg:px-8 py-4 border-b">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-lg text-navy-900">{title}</h2>
        <div className="flex flex-row items-center gap-2">{children}</div>
      </div>
    </header>
  );
};
