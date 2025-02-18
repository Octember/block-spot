import { Link as WaspRouterLink } from "wasp/client/router";
import { cn } from "../../cn";
import { useAppNavigation } from "../../hooks/use-app-navigation";
import { LuPlusCircle } from "react-icons/lu";

export default function Sidebar() {
  const navItems = useAppNavigation();

  return (
    <div className="pt-16 flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
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
                        ? "bg-gray-50 text-teal-600"
                        : "text-gray-700 hover:bg-gray-50 hover:text-dustyblue-dark",
                      "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold",
                    )}
                  >
                    <item.icon
                      aria-hidden="true"
                      className={cn(
                        item.current
                          ? "text-teal-600"
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

                    {/* TODO: upsell paywall */}
                    {/* {item.behindPaywall &&
                      <span
                        aria-hidden="true"
                        className="ml-auto w-9 min-w-max"
                      >
                        <LuPlusCircle className="size-6 text-teal-800" />
                      </span>
                    } */}
                  </WaspRouterLink>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
}
