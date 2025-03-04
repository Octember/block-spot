import { BookingStatus } from "../types";

interface BookingStatusBadgeProps {
  status: BookingStatus;
}

export const BookingStatusBadge = ({ status }: BookingStatusBadgeProps) => {
  const statusStyles = {
    CONFIRMED: "bg-green-100 text-green-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    PAID: "bg-blue-100 text-blue-800",
    CANCELLED: "bg-red-100 text-red-800"
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}; 