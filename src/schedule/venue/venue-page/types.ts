export type UpdateVenueFormInputs = {
  name: string;
  spaces: {
    id: string;
    name: string;
  }[];
  displayStart: number;
  displayEnd: number;
  availabilityRules: {
    spaceIds: string[];
    days: string[];
    startTimeMinutes: number;
    endTimeMinutes: number;
  }[];
};
