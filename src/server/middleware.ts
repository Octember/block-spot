import cors from "cors";
import { MiddlewareConfigFn } from "wasp/server";


const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://block-spot.com",
  "https://www.block-spot.com",
  "https://blockspot-client.pages.dev",
];

export const corsMiddleware: MiddlewareConfigFn = (config) => {

  const isDevelopment = process.env.NODE_ENV === "development";
  const clientUrl = process.env.WASP_WEB_CLIENT_URL ?? "http://localhost:3000";

  // Allow all origins in development, otherwise only allow the client URL.
  const origin = isDevelopment ? "*" : [clientUrl, ...ALLOWED_ORIGINS];

  // Remove the default setup and provide a new custom setup for the CORS middleware
  config.delete("cors");
  config.set(
    "cors",
    cors({
      origin,
    })
  );

  return config;
};
