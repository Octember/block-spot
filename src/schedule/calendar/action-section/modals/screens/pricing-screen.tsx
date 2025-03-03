import React from "react";
import { Reservation } from "wasp/entities";
import { PriceBreakdownDisplay } from "../../forms/payments-form";

interface PricingScreenProps {
  reservation: Reservation;
  venueId: string;
}

export function PricingScreen({ reservation, venueId }: PricingScreenProps) {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Reservation Summary</h2>
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="text-gray-600">Space:</div>
          <div className="font-medium">Selected Space</div>
          <div className="text-gray-600">Date:</div>
          <div className="font-medium">
            {new Date(reservation.startTime).toLocaleDateString()}
          </div>
          <div className="text-gray-600">Time:</div>
          <div className="font-medium">
            {new Date(reservation.startTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            -
            {new Date(reservation.endTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>

        <PriceBreakdownDisplay
          spaceId={reservation.spaceId}
          venueId={venueId}
          startTime={reservation.startTime}
          endTime={reservation.endTime}
        />
      </div>
    </div>
  );
} 