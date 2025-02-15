import cors from "cors";
import { MiddlewareConfigFn } from "wasp/server";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://block-spot.com",
  "https://www.block-spot.com",
  "https://blockspot-client.pages.dev",
];

// Regex to match any subdomain of block-spot.com
const allowedOriginRegex = /^https:\/\/([a-z0-9-]+\.)?block-spot\.com$/i;

export const corsMiddleware: MiddlewareConfigFn = (config) => {
  const isDevelopment = process.env.NODE_ENV === "development";
  const clientUrl = process.env.WASP_WEB_CLIENT_URL ?? "http://localhost:3000";
  
  // Combine your specific allowed origins
  const allowedOrigins = [clientUrl, ...ALLOWED_ORIGINS];

  // Create a function to determine if the request origin is allowed.
  const originFunction = (requestOrigin: string, callback: (err: Error | null, allow: boolean) => void) => {
    if (isDevelopment) {
      // In development, allow everything.
      return callback(null, true);
    }

    // If no origin (e.g., curl or same-origin), allow it.
    if (!requestOrigin) {
      return callback(null, true);
    }

    // Check if the origin is one of your fixed origins...
    if (allowedOrigins.includes(requestOrigin)) {
      return callback(null, true);
    }

    // ...or if it matches the wildcard regex for any subdomain.
    if (allowedOriginRegex.test(requestOrigin)) {
      return callback(null, true);
    }

    // Otherwise, block it.
    return callback(new Error("Not allowed by CORS"), false);
  };

  // Remove default CORS config and set up your custom one.
  config.delete("cors");
  config.set(
    "cors",
    cors({
      origin: originFunction,
    }),
  );

  return config;
};
