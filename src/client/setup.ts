import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://7aa6c270ff9ea23691682ec723f49cc8@o4508678930169856.ingest.us.sentry.io/4508679034306560",
  integrations: [],
});

export const setupClient = () => {
  // Client setup logic can be added here
};
