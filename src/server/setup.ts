import * as Sentry from "@sentry/node";

import { ServerSetupFn } from "wasp/server";

Sentry.init({
  dsn: "https://6af687685ba78978ef8beae57b4687e4@o4508678930169856.ingest.us.sentry.io/4508678940786688",
});

export const setupServer: ServerSetupFn = async ({ app }) => {
  Sentry.setupExpressErrorHandler(app);
};
