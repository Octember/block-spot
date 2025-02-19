import { User } from "wasp/entities";

export type CreateReservationFormInputs = {
  date: Date;
  startTimeMinutes: number;
  endTimeMinutes: number;
  spaceId: string;
  title: string;

  user?: User;

  // Payment related fields
  stripeCheckoutId?: string;
};
