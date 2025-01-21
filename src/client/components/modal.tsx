"use client";

import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { ReactNode } from "react";

export function Modal({
  children,
  open,
  onClose,
  size = "md",
}: {
  children: ReactNode;
  open: boolean;
  onClose: () => void;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "sm"
      ? "sm:max-w-sm"
      : size === "md"
        ? "sm:max-w-md"
        : "sm:max-w-xl";

  return (
    <Dialog open={open} onClose={onClose} className="relative z-10">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/50 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className={`
            relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl 
            transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 
            data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full ${sizeClass}
             sm:p-6 data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95
             `}
          >
            <div>{children}</div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
