import { useEffect, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "wasp/client/auth";
import { updateCurrentUserLastActiveTimestamp } from "wasp/client/operations";
import { routes } from "wasp/client/router";
import "./Main.css";
import NavBar from "./components/NavBar/NavBar";
import { appNavigationItems } from "./components/NavBar/contentSections";
import CookieConsentBanner from "./components/cookie-consent/Banner";
import { useOnboardingRedirect } from "./hooks/useOnboardingRedirect";
import { ToastProvider } from "./toast";

import LogRocket from "logrocket";
import { AuthUser } from "wasp/auth";

LogRocket.init("myj73s/blockspot");

function useLogRocket(user?: AuthUser) {
  useEffect(() => {
    if (user) {
      LogRocket.identify(user.id, {
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user]);
}

/**
 * use this component to wrap all child components
 * this is useful for templates, themes, and context
 */
export default function App() {
  const location = useLocation();
  const { data: user } = useAuth();

  const navigationItems = appNavigationItems;

  useLogRocket(user || undefined);
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
    return (
      !isSchedulePage &&
      !location.pathname.startsWith("/venue") &&
      !location.pathname.startsWith("/account") &&
      !location.pathname.startsWith("/team")
    );
  }, [location]);

  const isAdminDashboard = useMemo(() => {
    return location.pathname.startsWith("/admin");
  }, [location]);

  useEffect(() => {
    if (user) {
      const lastSeenAt = new Date(user.lastActiveTimestamp);
      const today = new Date();
      if (today.getTime() - lastSeenAt.getTime() > 5 * 60 * 1000) {
        updateCurrentUserLastActiveTimestamp();
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
        className="min-h-screen h-full dark:text-white  app-background  font-display"
        style={
          {
            // background: 'linear-gradient(53deg, rgba(172,217,236,0.5340730042016807) 19%, rgba(252,217,224,0.4668461134453782) 67%, rgba(47,76,115,0.2567620798319328) 93%)',
          }
        }
      >
        <ToastProvider>
          {isAdminDashboard ? (
            <Outlet />
          ) : (
            <>
              {shouldDisplayAppNavBar && (
                <NavBar
                  navigationItems={navigationItems}
                  user={user || undefined}
                />
              )}

              <Outlet />
            </>
          )}
        </ToastProvider>
      </div>
      <CookieConsentBanner />
    </>
  );
}
