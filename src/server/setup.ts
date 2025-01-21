import Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

export const setupServer = async () => {
  Sentry.init({
    dsn: "https://6af687685ba78978ef8beae57b4687e4@o4508678930169856.ingest.us.sentry.io/4508678940786688",
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: 1.0,
  });
};
