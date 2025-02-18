"use client";

import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { ReactNode } from "react";

type ModalHeading = {
  title: string;
  description?: string;
};

export function Modal({
  children,
  open,
  onClose,
  size = "md",
  heading,
  footer,
  className,
}: {
  children: ReactNode;
  open: boolean;
  onClose: () => void;
  size?: "sm" | "md" | "lg" | "xl";
  heading?: ModalHeading;
  footer?: ReactNode;
  className?: string;
}) {
  const sizeClasses = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-xl",
    xl: "sm:max-w-2xl"
  } as const;

  const sizeClass = sizeClasses[size];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className={`relative z-9999 ${className}`}
    >
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/50 transition-opacity ease-out duration-300 opacity-100 
             data-[state=closed]:opacity-0 data-[state=leave]:duration-200"
      />

      <div className="fixed inset-0 z-999 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center text-center sm:p-0">
          <DialogPanel
            transition
            className={`relative transform rounded-lg bg-white text-left shadow-xl transition-all 
              sm:my-8 w-full ${sizeClass} 
              ease-out duration-300 opacity-100 translate-y-0 scale-100 
              data-[state=closed]:opacity-0 data-[state=closed]:translate-y-4 data-[state=closed]:sm:scale-95
              data-[state=leave]:duration-200`}
          >
            {heading && (
              <div className="border-b border-gray-200 py-4 px-6">
                <h2 className="text-xl font-semibold">{heading.title}</h2>
                {heading?.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {heading.description}
                  </p>
                )}
              </div>
            )}
            <div className="py-4 px-6">{children}</div>
            {footer}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
