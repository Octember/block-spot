import "./Main.css";
import NavBar from "./components/NavBar/NavBar";
import CookieConsentBanner from "./components/cookie-consent/Banner";
import { appNavigationItems } from "./components/NavBar/contentSections";
import { landingPageNavigationItems } from "../landing-page/contentSections";
import {
  useMemo,
  useEffect,
  PropsWithChildren,
  FC,
  useState,
  createContext,
  useContext,
} from "react";
import { routes } from "wasp/client/router";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "wasp/client/auth";
import { useIsLandingPage } from "./hooks/useIsLandingPage";
import { updateCurrentUser } from "wasp/client/operations";
import { Transition } from "@headlessui/react";
import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { ToastProvider } from "./toast";

/**
 * use this component to wrap all child components
 * this is useful for templates, themes, and context
 */
export default function App() {
  const location = useLocation();
  const { data: user } = useAuth();
  const isLandingPage = useIsLandingPage();
  const navigationItems = isLandingPage
    ? landingPageNavigationItems
    : appNavigationItems;

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
      location.pathname !== routes.LoginRoute.build() &&
      location.pathname !== routes.SignupRoute.build() &&
      !isSchedulePage
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
        className="min-h-screen h-full dark:text-white"
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
                <div className="mx-auto max-w-full">
                  <Outlet />
                </div>
              ) : (
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
