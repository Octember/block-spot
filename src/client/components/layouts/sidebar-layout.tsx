import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  TransitionChild,
} from "@headlessui/react";
import { forwardRef, ReactNode, useState } from "react";
import Sidebar from "./sidebar";

import { XMarkIcon } from "@heroicons/react/20/solid";
import { Bars3Icon, UserCircleIcon } from "@heroicons/react/24/outline";
import { Link as WaspRouterLink } from "wasp/client/router";
import { useAuthUser } from "../../../auth/providers/AuthUserProvider";
import { cn } from "../../cn";
import { useAppNavigation } from "../../hooks/use-app-navigation";
import { LogoComponent } from "../logo";
import { PageHeader } from "./page-layout";

type SidebarLayoutProps = {
  children: ReactNode;
  header?: {
    title: string;
    description?: string;
    actions?: ReactNode;
  };
};

export const SidebarLayout = ({ children, header }: SidebarLayoutProps) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <MenuDialog menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      <SidebarHeader setMenuOpen={setMenuOpen} />

      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <Sidebar />
      </div>

      <main className="pb-10 lg:pl-72">
        {header && <PageHeader {...header} />}

        <div className="px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
};

const MenuDialog = ({
  menuOpen,
  setMenuOpen,
}: {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}) => {
  const navItems = useAppNavigation();

  return (
    <Dialog
      open={menuOpen}
      onClose={setMenuOpen}
      className="relative z-999 lg:hidden"
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
            <CloseSidebarButton onClick={() => setMenuOpen(false)} />
          </TransitionChild>
          {/* Sidebar component, swap this element with another sidebar if you like */}
          <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2">
            <div className="mt-4">
              <LogoComponent />
            </div>
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {navItems.map((item) => (
                      <li key={item.name}>
                        <WaspRouterLink
                          to={item.route as any}
                          className={cn(
                            item.current
                              ? "bg-gray-50 text-dustyblue-dark"
                              : "text-gray-700 hover:bg-gray-50 hover:text-dustyblue-dark",
                            "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold",
                          )}
                        >
                          <item.icon
                            aria-hidden="true"
                            className={cn(
                              item.current
                                ? "text-dustyblue-dark"
                                : "text-gray-800 group-hover:text-dustyblue-dark",
                              "size-6 shrink-0",
                            )}
                          />
                          {item.name}
                        </WaspRouterLink>
                      </li>
                    ))}
                  </ul>
                </li>
              </ul>
            </nav>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

const SidebarHeader = ({
  setMenuOpen,
}: {
  setMenuOpen: (open: boolean) => void;
}) => {
  const { user } = useAuthUser();

  return (
    <div className="sticky top-0 z-99 flex items-center gap-x-6 bg-white px-4 py-2 shadow-sm sm:px-6 ">
      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        className="-m-2.5 p-2.5 lg:hidden"
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon aria-hidden="true" className="size-6" />
      </button>
      <div className="flex-1 items-center">
        <LogoComponent />
      </div>

      <WaspRouterLink
        to="/account"
        className="flex items-center gap-x-4 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50"
      >
        <UserCircleIcon className="size-6" />
        <span className="sr-only">Your profile</span>
        <span aria-hidden="true">{user?.email}</span>
      </WaspRouterLink>
    </div>
  );
};

const CloseSidebarButton = forwardRef<
  HTMLButtonElement,
  { onClick: () => void }
>(({ onClick }, ref) => {
  return (
    <div className="absolute left-full top-0 flex w-16 justify-center pt-5 duration-300 ease-in-out data-[closed]:opacity-0">
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className="-m-2.5 p-2.5"
      >
        <span className="sr-only">Close sidebar</span>
        <XMarkIcon aria-hidden="true" className="size-6 text-white" />
      </button>
    </div>
  );
});

CloseSidebarButton.displayName = "CloseSidebarButton";
