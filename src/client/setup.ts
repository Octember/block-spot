import * as Sentry from "@sentry/react";
import { useEffect } from "react";
import { createRoutesFromChildren, matchRoutes, useLocation, useNavigationType } from "react-router-dom";


Sentry.init({
  dsn: "https://7aa6c270ff9ea23691682ec723f49cc8@o4508678930169856.ingest.us.sentry.io/4508679034306560",
  integrations: [
    Sentry.browserTracingIntegration(),

    Sentry.reactRouterV6BrowserTracingIntegration({
      useEffect: useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
  ],
});

export const setupClient = () => {
  // Client setup logic can be added here
};
