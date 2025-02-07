export type UpdateVenueFormInputs = {
  name: string;
  spaces: {
    id: string;
    name: string;
  }[];
  displayStart: number;
  displayEnd: number;
  announcements: string;
  contactEmail: string;
  availabilityRules: {
    spaceIds: string[];
    days: string[];
    startTimeMinutes: number;
    endTimeMinutes: number;
  }[];
};
