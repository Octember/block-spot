export type BookingStatus = "CONFIRMED" | "PENDING" | "PAID" | "CANCELLED";
export type Tabs = "upcoming" | "past";

export interface BookingType {
  id: string;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  description?: string | null;
  space: {
    id: string;
    name: string;
    venue: {
      id: string;
      name: string;
    };
  };
} 