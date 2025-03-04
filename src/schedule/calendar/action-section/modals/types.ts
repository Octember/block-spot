import { User, Reservation } from "wasp/entities";

export type CreateReservationSteps =
  | "select_details"
  | "pricing"
  | "payment"
  | "confirm"
  | "success"
  | "error";

export type CreateReservationFormInputs = {
  // reservation fields
  date: Date;
  startTimeMinutes: number;
  endTimeMinutes: number;
  spaceId: string;
  title: string;

  user?: User;

  // Additional form context
  context: {  
    step: CreateReservationSteps;
    
    createdReservation?: Reservation;
    spaceName?: string;
  };
};
