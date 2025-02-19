import { defineEnvValidationSchema } from "wasp/env";
import { z } from "zod";

export const clientEnvValidationSchema = defineEnvValidationSchema(
  z.object({
    REACT_APP_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  }),
);
