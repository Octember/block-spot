import { UserCircleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "wasp/client/auth";
import { Link as WaspRouterLink } from "wasp/client/router";
import { cn } from "../../cn";
import { useAppNavigation } from "../../hooks/use-app-navigation";
import logo from "../../static/logo.svg";

export default function Sidebar() {
  const { data: user } = useAuth();
  const navItems = useAppNavigation();

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-dustyblue-300 px-6">
      <div className="flex h-14 shrink-0 items-end">
        <WaspRouterLink to="/" className="flex flex-row items-center">
          <img className="h-8 w-8" src={logo} alt="BlockSpot" />
          <span className="ml-2 text-sm font-semibold leading-6 dark:text-white">
            blockspot
          </span>
        </WaspRouterLink>
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
                    {item.count ? (
                      <span
                        aria-hidden="true"
                        className="ml-auto w-9 min-w-max whitespace-nowrap rounded-full bg-white px-2.5 py-0.5 text-center text-xs/5 font-medium text-gray-600 ring-1 ring-inset ring-gray-200"
                      >
                        {item.count}
                      </span>
                    ) : null}
                  </WaspRouterLink>
                </li>
              ))}
            </ul>
          </li>

          <li className="-mx-6 mt-auto">
            <WaspRouterLink
              to="/account"
              className="flex items-center gap-x-4 px-6 py-3 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50"
            >
              <UserCircleIcon className="size-8" />
              <span className="sr-only">Your profile</span>
              <span aria-hidden="true">{user?.email}</span>
            </WaspRouterLink>
          </li>
        </ul>
      </nav>
    </div>
  );
}
