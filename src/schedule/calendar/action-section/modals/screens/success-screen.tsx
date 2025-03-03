import React from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { api } from "wasp/client/api";
import { Button } from "../../../../../client/components/button";
import { useToast } from "../../../../../client/toast";
import { CreateReservationFormInputs } from "../types";

export function SuccessScreen() {
  const { watch } = useForm<CreateReservationFormInputs>();
  const createdReservation = watch("createdReservation");
  const { venueId } = useParams<{ venueId: string }>();
  const toast = useToast();

  const calendarUrl = venueId ? `${api.getUri()}/calendar/export?venueId=${venueId}` : '';

  const handleCopyCalendarLink = () => {
    navigator.clipboard.writeText(calendarUrl);
    toast({
      title: "Calendar link copied",
      description: "You can now paste this link into your calendar app",
    });
  };

  if (!createdReservation) {
    return (
      <div className="p-4">
        <h1 className="text-lg font-bold pb-4">Reservation created!</h1>
        <p>Your reservation has been successfully created.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold pb-4">Reservation created!</h1>
        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
          Confirmed
        </div>
      </div>

      <div className="border rounded-lg p-4 mb-6 bg-gray-50">
        <div className="grid grid-cols-2 gap-y-3">
          <div className="text-gray-600">Title:</div>
          <div className="font-medium">{createdReservation.description || "Untitled"}</div>

          <div className="text-gray-600">Date:</div>
          <div className="font-medium">
            {new Date(createdReservation.startTime).toLocaleDateString()}
          </div>

          <div className="text-gray-600">Time:</div>
          <div className="font-medium">
            {new Date(createdReservation.startTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })} -
            {new Date(createdReservation.endTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>

          <div className="text-gray-600">Reservation ID:</div>
          <div className="font-medium text-sm">{createdReservation.id}</div>
        </div>
      </div>

      {venueId && (
        <div className="border rounded-lg p-4 bg-blue-50">
          <h3 className="font-medium mb-2">Add to your calendar</h3>
          <p className="text-sm text-gray-600 mb-3">
            Sync this reservation with your favorite calendar app
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyCalendarLink}
              ariaLabel="Copy calendar link"
            >
              Copy Calendar Link
            </Button>
            <a
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Download .ics File
            </a>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Works with Google Calendar, Outlook, Apple Calendar and more
          </p>
        </div>
      )}
    </div>
  );
} 