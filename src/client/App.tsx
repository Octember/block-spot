import { useEffect, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "wasp/client/auth";
import { updateCurrentUserLastActiveTimestamp } from "wasp/client/operations";
import { routes } from "wasp/client/router";
import "./Main.css";
import NavBar from "./components/NavBar/NavBar";
import { appNavigationItems } from "./components/NavBar/contentSections";
import { useOnboardingRedirect } from "./hooks/useOnboardingRedirect";
import { ToastProvider } from "./toast";
import LogRocket from "logrocket";
import { AuthUser } from "wasp/auth";
import { useCalendarRedirect } from "./hooks/use-calendar-redirect";
import { AuthUserProvider } from "../auth/providers/AuthUserProvider";

// At the top of your main entry file (e.g., index.tsx)
if (typeof window !== "undefined" && !window.process) {
  // @ts-expect-error - This is a workaround to fix the error
  window.process = { env: {} };
}

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
      !location.pathname.startsWith("/plan") &&
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
    <AuthUserProvider user={user || undefined}>
      <ToastProvider>
        {isSchedulePage ? (
          <CalendarPage />
        ) : (
          <AppDashboard>
            <div className="min-h-screen h-full dark:text-white  app-background  font-display">
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
            </div>
          </AppDashboard>
        )}
        {/* <CookieConsentBanner /> */}
      </ToastProvider>
    </AuthUserProvider>
  );
}

const CalendarPage = () => {
  return <Outlet />;
};

const AppDashboard: React.FC<React.PropsWithChildren> = ({ children }) => {
  useOnboardingRedirect();

  useCalendarRedirect();
  return children;
};
