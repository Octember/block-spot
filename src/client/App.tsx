import { useEffect, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "wasp/client/auth";
import { updateCurrentUser } from "wasp/client/operations";
import { routes } from "wasp/client/router";
import "./Main.css";
import NavBar from "./components/NavBar/NavBar";
import { appNavigationItems } from "./components/NavBar/contentSections";
import CookieConsentBanner from "./components/cookie-consent/Banner";
import { ToastProvider } from "./toast";
import { useOnboardingRedirect } from "./hooks/useOnboardingRedirect";

import LogRocket from "logrocket";

LogRocket.init("myj73s/blockspot");

/**
 * use this component to wrap all child components
 * this is useful for templates, themes, and context
 */
export default function App() {
  const location = useLocation();
  const { data: user } = useAuth();
  const navigationItems = appNavigationItems;

  useOnboardingRedirect();

  const isSchedulePage = useMemo(
    () =>
      location.pathname ===
      routes.ScheduleRoute.build({
        params: { venueId: location.pathname.split("/").pop() || 0 },
      }),
    [location],
  );

  const shouldDisplayAppNavBar = useMemo(() => {
    return !isSchedulePage && !location.pathname.startsWith("/venue");
  }, [location]);

  const isAdminDashboard = useMemo(() => {
    return location.pathname.startsWith("/admin");
  }, [location]);

  useEffect(() => {
    if (user) {
      const lastSeenAt = new Date(user.lastActiveTimestamp);
      const today = new Date();
      if (today.getTime() - lastSeenAt.getTime() > 5 * 60 * 1000) {
        updateCurrentUser({ lastActiveTimestamp: today });
      }
    }
  }, [user]);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView();
      }
    }
  }, [location]);

  return (
    <>
      <div
        className="min-h-screen h-full dark:text-white "
        style={{
          backgroundImage:
            "url(https://fly.io/phx/ui/images/app-shapes-e20dd6e0903d3a31595108e6e1052a1e.webp?vsn=d)",
        }}
      >
        <ToastProvider>
          {isAdminDashboard ? (
            <Outlet />
          ) : (
            <>
              {shouldDisplayAppNavBar && (
                <NavBar navigationItems={navigationItems} />
              )}

              {!isSchedulePage ? (
                // <div className="mx-auto max-w-full overflow-y-auto h-full">
                <Outlet />
              ) : (
                // </div>
                <Outlet />
              )}
            </>
          )}
        </ToastProvider>
      </div>
      <CookieConsentBanner />
    </>
  );
}
