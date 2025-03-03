import { User } from "wasp/entities";

export type CreateReservationSteps =
  | "select_details"
  | "pricing"
  | "payment"
  | "confirm"
  | "success"
  | "error";

export type CreateReservationFormInputs = {
  step: CreateReservationSteps;
  date: Date;
  startTimeMinutes: number;
  endTimeMinutes: number;
  spaceId: string;
  title: string;

  user?: User;
};
