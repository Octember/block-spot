import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  TransitionChild,
} from "@headlessui/react";
import { ReactNode, useState } from "react";
import Sidebar from "./sidebar";

import {
  ChartPieIcon,
  DocumentDuplicateIcon,
  FolderIcon,
  HomeIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { cn } from "../../cn";
import logo from "../../static/logo.svg";
import { CardHeader } from './page-card';
import { PageHeader } from './page-layout';

type SidebarLayoutProps = {
  children: ReactNode;
  header?: {
    title: string;
    description?: string;
    actions?: ReactNode;
  };
};

const navigation = [
  { name: "Dashboard", href: "#", icon: HomeIcon, current: true },
  { name: "Projects", href: "#", icon: FolderIcon, current: false },
  { name: "Documents", href: "#", icon: DocumentDuplicateIcon, current: false },
  { name: "Reports", href: "#", icon: ChartPieIcon, current: false },
];

export const SidebarLayout = ({ children, header }: SidebarLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div>
      <MenuDialog sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <Sidebar />
      </div>

      <SidebarHeader setSidebarOpen={setSidebarOpen} />

      <main className="pb-10 lg:pl-72">
        {header && <PageHeader {...header} />}

        <div className="px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
};


const MenuDialog = ({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean, setSidebarOpen: (open: boolean) => void }) => {
  return <Dialog
    open={sidebarOpen}
    onClose={setSidebarOpen}
    className="relative z-50 lg:hidden"
  >
    <DialogBackdrop
      transition
      className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-[closed]:opacity-0"
    />

    <div className="fixed inset-0 flex">
      <DialogPanel
        transition
        className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-[closed]:-translate-x-full"
      >
        <TransitionChild>
          <div className="absolute left-full top-0 flex w-16 justify-center pt-5 duration-300 ease-in-out data-[closed]:opacity-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="-m-2.5 p-2.5"
            >
              <span className="sr-only">Close sidebar</span>
              <XMarkIcon aria-hidden="true" className="size-6 text-white" />
            </button>
          </div>
        </TransitionChild>
        {/* Sidebar component, swap this element with another sidebar if you like */}
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-sky-500 px-6 pb-2">
          <div className="flex h-16 shrink-0 items-center">
            <img className="h-8 w-8" src={logo} alt="BlockSpot" />
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className={cn(
                          item.current
                            ? "bg-sky-700 text-white"
                            : "text-indigo-200 hover:bg-sky-700 hover:text-white",
                          "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold",
                        )}
                      >
                        <item.icon
                          aria-hidden="true"
                          className={cn(
                            item.current
                              ? "text-white"
                              : "text-indigo-200 group-hover:text-white",
                            "size-6 shrink-0",
                          )}
                        />
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
              <li>
                <div className="text-xs/6 font-semibold text-indigo-200">
                  Your teams
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
}

const SidebarHeader = ({ setSidebarOpen }: { setSidebarOpen: (open: boolean) => void }) => {
  return <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-sky-600 px-4 py-4 shadow-sm sm:px-6 lg:hidden">
    <button
      type="button"
      onClick={() => setSidebarOpen(true)}
      className="-m-2.5 p-2.5 text-indigo-200 lg:hidden"
    >
      <span className="sr-only">Open sidebar</span>
      <Bars3Icon aria-hidden="true" className="size-6" />
    </button>
    <div className="flex-1 text-sm/6 font-semibold text-white">
      Dashboard
    </div>
    <a href="#">
      <span className="sr-only">Your profile</span>
      <img
        alt=""
        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
        className="size-8 rounded-full bg-sky-700"
      />
    </a>
  </div>
}