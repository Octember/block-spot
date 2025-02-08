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
  size?: "sm" | "md" | "lg";
  heading?: ModalHeading;
  footer?: ReactNode;
  className?: string;
}) {
  const sizeClass =
    size === "sm"
      ? "sm:max-w-sm"
      : size === "md"
        ? "sm:max-w-md"
        : "sm:max-w-xl";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className={`relative z-9999 ${className}`}
    >
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/50 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
      />

      <div className="fixed inset-0 z-999 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center text-center sm:p-0">
          <DialogPanel
            transition
            className={`
            relative transform rounded-lg bg-white text-left shadow-xl 
            transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 
            data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 w-full ${sizeClass}
             data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95
             `}
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
